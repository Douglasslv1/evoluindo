const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const { createService } = require('../lib/service.cjs');
const { attemptStats, pickByDistribution, levelFor } = require('../lib/service/diagnostic.cjs');
const { difficultyCounts } = require('../lib/service/difficulty.cjs');

test('nível pelo aproveitamento ponderado e distribuição exata por dificuldade', () => {
  assert.equal(levelFor(0).key, 'beginner');
  assert.equal(levelFor(39).key, 'beginner');
  assert.equal(levelFor(40).key, 'intermediate');
  assert.equal(levelFor(74).key, 'intermediate');
  assert.equal(levelFor(75).key, 'advanced');
  const questions = [
    { difficulty: 'easy', correct: 0 },
    { difficulty: 'medium', correct: 0 },
    { difficulty: 'hard', correct: 0 }
  ];
  // Pesos 1, 2 e 3: acertar só a difícil vale mais que acertar fácil e média juntas.
  assert.equal(attemptStats(questions, [0, 1, 1]).percent, 17);
  assert.equal(attemptStats(questions, [1, 1, 0]).percent, 50);
  assert.deepEqual(attemptStats(questions, [0, 0, 1]).byLevel, {
    easy: { correct: 1, total: 1 },
    medium: { correct: 1, total: 1 },
    hard: { correct: 0, total: 1 }
  });
  const bank = ['easy', 'medium', 'hard'].flatMap(difficulty =>
    Array.from({ length: 5 }, (_, index) => ({ id: difficulty + index, difficulty }))
  );
  const picked = pickByDistribution(bank, { easy: 3, medium: 1, hard: 2 }, 6).questions;
  assert.deepEqual(difficultyCounts(picked), { easy: 3, medium: 1, hard: 2 });
  assert.deepEqual(
    picked.map(item => item.difficulty),
    ['easy', 'easy', 'easy', 'medium', 'hard', 'hard']
  );
  assert.match(pickByDistribution(bank, { easy: 3, medium: 1, hard: 1 }, 6).error, /soma 5/);
  assert.match(pickByDistribution(bank, { easy: 6, medium: 0, hard: 0 }, 6).error, /5 perguntas fáceis/);
});

