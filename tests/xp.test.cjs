const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const { createService } = require('../lib/service.cjs');
const { xpStatement, parseComplement, complementGrade } = require('../lib/service/xp.cjs');

test('extrato junta missões aprovadas, simulados e duelos; nota complementar é proporcional e limitada', () => {
  const statement = xpStatement(
    [
      { task_id: 'l1-memory', status: 'approved', xp: 100, updated_at: '2026-11-01T10:00:00Z' },
      { task_id: 'l1-cpu', status: 'pending', xp: 0, updated_at: '2026-11-02T10:00:00Z' }
    ],
    [
      { source_type: 'simulation', xp: 80, description: 'Simulado: A', created_at: '2026-11-03T10:00:00Z' },
      { source_type: 'duel', xp: 15, description: 'Duelo: Copa', created_at: '2026-11-04T10:00:00Z' }
    ]
  );
  assert.deepEqual(statement.totals, { mission: 100, simulation: 80, duel: 15, other: 0 });
  assert.equal(statement.total, 195);
  assert.deepEqual(
    statement.entries.map(entry => entry.source),
    ['duel', 'simulation', 'mission'],
    'Lançamentos mais recentes primeiro; entregas pendentes não entram.'
  );
  const config = { maxPoints: 2, targetXp: 1000 };
  assert.equal(complementGrade(0, config), 0);
  assert.equal(complementGrade(500, config), 1);
  assert.equal(complementGrade(333, config), 0.7);
  assert.equal(complementGrade(5000, config), 2, 'Limitada ao máximo.');
  assert.equal(complementGrade(500, null), null, 'Sem configuração, não há nota complementar.');
  assert.equal(parseComplement({ value: '{"maxPoints":0,"targetXp":1000}' }), null);
  assert.equal(parseComplement({ value: 'não é json' }), null);
  assert.deepEqual(parseComplement({ value: '{"maxPoints":1.5,"targetXp":2000}' }), {
    maxPoints: 1.5,
    targetXp: 2000
  });
});

test('professor configura a nota complementar; aluno e relatório recebem o mesmo extrato', async () => {
  const base = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'evoluindo-xp-'));
  try {
    const service = createService({ file: path.join(directory, 'data.json') }),
      teacher = await service.session(
        (await service.execute('setup', { password: 'senha-de-teste-forte' })).token
      ),
      classroom = (await service.execute('create-class', { name: 'Turma XP' }, teacher)).classroom,
      subject = (
        await service.execute('create-subject', { name: 'Disciplina XP', classId: classroom.id }, teacher)
      ).subject,
      bank = (
        await service.execute('create-question-bank', { subjectId: subject.id, name: 'Banco XP' }, teacher)
      ).bank;
    for (let index = 0; index < 2; index++)
      await service.execute(
        'save-question',
        {
          bankId: bank.id,
          statement: `Pergunta XP ${index + 1}?`,
          options: ['Errada', 'Correta'],
          correct: 1
        },
        teacher
      );
    const simulation = (
      await service.execute(
        'create-simulation',
        {
          classId: classroom.id,
          subjectId: subject.id,
          bankId: bank.id,
          title: 'Simulado XP',
          questionCount: 2,
          maxXp: 60
        },
        teacher
      )
    ).simulation;
    await service.execute('set-simulation-status', { id: simulation.id, status: 'open' }, teacher);
    await service.execute('release', { classId: classroom.id, lessons: [1] }, teacher);
    const student = await service.session(
      (await service.execute('register', { classCode: classroom.code, name: 'Aluna XP', pin: '192837' }))
        .token
    );

    // Antes da configuração: desativada para o aluno e no relatório.
    let me = await service.execute('me', {}, student);
    assert.equal(me.complement, null);
    assert.equal(me.xpStatement.total, 0);

    const mission = await service.execute('submit', { taskId: 'l1-memory', payload: { option: 0 } }, student);
    assert.equal(mission.result.status, 'approved');
    await service.execute('simulation-start', { id: simulation.id }, student);
    await service.execute('simulation-submit', { id: simulation.id, answers: [1, 1] }, student);

    // Validações e permissão.
    await assert.rejects(
      () =>
        service.execute('set-complement', { classId: classroom.id, maxPoints: 2, targetXp: 1000 }, student),
      { status: 401 }
    );
    await assert.rejects(
      () =>
        service.execute('set-complement', { classId: classroom.id, maxPoints: 11, targetXp: 1000 }, teacher),
      { status: 400 }
    );
    await assert.rejects(
      () => service.execute('set-complement', { classId: classroom.id, maxPoints: 2, targetXp: 50 }, teacher),
      { status: 400 }
    );
    const saved = await service.execute(
      'set-complement',
      { classId: classroom.id, maxPoints: 2, targetXp: 1000 },
      teacher
    );
    assert.deepEqual(saved.complement, { maxPoints: 2, targetXp: 1000 });
    // Alterar a configuração atualiza o registro existente.
    await service.execute('set-complement', { classId: classroom.id, maxPoints: 2, targetXp: 800 }, teacher);

    me = await service.execute('me', {}, student);
    const expectedTotal = mission.result.xp + 60;
    assert.equal(me.xpStatement.totals.mission, mission.result.xp);
    assert.equal(me.xpStatement.totals.simulation, 60);
    assert.equal(me.xpStatement.total, expectedTotal);
    assert.equal(me.complement.grade, complementGrade(expectedTotal, { maxPoints: 2, targetXp: 800 }));

    const report = await service.execute('class-report', { classId: classroom.id }, teacher),
      summary = report.summaries.find(item => item.student_id === me.student.id);
    assert.equal(summary.total, expectedTotal);
    assert.equal(summary.complement_grade, me.complement.grade);
    assert.equal(report.simulationAttempts.length, 1);
    assert.equal(report.students[0].official_grade, null, 'A nota oficial não é alterada.');

    // Máximo zero desativa a nota complementar.
    await service.execute('set-complement', { classId: classroom.id, maxPoints: 0, targetXp: 800 }, teacher);
    assert.equal((await service.execute('me', {}, student)).complement, null);
    assert.equal(
      (await service.execute('class-report', { classId: classroom.id }, teacher)).summaries[0]
        .complement_grade,
      null
    );
  } finally {
    if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
