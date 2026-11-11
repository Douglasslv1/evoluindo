const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const { createService } = require('../lib/service.cjs');

test('importa JSON novo e legado atomicamente, detecta duplicidade e exporta backup', async () => {
  const base = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'evoluindo-import-')),
    file = path.join(directory, 'data.json');
  try {
    const service = createService({ file }),
      login = await service.execute('setup', { password: 'senha-de-teste-forte' }),
      teacher = await service.session(login.token),
      subject = (await service.execute('create-subject', { name: 'Banco importado' }, teacher)).subject,
      bank = (await service.execute('create-question-bank', { subjectId: subject.id, name: 'JSON' }, teacher))
        .bank;
    const result = await service.execute(
      'import-questions',
      {
        bankId: bank.id,
        questions: [
          {
            statement: 'Pergunta no formato Evoluindo?',
            options: ['Não', 'Sim', 'Talvez'],
            correct: 1,
            explanation: 'Formato atual.'
          },
          {
            id: 41,
            question: 'Pergunta no formato antigo?',
            options: ['Errada', 'Correta', 'Outra'],
            correct: 'Correta',
            why: 'Formato legado.'
          }
        ]
      },
      teacher
    );
    assert.equal(result.imported, 2);
    assert.equal(result.revision, 2);
    let data = await service.execute('bank-questions', { bankId: bank.id }, teacher);
    assert.equal(data.questions.length, 2);
    assert.equal(data.questions[1].correct, 1);
    assert.equal(data.questions[1].explanation, 'Formato legado.');
    await assert.rejects(
      () =>
        service.execute(
          'import-questions',
          {
            bankId: bank.id,
            questions: [
              { statement: 'Pergunta temporária válida?', options: ['A', 'B'], correct: 0 },
              { statement: 'Pergunta no formato Evoluindo?', options: ['A', 'B'], correct: 0 }
            ]
          },
          teacher
        ),
      /Pergunta 2: enunciado duplicado/
    );
    data = await service.execute('bank-questions', { bankId: bank.id }, teacher);
    assert.equal(data.questions.length, 2);
    const exported = await service.execute('export-question-bank', { bankId: bank.id }, teacher);
    assert.equal(exported.format, 'evoluindo-question-bank-v1');
    assert.equal(exported.subject, 'Banco importado');
    assert.equal(exported.questions.length, 2);
    assert.deepEqual(Object.keys(exported.questions[0]), ['statement', 'options', 'correct', 'explanation']);
    await assert.rejects(() => service.execute('export-question-bank', { bankId: bank.id }, null), {
      status: 401
    });
  } finally {
    if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