test('diagnóstico de 20 perguntas em banco de 50 classifica a turma sem revelar o gabarito', async () => {
  const base = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'evoluindo-diagnostic-'));
  try {
    const service = createService({ file: path.join(directory, 'data.json') }),
      teacher = await service.session(
        (await service.execute('setup', { password: 'senha-de-teste-forte' })).token
      ),
      classroom = (await service.execute('create-class', { name: 'Turma diagnóstico' }, teacher)).classroom,
      subject = (
        await service.execute(
          'create-subject',
          { name: 'Disciplina diagnóstico', classId: classroom.id },
          teacher
        )
      ).subject,
      bank = (
        await service.execute(
          'create-question-bank',
          { subjectId: subject.id, name: 'Banco inicial' },
          teacher
        )
      ).bank;
    // 50 perguntas: 17 fáceis, 17 médias e 16 difíceis.
    const questions = Array.from({ length: 50 }, (_, index) => ({
      statement: `Pergunta diagnóstica ${index + 1}?`,
      options: ['A', 'B', 'C', 'D'],
      correct: index % 4,
      difficulty: index < 17 ? 'fácil' : index < 34 ? 'média' : 'difícil'
    }));
    await service.execute('import-questions', { bankId: bank.id, questions }, teacher);
    const create = extra =>
      service.execute(
        'create-simulation',
        {
          classId: classroom.id,
          subjectId: subject.id,
          bankId: bank.id,
          title: 'Diagnóstico inicial',
          questionCount: 20,
          maxXp: 50,
          kind: 'diagnostic',
          ...extra
        },
        teacher
      );
    await assert.rejects(() => create({ distribution: { easy: 7, medium: 7, hard: 5 } }), { status: 400 });
    await assert.rejects(() => create({ distribution: { easy: 2, medium: 0, hard: 18 } }), { status: 400 });
    await assert.rejects(() => create({ kind: 'prova' }), { status: 400 });
    const simulation = (await create({ distribution: { easy: 7, medium: 7, hard: 6 } })).simulation;
    assert.equal(simulation.kind, 'diagnostic');
    const stored = (await service.store.get('simulations', { id: simulation.id }))[0];
    assert.deepEqual(difficultyCounts(stored.questions), { easy: 7, medium: 7, hard: 6 });
    await service.execute('set-simulation-status', { id: simulation.id, status: 'open' }, teacher);

    const register = async (name, pin) =>
      service.session((await service.execute('register', { classCode: classroom.code, name, pin })).token);
    const [ana, bruno, carla, davi] = [
      await register('Ana', '111111'),
      await register('Bruno', '222222'),
      await register('Carla', '333333'),
      await register('Davi', '444444')
    ];
    // Responde certo só nos níveis indicados; nos demais, marca uma alternativa errada.
    const answer = async (student, rightLevels) => {
      const start = await service.execute('simulation-start', { id: simulation.id }, student);
      assert.equal(start.question.index, 0);
      assert.equal(start.question.correct, undefined);
      assert.equal(start.questions, undefined, 'Só a pergunta atual é enviada.');
      // Uma pergunta por vez; no diagnóstico a resposta é só registrada, sem revelar a correta.
      let response;
      for (const [index, question] of stored.questions.entries()) {
        response = await service.execute(
          'simulation-answer',
          {
            id: simulation.id,
            index,
            answer: rightLevels.includes(question.difficulty) ? question.correct : (question.correct + 1) % 4
          },
          student
        );
        assert.equal(response.feedback.correct, undefined);
        assert.equal(response.feedback.is_correct, undefined);
      }
      return response;
    };
    const anaResult = await answer(ana, ['easy', 'medium', 'hard']),
      brunoResult = await answer(bruno, ['easy']),
      carlaResult = await answer(carla, ['easy', 'medium']);
    await service.execute('simulation-start', { id: simulation.id }, davi);

    // O aluno não recebe gabarito e ganha o XP de participação mesmo errando.
    assert.equal(brunoResult.result.kind, 'diagnostic');
    assert.equal(brunoResult.result.review, undefined);
    assert.equal(brunoResult.result.xp, 50);
    assert.deepEqual(brunoResult.result.byLevel.easy, { correct: 7, total: 7 });
    assert.equal(anaResult.result.score, 20);
    assert.ok(
      carlaResult.state.xpEvents.some(event => event.description === 'Diagnóstico: Diagnóstico inicial')
    );

    await assert.rejects(() => service.execute('simulation-report', { id: simulation.id }, ana), {
      status: 401
    });
    const report = await service.execute('simulation-report', { id: simulation.id }, teacher),
      byName = Object.fromEntries(report.students.map(row => [row.name, row]));
    assert.deepEqual(report.question_mix, { easy: 7, medium: 7, hard: 6 });
    // Pesos: 7×1 + 7×2 + 6×3 = 39 pontos possíveis.
    assert.equal(byName.Ana.level, 'advanced');
    assert.equal(byName.Ana.percent, 100);
    assert.equal(byName.Bruno.level, 'beginner');
    assert.equal(byName.Bruno.percent, 18);
    assert.equal(byName.Carla.level, 'intermediate');
    assert.equal(byName.Carla.percent, 54);
    assert.equal(byName.Davi.status, 'started');
    assert.deepEqual(
      report.levels.map(level => level.count),
      [1, 1, 1]
    );
    // Difíceis foram as mais erradas: 2 de 3 alunos erraram cada uma.
    assert.equal(report.questions[0].difficulty, 'hard');
    assert.equal(report.questions[0].wrong, 2);
    assert.equal(report.questions[0].error_rate, 67);
  } finally {
    if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
