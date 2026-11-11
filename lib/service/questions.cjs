// Bancos de perguntas: cadastro, importação e exportação.
const crypto = require('node:crypto');
const { course, sheets, findTask, publicLesson } = require('../course.cjs');
const { grade } = require('../grader.cjs');
const { problem, hash, verify, clean, cleanText, LATE_GRACE_MS, randomCode } = require('./util.cjs');

// Cada ação recebe (p, auth, ip, action). "teacher: true" exige o acesso do professor antes de executar.
module.exports = ctx => {
  const {
    store,
    coreClassesReady,
    signingSecret,
    sign,
    session,
    studentSafe,
    myProgress,
    subjectsForClass,
    ensureCoreSubject,
    ensureCoreLessons,
    lessonSafe,
    classHasSubject,
    questionData,
    shuffled,
    simulationSafe,
    championshipSafe,
    championshipCatalog,
    championshipLive,
    createDuelMatch,
    advanceChampionship,
    pickWinner,
    finishDuel,
    settleDuel,
    settleChampionship,
    studentState,
    need
  } = ctx;
  return {
    'create-question-bank': {
      teacher: true,
      async run(p, auth, ip, action) {
        let subjectId = clean(p.subjectId, 1, 50),
          [subjects, banks] = await Promise.all([
            store.get('subjects', { id: subjectId }),
            store.get('question_banks', { subject_id: subjectId })
          ]),
          subject = subjects[0];
        if (!subject) problem('Disciplina não encontrada.', 404);
        let name = clean(p.name, 2, 100),
          description = clean(p.description || '', 0, 500);
        if (banks.some(bank => bank.name.localeCompare(name, 'pt-BR', { sensitivity: 'base' }) === 0))
          problem('Já existe um banco com esse nome nesta disciplina.');
        let bank = await store.insert('question_banks', {
          id: crypto.randomUUID(),
          subject_id: subjectId,
          name,
          description,
          active: true,
          revision: 1,
          created_at: new Date().toISOString()
        });
        return { bank };
      }
    },
    'bank-questions': {
      teacher: true,
      async run(p, auth, ip, action) {
        let bank = (await store.get('question_banks', { id: clean(p.bankId, 1, 50) }))[0];
        if (!bank) problem('Banco de perguntas não encontrado.', 404);
        return {
          bank,
          questions: (await store.get('questions', { bank_id: bank.id })).filter(question => question.active)
        };
      }
    },
    'save-question': {
      teacher: true,
      async run(p, auth, ip, action) {
        let bank = (await store.get('question_banks', { id: clean(p.bankId, 1, 50) }))[0];
        if (!bank) problem('Banco de perguntas não encontrado.', 404);
        let values = questionData(p),
          now = new Date().toISOString(),
          question;
        if (p.id) {
          question = (await store.get('questions', { id: clean(p.id, 1, 50) }))[0];
          if (!question || question.bank_id !== bank.id) problem('Pergunta não encontrada neste banco.', 404);
          question = await store.update('questions', question.id, { ...values, updated_at: now });
        } else
          question = await store.insert('questions', {
            id: crypto.randomUUID(),
            bank_id: bank.id,
            ...values,
            active: true,
            created_at: now,
            updated_at: now
          });
        await store.update('question_banks', bank.id, { revision: bank.revision + 1 });
        return { question };
      }
    },
    'delete-question': {
      teacher: true,
      async run(p, auth, ip, action) {
        let question = (await store.get('questions', { id: clean(p.id, 1, 50) }))[0];
        if (!question) problem('Pergunta não encontrada.', 404);
        let bank = (await store.get('question_banks', { id: question.bank_id }))[0];
        await store.update('questions', question.id, { active: false, updated_at: new Date().toISOString() });
        if (bank) await store.update('question_banks', bank.id, { revision: bank.revision + 1 });
        return { ok: true };
      }
    },
    'import-questions': {
      teacher: true,
      async run(p, auth, ip, action) {
        let bank = (await store.get('question_banks', { id: clean(p.bankId, 1, 50) }))[0];
        if (!bank) problem('Banco de perguntas não encontrado.', 404);
        if (!Array.isArray(p.questions) || !p.questions.length || p.questions.length > 500)
          problem('O arquivo deve conter entre 1 e 500 perguntas.');
        let existing = (await store.get('questions', { bank_id: bank.id })).filter(item => item.active),
          seen = new Set(
            existing.map(item => item.statement.toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim())
          ),
          now = new Date().toISOString(),
          rows = [];
        for (let index = 0; index < p.questions.length; index++) {
          let raw = p.questions[index];
          if (!raw || typeof raw !== 'object' || Array.isArray(raw))
            problem(`Pergunta ${index + 1}: estrutura inválida.`);
          let options = raw.options,
            correct = raw.correct;
          if (typeof correct === 'string' && Array.isArray(options))
            correct = options.findIndex(option => String(option).trim() === correct.trim());
          let values;
          try {
            values = questionData({
              statement: raw.statement ?? raw.question,
              options,
              correct,
              explanation: raw.explanation ?? raw.why ?? ''
            });
          } catch (error) {
            problem(`Pergunta ${index + 1}: ${error.message}`);
          }
          let key = values.statement.toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim();
          if (seen.has(key)) problem(`Pergunta ${index + 1}: enunciado duplicado neste arquivo ou no banco.`);
          seen.add(key);
          rows.push({
            id: crypto.randomUUID(),
            bank_id: bank.id,
            ...values,
            active: true,
            created_at: now,
            updated_at: now
          });
        }
        await store.insertMany('questions', rows);
        let updated = await store.update('question_banks', bank.id, { revision: bank.revision + 1 });
        return { imported: rows.length, revision: updated.revision };
      }
    },
    'export-question-bank': {
      teacher: true,
      async run(p, auth, ip, action) {
        let bank = (await store.get('question_banks', { id: clean(p.bankId, 1, 50) }))[0];
        if (!bank) problem('Banco de perguntas não encontrado.', 404);
        let subject = (await store.get('subjects', { id: bank.subject_id }))[0],
          questions = (await store.get('questions', { bank_id: bank.id }))
            .filter(item => item.active)
            .map(({ statement, options, correct, explanation }) => ({
              statement,
              options,
              correct,
              explanation
            }));
        return {
          format: 'evoluindo-question-bank-v1',
          exported_at: new Date().toISOString(),
          subject: subject?.name || '',
          bank: { name: bank.name, description: bank.description, revision: bank.revision },
          questions
        };
      }
    }
  };
};
