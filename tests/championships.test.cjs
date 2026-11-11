const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const { createService } = require('../lib/service.cjs');

test('campeonato usa alunos da turma, forma chaves, duelos, pódio e XP idempotente', async () => {
  const base = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'evoluindo-championship-')),
    file = path.join(directory, 'data.json');
  try {
    const service = createService({ file }),
      login = await service.execute('setup', { password: 'senha-de-teste-forte' }),
      teacher = await service.session(login.token),
      classroom = (await service.execute('create-class', { name: 'Turma campeonato' }, teacher)).classroom,
      subject = (await service.execute('create-subject', { name: 'Conhecimentos Gerais' }, teacher)).subject;
    await service.execute(
      'set-class-subject',
      { classId: classroom.id, subjectId: subject.id, assigned: true },
      teacher
    );
    const bank = (
      await service.execute(
        'create-question-bank',
        { subjectId: subject.id, name: 'Banco do torneio' },
        teacher
      )
    ).bank;
    for (let index = 0; index < 4; index++)
      await service.execute(
        'save-question',
        {
          bankId: bank.id,
          statement: `Questão do duelo ${index + 1}?`,
          options: ['Errada', 'Correta', 'Outra', 'Mais uma'],
          correct: 1
        },
        teacher
      );
    const championship = (
        await service.execute(
          'create-championship',
          {
            classId: classroom.id,
            subjectId: subject.id,
            bankId: bank.id,
            title: 'Copa Evoluindo',
            questionCount: 3,
            duelXp: 30,
            winnerBonus: 20
          },
          teacher
        )
      ).championship,
      sessions = new Map();
    for (let index = 1; index <= 4; index++) {
      const registration = await service.execute('register', {
          classCode: classroom.code,
          name: `Aluno ${index}`,
          pin: `12345${index}`
        }),
        student = await service.session(registration.token);
      sessions.set(student.id, student);
      await service.execute('championship-join', { id: championship.id }, student);
    }
    await service.execute('start-championship', { id: championship.id }, teacher);
    for (const student of sessions.values()) {
      const leveling = await service.execute('leveling-start', { id: championship.id }, student);
      assert.equal(leveling.questions.length, 4);
      await service.execute('leveling-submit', { id: championship.id, answers: [1, 1, 1, 1] }, student);
    }
    await service.execute('start-knockout', { id: championship.id }, teacher);
    async function play(match) {
      const first = sessions.get(match.player1_id),
        second = sessions.get(match.player2_id);
      await service.execute('duel-start', { matchId: match.id }, first);
      await service.execute('duel-start', { matchId: match.id }, second);
      await service.execute('duel-submit', { matchId: match.id, answers: [1, 1, 1] }, first);
      await service.execute('duel-submit', { matchId: match.id, answers: [0, 0, 0] }, second);
    }
    let matches = await service.store.get('duel_matches', { championship_id: championship.id });
    const observed = matches.find(item => item.round === 1 && item.status === 'open');
    await service.execute(
      'duel-focus',
      { matchId: observed.id, eventType: 'hidden' },
      sessions.get(observed.player1_id)
    );
    assert.equal((await service.execute('teacher-state', {}, teacher)).championships[0].focus_count, 1);
    for (const match of matches.filter(item => item.round === 1 && item.status === 'open')) await play(match);
    matches = await service.store.get('duel_matches', { championship_id: championship.id });
    for (const match of matches.filter(item => item.round === 2 && item.status === 'open')) await play(match);
    const finished = (await service.store.get('championships', { id: championship.id }))[0];
    assert.equal(finished.status, 'finished');
    assert.ok(finished.champion_id);
    assert.ok(finished.runner_up_id);
    assert.ok(finished.third_id);
    const events = await service.store.get('xp_events');
    assert.equal(events.length, 8);
    assert.equal(events.filter(event => event.xp === 50).length, 4);
    assert.equal(new Set(events.map(event => event.student_id + ':' + event.source_id)).size, events.length);
    const winnerState = await service.execute('me', {}, sessions.get(finished.champion_id));
    assert.equal(winnerState.championships[0].status, 'finished');
    assert.equal(winnerState.championships[0].matches.filter(match => match.status === 'finished').length, 4);
    const report = await service.execute('championship-report', { id: championship.id }, teacher);
    assert.equal(report.participants.length, 4);
    assert.equal(
      report.podium.champion,
      winnerState.championships[0].participants.find(item => item.student_id === finished.champion_id).name
    );
    assert.ok(report.questions.length >= 3 && report.questions.length <= 4);
    assert.equal(
      report.questions.reduce((total, question) => total + question.answers, 0),
      24
    );
    assert.equal(
      report.participants.reduce((total, item) => total + item.focus_losses, 0),
      1
    );
    await assert.rejects(
      () =>
        service.execute('championship-report', { id: championship.id }, sessions.get(finished.champion_id)),
      { status: 401 }
    );
  } finally {
    if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('nivelamento ordena a chave e concede vagas automáticas aos melhores resultados', async () => {
  const base = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'evoluindo-leveling-')),
    file = path.join(directory, 'data.json');
  try {
    const service = createService({ file }),
      login = await service.execute('setup', { password: 'senha-de-teste-forte' }),
      teacher = await service.session(login.token),
      classroom = (await service.execute('create-class', { name: 'Turma nivelamento' }, teacher)).classroom,
      subject = (
        await service.execute(
          'create-subject',
          { name: 'Disciplina nivelamento', classId: classroom.id },
          teacher
        )
      ).subject,
      bank = (
        await service.execute(
          'create-question-bank',
          { subjectId: subject.id, name: 'Banco nivelamento' },
          teacher
        )
      ).bank;
    for (let index = 0; index < 6; index++)
      await service.execute(
        'save-question',
        {
          bankId: bank.id,
          statement: `Pergunta de nivelamento ${index + 1}?`,
          options: ['Errada', 'Correta'],
          correct: 1
        },
        teacher
      );
    const championship = (
        await service.execute(
          'create-championship',
          {
            classId: classroom.id,
            subjectId: subject.id,
            bankId: bank.id,
            title: 'Copa com ranking',
            levelingQuestionCount: 6,
            questionCount: 2,
            duelXp: 10,
            winnerBonus: 5
          },
          teacher
        )
      ).championship,
      sessions = [];
    for (let index = 0; index < 6; index++) {
      const registration = await service.execute('register', {
          classCode: classroom.code,
          name: `Ranking ${index + 1}`,
          pin: `76543${index}`
        }),
        student = await service.session(registration.token);
      sessions.push(student);
      await service.execute('championship-join', { id: championship.id }, student);
    }
    await service.execute('start-championship', { id: championship.id }, teacher);
    for (let index = 0; index < sessions.length; index++) {
      await service.execute('leveling-start', { id: championship.id }, sessions[index]);
      await service.execute(
        'leveling-submit',
        {
          id: championship.id,
          answers: Array.from({ length: 6 }, (_, question) => (question < 6 - index ? 1 : 0))
        },
        sessions[index]
      );
    }
    await service.execute('start-knockout', { id: championship.id }, teacher);
    const matches = await service.store.get('duel_matches', { championship_id: championship.id }),
      byes = matches.filter(match => match.round === 1 && !match.player2_id);
    assert.equal(matches.filter(match => match.round === 1).length, 4);
    assert.equal(byes.length, 2);
    assert.deepEqual(new Set(byes.map(match => match.winner_id)), new Set([sessions[0].id, sessions[1].id]));
  } finally {
    if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('respostas enviadas depois do prazo e da tolerância não pontuam no nivelamento nem no duelo', async () => {
  const base = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'evoluindo-deadline-')),
    file = path.join(directory, 'data.json');
  try {
    const service = createService({ file }),
      login = await service.execute('setup', { password: 'senha-de-teste-forte' }),
      teacher = await service.session(login.token),
      classroom = (await service.execute('create-class', { name: 'Turma prazo' }, teacher)).classroom,
      subject = (
        await service.execute('create-subject', { name: 'Disciplina prazo', classId: classroom.id }, teacher)
      ).subject,
      bank = (
        await service.execute('create-question-bank', { subjectId: subject.id, name: 'Banco prazo' }, teacher)
      ).bank;
    for (let index = 0; index < 2; index++)
      await service.execute(
        'save-question',
        {
          bankId: bank.id,
          statement: `Pergunta com prazo ${index + 1}?`,
          options: ['Errada', 'Correta'],
          correct: 1
        },
        teacher
      );
    const championship = (
      await service.execute(
        'create-championship',
        {
          classId: classroom.id,
          subjectId: subject.id,
          bankId: bank.id,
          title: 'Copa do prazo',
          levelingQuestionCount: 2,
          questionCount: 2,
          duelXp: 10,
          winnerBonus: 5,
          durationSeconds: 60
        },
        teacher
      )
    ).championship;
    const students = [];
    for (let index = 0; index < 2; index++) {
      const registration = await service.execute('register', {
          classCode: classroom.code,
          name: `Prazo ${index + 1}`,
          pin: `55443${index}`
        }),
        student = await service.session(registration.token);
      students.push(student);
      await service.execute('championship-join', { id: championship.id }, student);
    }
    const [slow, fast] = students,
      ago = ms => new Date(Date.now() - ms).toISOString();
    await service.execute('start-championship', { id: championship.id }, teacher);
    for (const student of students) await service.execute('leveling-start', { id: championship.id }, student);
    const participants = await service.store.get('championship_participants', {
      championship_id: championship.id
    });
    // Nivelamento: 2 perguntas × 60 s = 120 s. O lento envia 60 s após o prazo; o rápido, 3 s após (dentro da tolerância).
    await service.store.update(
      'championship_participants',
      participants.find(item => item.student_id === slow.id).id,
      { leveling_started_at: ago(180000) }
    );
    await service.store.update(
      'championship_participants',
      participants.find(item => item.student_id === fast.id).id,
      { leveling_started_at: ago(123000) }
    );
    const slowLeveling = await service.execute(
        'leveling-submit',
        { id: championship.id, answers: [1, 1] },
        slow
      ),
      fastLeveling = await service.execute('leveling-submit', { id: championship.id, answers: [1, 1] }, fast);
    assert.equal(slowLeveling.late, true);
    assert.equal(slowLeveling.score, 0);
    assert.equal(fastLeveling.late, false);
    assert.equal(fastLeveling.score, 2);
    await service.execute('start-knockout', { id: championship.id }, teacher);
    const match = (await service.store.get('duel_matches', { championship_id: championship.id })).find(
      item => item.status === 'open'
    );
    for (const student of students) await service.execute('duel-start', { matchId: match.id }, student);
    const attempts = await service.store.get('duel_attempts', { match_id: match.id });
    await service.store.update('duel_attempts', attempts.find(item => item.student_id === slow.id).id, {
      started_at: ago(600000)
    });
    await service.store.update('duel_attempts', attempts.find(item => item.student_id === fast.id).id, {
      started_at: ago(63000)
    });
    const slowDuel = await service.execute('duel-submit', { matchId: match.id, answers: [1, 1] }, slow),
      fastDuel = await service.execute('duel-submit', { matchId: match.id, answers: [1, 0] }, fast);
    assert.equal(slowDuel.late, true);
    assert.equal(slowDuel.score, 0);
    assert.equal(fastDuel.late, false);
    assert.equal(fastDuel.score, 1);
    const resolved = (await service.store.get('duel_matches', { id: match.id }))[0];
    assert.equal(resolved.status, 'finished');
    assert.equal(resolved.winner_id, fast.id);
    assert.deepEqual(
      (await service.store.get('duel_attempts', { match_id: match.id })).find(
        item => item.student_id === slow.id
      ).answers,
      [-1, -1]
    );
  } finally {
    if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('duelos travados se resolvem sozinhos e o professor pode encerrar por W.O.', async () => {
  const base = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'evoluindo-settle-')),
    file = path.join(directory, 'data.json');
  try {
    const service = createService({ file }),
      login = await service.execute('setup', { password: 'senha-de-teste-forte' }),
      teacher = await service.session(login.token),
      classroom = (await service.execute('create-class', { name: 'Turma W.O.' }, teacher)).classroom,
      subject = (
        await service.execute('create-subject', { name: 'Disciplina W.O.', classId: classroom.id }, teacher)
      ).subject,
      bank = (
        await service.execute('create-question-bank', { subjectId: subject.id, name: 'Banco W.O.' }, teacher)
      ).bank;
    for (let index = 0; index < 2; index++)
      await service.execute(
        'save-question',
        {
          bankId: bank.id,
          statement: `Pergunta W.O. ${index + 1}?`,
          options: ['Errada', 'Correta'],
          correct: 1
        },
        teacher
      );
    const championship = (
        await service.execute(
          'create-championship',
          {
            classId: classroom.id,
            subjectId: subject.id,
            bankId: bank.id,
            title: 'Copa W.O.',
            levelingQuestionCount: 2,
            questionCount: 2,
            duelXp: 10,
            winnerBonus: 5,
            durationSeconds: 60
          },
          teacher
        )
      ).championship,
      sessions = new Map();
    for (let index = 0; index < 4; index++) {
      const registration = await service.execute('register', {
          classCode: classroom.code,
          name: `Jogador ${index + 1}`,
          pin: `99887${index}`
        }),
        student = await service.session(registration.token);
      sessions.set(student.id, student);
      await service.execute('championship-join', { id: championship.id }, student);
    }
    await service.execute('start-championship', { id: championship.id }, teacher);
    for (const student of sessions.values()) {
      await service.execute('leveling-start', { id: championship.id }, student);
      await service.execute('leveling-submit', { id: championship.id, answers: [1, 1] }, student);
    }
    await service.execute('start-knockout', { id: championship.id }, teacher);
    const [raced, abandoned] = (await service.store.get('duel_matches', { championship_id: championship.id }))
        .filter(match => match.round === 1)
        .sort((a, b) => a.slot - b.slot),
      ago = ms => new Date(Date.now() - ms).toISOString(),
      xpFor = async matchId => await service.store.get('xp_events', { source_id: matchId });
    // Corrida: as duas tentativas foram concluídas, mas ninguém resolveu o confronto.
    for (const id of [raced.player1_id, raced.player2_id])
      await service.execute('duel-start', { matchId: raced.id }, sessions.get(id));
    for (const attempt of await service.store.get('duel_attempts', { match_id: raced.id }))
      await service.store.update('duel_attempts', attempt.id, {
        answers: [1, 1],
        score: attempt.student_id === raced.player1_id ? 2 : 1,
        elapsed_ms: 5000,
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    let live = await service.execute('championship-live', { id: championship.id }, teacher);
    assert.equal(live.matches.find(match => match.id === raced.id).status, 'finished');
    assert.equal(live.matches.find(match => match.id === raced.id).winner_id, raced.player1_id);
    await service.execute('championship-live', { id: championship.id }, teacher);
    assert.equal((await xpFor(raced.id)).length, 2);
    // Abandono: um aluno enviou; o outro abriu o duelo e sumiu depois do prazo.
    await service.execute('duel-start', { matchId: abandoned.id }, sessions.get(abandoned.player1_id));
    await service.execute('duel-start', { matchId: abandoned.id }, sessions.get(abandoned.player2_id));
    const submitted = await service.execute(
      'duel-submit',
      { matchId: abandoned.id, answers: [0, 0] },
      sessions.get(abandoned.player1_id)
    );
    assert.equal(submitted.waiting, true);
    live = await service.execute('championship-live', { id: championship.id }, teacher);
    assert.deepEqual(
      [
        live.matches.find(match => match.id === abandoned.id).player1_state,
        live.matches.find(match => match.id === abandoned.id).player2_state
      ],
      ['completed', 'started']
    );
    await service.store.update(
      'duel_attempts',
      (await service.store.get('duel_attempts', { match_id: abandoned.id })).find(
        item => item.student_id === abandoned.player2_id
      ).id,
      { started_at: ago(120000) }
    );
    live = await service.execute('championship-live', { id: championship.id }, teacher);
    assert.equal(live.matches.find(match => match.id === abandoned.id).status, 'finished');
    // Final: ninguém iniciou. Aluno não pode dar W.O.; professor encerra e o XP vai só para o vencedor.
    const final = live.matches.find(match => match.round === 2 && match.status === 'open');
    assert.ok(final);
    assert.deepEqual([final.player1_state, final.player2_state], ['pending', 'pending']);
    await assert.rejects(
      () =>
        service.execute(
          'forfeit-duel',
          { matchId: final.id, winnerId: final.player1_id },
          sessions.get(final.player1_id)
        ),
      { status: 401 }
    );
    await assert.rejects(
      () => service.execute('forfeit-duel', { matchId: final.id, winnerId: raced.id }, teacher),
      { status: 400 }
    );
    const forfeited = await service.execute(
      'forfeit-duel',
      { matchId: final.id, winnerId: final.player2_id },
      teacher
    );
    assert.equal(forfeited.match.winner_id, final.player2_id);
    const finalXp = await xpFor(final.id);
    assert.equal(finalXp.length, 1);
    assert.equal(finalXp[0].student_id, final.player2_id);
    assert.equal(finalXp[0].xp, 15);
    await assert.rejects(
      () => service.execute('forfeit-duel', { matchId: final.id, winnerId: final.player1_id }, teacher),
      { status: 409 }
    );
  } finally {
    if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('remoção sem filtro é bloqueada no armazenamento', async () => {
  const base = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'evoluindo-remove-'));
  try {
    const service = createService({ file: path.join(directory, 'data.json') });
    await service.execute('setup', { password: 'senha-de-teste-forte' });
    await assert.rejects(() => service.store.remove('settings'), /sem filtro/);
    assert.equal((await service.store.get('settings')).length > 0, true);
  } finally {
    if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('modo demonstração cria alunos fictícios e avança cada etapa até o campeão', async () => {
  const base = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'evoluindo-demo-')),
    file = path.join(directory, 'data.json');
  try {
    const service = createService({ file }),
      login = await service.execute('setup', { password: 'senha-de-teste-forte' }),
      teacher = await service.session(login.token),
      classroom = (await service.execute('create-class', { name: 'Turma demonstração' }, teacher)).classroom,
      subject = (
        await service.execute(
          'create-subject',
          { name: 'Disciplina demonstração', classId: classroom.id },
          teacher
        )
      ).subject,
      bank = (
        await service.execute(
          'create-question-bank',
          { subjectId: subject.id, name: 'Banco demonstração' },
          teacher
        )
      ).bank;
    for (let index = 0; index < 4; index++)
      await service.execute(
        'save-question',
        {
          bankId: bank.id,
          statement: `Pergunta demo ${index + 1}?`,
          options: ['Errada', 'Correta'],
          correct: 1
        },
        teacher
      );
    const championship = (
        await service.execute(
          'create-championship',
          {
            classId: classroom.id,
            subjectId: subject.id,
            bankId: bank.id,
            title: 'Copa demonstrativa',
            levelingQuestionCount: 4,
            questionCount: 2,
            duelXp: 10,
            winnerBonus: 5
          },
          teacher
        )
      ).championship,
      seed = await service.execute('seed-demo-students', { id: championship.id, count: 8 }, teacher);
    assert.equal(seed.students.length, 8);
    assert.ok(seed.students.every(student => student.pin === '123456'));
    await service.execute('start-championship', { id: championship.id }, teacher);
    await service.execute('advance-demo-championship', { id: championship.id }, teacher);
    await service.execute('start-knockout', { id: championship.id }, teacher);
    for (let guard = 0; guard < 5; guard++) {
      const current = (await service.store.get('championships', { id: championship.id }))[0];
      if (current.status === 'finished') break;
      await service.execute('advance-demo-championship', { id: championship.id }, teacher);
    }
    const finished = (await service.store.get('championships', { id: championship.id }))[0];
    assert.equal(finished.status, 'finished');
    assert.ok(finished.champion_id && finished.runner_up_id && finished.third_id);
  } finally {
    if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
