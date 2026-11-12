const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const { createService } = require('../lib/service.cjs');
const { normalizeDifficulty, pickBalanced, difficultyCounts } = require('../lib/service/difficulty.cjs');

const levels = rows => difficultyCounts(rows);

test('dificuldade aceita português com ou sem acento e sorteio alterna os níveis', () => {
  assert.equal(normalizeDifficulty('Fácil'), 'easy');
  assert.equal(normalizeDifficulty('media'), 'medium');
  assert.equal(normalizeDifficulty('DIFÍCIL'), 'hard');
  assert.equal(normalizeDifficulty('hard'), 'hard');
  assert.equal(normalizeDifficulty(''), 'medium', 'Sem valor, fica média.');
  assert.equal(normalizeDifficulty(undefined), 'medium');
  assert.equal(normalizeDifficulty('extrema'), null);

  const bank = ['easy', 'medium', 'hard'].flatMap(difficulty =>
    Array.from({ length: 4 }, (_, index) => ({ id: difficulty + index, difficulty }))
  );
  for (let round = 0; round < 20; round++) {
    const picked = pickBalanced(bank, 6);
    assert.deepEqual(levels(picked), { easy: 2, medium: 2, hard: 2 });
    assert.deepEqual(
      picked.map(item => item.difficulty),
      ['easy', 'easy', 'medium', 'medium', 'hard', 'hard'],
      'Do mais fácil ao mais difícil.'
    );
    assert.equal(new Set(picked.map(item => item.id)).size, 6, 'Sem repetição.');
  }
  // Banco desigual: a única difícil sempre entra quando há espaço para os três níveis.
  const uneven = [
    ...Array.from({ length: 10 }, (_, index) => ({ id: 'e' + index, difficulty: 'easy' })),
    { id: 'h', difficulty: 'hard' }
  ];
  for (let round = 0; round < 20; round++) assert.ok(pickBalanced(uneven, 2).some(item => item.id === 'h'));
  // Perguntas antigas, sem o campo, contam como média.
  assert.deepEqual(levels(pickBalanced([{ id: 1 }, { id: 2 }], 5)), { easy: 0, medium: 2, hard: 0 });
});

test('professor cadastra e importa dificuldade; nivelamento, duelos e simulados ficam equilibrados', async () => {
  const base = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'evoluindo-difficulty-'));
  try {
    const service = createService({ file: path.join(directory, 'data.json') }),
      teacher = await service.session(
        (await service.execute('setup', { password: 'senha-de-teste-forte' })).token
      ),
      classroom = (await service.execute('create-class', { name: 'Turma níveis' }, teacher)).classroom,
      subject = (
        await service.execute('create-subject', { name: 'Disciplina níveis', classId: classroom.id }, teacher)
      ).subject,
      bank = (
        await service.execute(
          'create-question-bank',
          { subjectId: subject.id, name: 'Banco níveis' },
          teacher
        )
      ).bank;

    const saved = await service.execute(
      'save-question',
      {
        bankId: bank.id,
        statement: 'Pergunta difícil 0?',
        options: ['A', 'B'],
        correct: 1,
        difficulty: 'difícil'
      },
      teacher
    );
    assert.equal(saved.question.difficulty, 'hard');
    await assert.rejects(
      () =>
        service.execute(
          'save-question',
          {
            bankId: bank.id,
            statement: 'Pergunta inválida?',
            options: ['A', 'B'],
            correct: 1,
            difficulty: 'extrema'
          },
          teacher
        ),
      { status: 400 }
    );
    // Importação com os dois nomes de campo; sem o campo, fica média.
    const imported = [
      ...[1, 2].map(index => ({
        statement: `Pergunta difícil ${index}?`,
        options: ['A', 'B'],
        correct: 1,
        difficulty: 'hard'
      })),
      ...[0, 1, 2].map(index => ({
        statement: `Pergunta fácil ${index}?`,
        options: ['A', 'B'],
        correct: 1,
        dificuldade: 'Fácil'
      })),
      ...[0, 1, 2].map(index => ({ statement: `Pergunta média ${index}?`, options: ['A', 'B'], correct: 1 }))
    ];
    assert.equal(
      (await service.execute('import-questions', { bankId: bank.id, questions: imported }, teacher)).imported,
      8
    );
    const listed = (await service.execute('teacher-state', {}, teacher)).banks.find(
      item => item.id === bank.id
    );
    assert.deepEqual(listed.difficulty_counts, { easy: 3, medium: 3, hard: 3 });
    const exported = await service.execute('export-question-bank', { bankId: bank.id }, teacher);
    assert.deepEqual(levels(exported.questions), { easy: 3, medium: 3, hard: 3 });

    const championship = (
      await service.execute(
        'create-championship',
        {
          classId: classroom.id,
          subjectId: subject.id,
          bankId: bank.id,
          title: 'Copa equilibrada',
          levelingQuestionCount: 6,
          questionCount: 3,
          duelXp: 10,
          winnerBonus: 5
        },
        teacher
      )
    ).championship;
    const stored = (await service.store.get('championships', { id: championship.id }))[0];
    assert.deepEqual(levels(stored.leveling_questions), { easy: 2, medium: 2, hard: 2 });

    const students = [];
    for (let index = 0; index < 2; index++) {
      const student = await service.session(
        (
          await service.execute('register', {
            classCode: classroom.code,
            name: `Aluno nível ${index}`,
            pin: '246810'
          })
        ).token
      );
      students.push(student);
      await service.execute('championship-join', { id: championship.id }, student);
    }
    await service.execute('start-championship', { id: championship.id }, teacher);
    for (const student of students) {
      const leveling = await service.execute('leveling-start', { id: championship.id }, student);
      assert.equal(
        leveling.questions[0].difficulty,
        undefined,
        'O aluno não recebe a dificuldade nem o gabarito.'
      );
      await service.execute('leveling-submit', { id: championship.id, answers: [1, 1, 1, 1, 1, 1] }, student);
    }
    await service.execute('start-knockout', { id: championship.id }, teacher);
    const match = (await service.store.get('duel_matches', { championship_id: championship.id }))[0];
    assert.deepEqual(levels(match.questions), { easy: 1, medium: 1, hard: 1 }, 'Duelo com um de cada nível.');

    const simulation = (
      await service.execute(
        'create-simulation',
        {
          classId: classroom.id,
          subjectId: subject.id,
          bankId: bank.id,
          title: 'Simulado níveis',
          questionCount: 3,
          maxXp: 30
        },
        teacher
      )
    ).simulation;
    const storedSimulation = (await service.store.get('simulations', { id: simulation.id }))[0];
    assert.deepEqual(levels(storedSimulation.questions), { easy: 1, medium: 1, hard: 1 });
  } finally {
    if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
