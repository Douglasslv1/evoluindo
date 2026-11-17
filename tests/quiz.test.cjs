const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const { createService } = require('../lib/service.cjs');

test('simulado uma pergunta por vez: correção imediata, ordem obrigatória e temporizador conferido no servidor', async () => {
  const base = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'evoluindo-quiz-'));
  try {
    const service = createService({ file: path.join(directory, 'data.json') }),
      teacher = await service.session(
        (await service.execute('setup', { password: 'senha-de-teste-forte' })).token
      ),
      classroom = (await service.execute('create-class', { name: 'Turma quiz' }, teacher)).classroom,
      subject = (
        await service.execute('create-subject', { name: 'Disciplina quiz', classId: classroom.id }, teacher)
      ).subject,
      bank = (
        await service.execute('create-question-bank', { subjectId: subject.id, name: 'Banco quiz' }, teacher)
      ).bank;
    for (let index = 0; index < 4; index++)
      await service.execute(
        'save-question',
        {
          bankId: bank.id,
          statement: `Pergunta do quiz ${index + 1}?`,
          options: ['Errada', 'Correta', 'Outra'],
          correct: 1,
          explanation: 'A segunda alternativa é a correta.'
        },
        teacher
      );
    const create = questionSeconds =>
      service.execute(
        'create-simulation',
        {
          classId: classroom.id,
          subjectId: subject.id,
          bankId: bank.id,
          title: 'Quiz cronometrado',
          questionCount: 3,
          maxXp: 90,
          questionSeconds
        },
        teacher
      );
    await assert.rejects(() => create(5), { status: 400 });
    await assert.rejects(() => create(1000), { status: 400 });
    const simulation = (await create(90)).simulation;
    assert.equal(simulation.question_seconds, 90);
    await service.execute('set-simulation-status', { id: simulation.id, status: 'open' }, teacher);
    const student = await service.session(
      (await service.execute('register', { classCode: classroom.code, name: 'Aluno quiz', pin: '121212' }))
        .token
    );
    const attemptRow = async () =>
      (await service.store.get('simulation_attempts', { simulation_id: simulation.id }))[0];
    const ago = ms => new Date(Date.now() - ms).toISOString();
    const answer = (index, value) =>
      service.execute('simulation-answer', { id: simulation.id, index, answer: value }, student);

    // Pergunta 1: só a atual é enviada, com o tempo restante calculado no servidor.
    let start = await service.execute('simulation-start', { id: simulation.id }, student);
    assert.equal(start.question.index, 0);
    assert.equal(start.question.total, 3);
    assert.equal(start.question.correct, undefined);
    assert.ok(start.question.remaining_ms > 85000 && start.question.remaining_ms <= 90000);
    // Recarregar não reinicia o relógio.
    const again = await service.execute('simulation-start', { id: simulation.id }, student);
    assert.equal(again.question.deadline_at, start.question.deadline_at);
    await assert.rejects(() => answer(1, 1), { status: 409 }, 'Não pode responder fora de ordem.');
    await assert.rejects(() => answer(0, -1), { status: 400 }, 'Sem resposta só quando o tempo acaba.');
    let response = await answer(0, 1);
    assert.deepEqual(
      {
        is_correct: response.feedback.is_correct,
        correct: response.feedback.correct,
        chosen: response.feedback.chosen
      },
      { is_correct: true, correct: 1, chosen: 1 }
    );
    assert.equal(response.feedback.explanation, 'A segunda alternativa é a correta.');
    assert.equal(response.next, null);
    assert.equal(response.answered, 1);
    await assert.rejects(() => answer(0, 0), { status: 409 }, 'A resposta não pode ser trocada.');

    // Pergunta 2: o aluno abre, demora mais que o tempo + tolerância e a resposta vale como "sem resposta".
    start = await service.execute('simulation-start', { id: simulation.id }, student);
    assert.equal(start.question.index, 1);
    await service.store.update('simulation_attempts', (await attemptRow()).id, {
      current_started_at: ago(120000)
    });
    response = await answer(1, 1);
    assert.equal(response.feedback.timed_out, true);
    assert.equal(response.feedback.is_correct, false);
    assert.equal(response.feedback.correct, 1, 'Mostra a correta mesmo com o tempo esgotado.');

    // Pergunta 3: o tempo acabou na tela (dentro da tolerância) e o envio automático manda "sem resposta".
    start = await service.execute('simulation-start', { id: simulation.id }, student);
    await service.store.update('simulation_attempts', (await attemptRow()).id, {
      current_started_at: ago(91000)
    });
    response = await answer(2, -1);
    assert.equal(response.feedback.timed_out, true);
    assert.ok(response.result, 'A última resposta encerra o simulado.');
    assert.equal(response.result.score, 1);
    assert.equal(response.result.xp, 30);
    assert.equal(response.result.review.length, 3);
    assert.deepEqual((await attemptRow()).answers, [1, -1, -1]);
    assert.equal(response.state.xpEvents.length, 1);
    await assert.rejects(() => answer(3, 1), { status: 409 });
    await assert.rejects(() => service.execute('simulation-start', { id: simulation.id }, student), {
      status: 409
    });

    // Com temporizador, o envio de todas as respostas de uma vez (páginas antigas) é recusado.
    const timed = (await create(60)).simulation;
    await service.execute('set-simulation-status', { id: timed.id, status: 'open' }, teacher);
    await service.execute('simulation-start', { id: timed.id }, student);
    await assert.rejects(
      () => service.execute('simulation-submit', { id: timed.id, answers: [1, 1, 1] }, student),
      { status: 409 }
    );
    // Responder a pergunta seguinte sem abri-la conta o tempo desde o início: não há como ganhar tempo extra.
    const first = await service.execute('simulation-answer', { id: timed.id, index: 0, answer: 1 }, student);
    assert.equal(first.feedback.is_correct, true);
    const timedAttempt = (await service.store.get('simulation_attempts', { simulation_id: timed.id }))[0];
    await service.store.update('simulation_attempts', timedAttempt.id, { started_at: ago(10 * 60000) });
    const skipped = await service.execute(
      'simulation-answer',
      { id: timed.id, index: 1, answer: 1 },
      student
    );
    assert.equal(skipped.feedback.timed_out, true);
  } finally {
    if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
