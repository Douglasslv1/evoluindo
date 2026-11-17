// Simulados: realização pelo aluno e gestão pelo professor.
const crypto = require('node:crypto');
const { course, sheets, findTask, publicLesson } = require('../course.cjs');
const { grade } = require('../grader.cjs');
const { problem, hash, verify, clean, cleanText, LATE_GRACE_MS, randomCode } = require('./util.cjs');
const { difficultyOf, pickBalanced } = require('./difficulty.cjs');
const { SIMULATION_KINDS, pickByDistribution, attemptStats, LEVELS } = require('./diagnostic.cjs');

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
    'simulation-start': {
      teacher: false,
      async run(p, auth, ip, action) {
        need(auth, 'student');
        let simulation = (await store.get('simulations', { id: clean(p.id, 1, 50) }))[0];
        if (!simulation || simulation.class_id !== auth.student.class_id || simulation.status !== 'open')
          problem('Este simulado não está disponível.', 403);
        let attempt = (await store.get('simulation_attempts', { simulation_id: simulation.id })).find(
          item => item.student_id === auth.id
        );
        if (attempt?.status === 'completed') problem('Este simulado já foi concluído.', 409);
        if (!attempt)
          attempt = await store.insert(
            'simulation_attempts',
            {
              id: crypto.randomUUID(),
              simulation_id: simulation.id,
              student_id: auth.id,
              answers: [],
              score: null,
              xp: 0,
              status: 'started',
              started_at: new Date().toISOString(),
              completed_at: null
            },
            'simulation_id,student_id'
          );
        return {
          simulation: simulationSafe(simulation),
          attempt: { id: attempt.id, status: attempt.status },
          questions: simulation.questions.map(({ id, statement, options }) => ({ id, statement, options }))
        };
      }
    },
    'simulation-submit': {
      teacher: false,
      async run(p, auth, ip, action) {
        need(auth, 'student');
        if (!(await store.limit('simulation:' + auth.id, 30)))
          problem('Muitas tentativas em sequência. Aguarde um pouco.', 429);
        let simulation = (await store.get('simulations', { id: clean(p.id, 1, 50) }))[0];
        if (!simulation || simulation.class_id !== auth.student.class_id || simulation.status !== 'open')
          problem('Este simulado não está disponível.', 403);
        let attempt = (await store.get('simulation_attempts', { simulation_id: simulation.id })).find(
          item => item.student_id === auth.id
        );
        if (!attempt) problem('Inicie o simulado antes de enviar.', 409);
        if (attempt.status === 'completed') problem('Este simulado já foi concluído.', 409);
        if (!Array.isArray(p.answers) || p.answers.length !== simulation.questions.length)
          problem('Responda todas as perguntas antes de concluir.');
        let answers = p.answers.map(Number);
        if (
          answers.some(
            (answer, index) =>
              !Number.isInteger(answer) || answer < 0 || answer >= simulation.questions[index].options.length
          )
        )
          problem('Uma das respostas é inválida.');
        let score = answers.reduce(
            (total, answer, index) => total + (answer === simulation.questions[index].correct ? 1 : 0),
            0
          ),
          diagnostic = simulation.kind === 'diagnostic',
          // Diagnóstico: XP fixo por participação, para o aluno responder com sinceridade, sem consultar.
          xp = diagnostic
            ? simulation.max_xp
            : Math.round((simulation.max_xp * score) / simulation.questions.length),
          completedAt = new Date().toISOString();
        attempt = await store.update('simulation_attempts', attempt.id, {
          answers,
          score,
          xp,
          status: 'completed',
          completed_at: completedAt
        });
        await store.insert(
          'xp_events',
          {
            id: crypto.randomUUID(),
            student_id: auth.id,
            class_id: auth.student.class_id,
            source_type: 'simulation',
            source_id: simulation.id,
            xp,
            description: (diagnostic ? 'Diagnóstico: ' : 'Simulado: ') + simulation.title,
            created_at: completedAt
          },
          'student_id,source_type,source_id'
        );
        // No diagnóstico o gabarito não é mostrado: quem termina primeiro não pode repassar as respostas.
        // O aluno vê só os acertos por dificuldade; o nível fica no relatório do professor.
        if (diagnostic)
          return {
            result: {
              kind: 'diagnostic',
              score,
              total: simulation.questions.length,
              xp,
              byLevel: attemptStats(simulation.questions, answers).byLevel
            },
            state: await studentState(auth.student)
          };
        return {
          result: {
            score,
            total: simulation.questions.length,
            xp,
            review: simulation.questions.map((question, index) => ({
              statement: question.statement,
              answer: answers[index],
              correct: question.correct,
              options: question.options,
              explanation: question.explanation
            }))
          },
          state: await studentState(auth.student)
        };
      }
    },
    'create-simulation': {
      teacher: true,
      async run(p, auth, ip, action) {
        let classId = clean(p.classId, 1, 50),
          subjectId = clean(p.subjectId, 1, 50),
          bankId = clean(p.bankId, 1, 50),
          [classes, subjects, banks, links, rawQuestions] = await Promise.all([
            store.get('classes', { id: classId }),
            store.get('subjects', { id: subjectId }),
            store.get('question_banks', { id: bankId }),
            store.get('class_subjects', { class_id: classId }),
            store.get('questions', { bank_id: bankId })
          ]),
          cls = classes[0],
          subject = subjects[0],
          bank = banks[0];
        if (!cls || !subject || !bank || bank.subject_id !== subject.id)
          problem('Turma, disciplina ou banco inválido.', 404);
        if (!links.some(link => link.subject_id === subjectId))
          problem('Associe a disciplina à turma antes de criar o simulado.');
        let available = rawQuestions.filter(question => question.active),
          questionCount = Number(p.questionCount),
          maxXp = Number(p.maxXp);
        if (
          !Number.isInteger(questionCount) ||
          questionCount < 1 ||
          questionCount > 50 ||
          questionCount > available.length
        )
          problem('Escolha uma quantidade de perguntas disponível no banco.');
        if (!Number.isInteger(maxXp) || maxXp < 0 || maxXp > 1000)
          problem('Defina um XP máximo entre 0 e 1000.');
        const kind = p.kind === undefined || p.kind === '' ? 'practice' : p.kind;
        if (!SIMULATION_KINDS.includes(kind)) problem('Tipo de simulado inválido.');
        // Distribuição por dificuldade: exata quando o professor informa (ex.: 7 fáceis, 7 médias e 6 difíceis);
        // sem ela, o sorteio alterna os níveis automaticamente.
        let drawn = pickBalanced(available, questionCount);
        if (p.distribution) {
          const result = pickByDistribution(available, p.distribution, questionCount);
          if (result.error) problem(result.error);
          drawn = result.questions;
        }
        let title = clean(p.title, 3, 100),
          questions = drawn.map(question => ({
            id: question.id,
            statement: question.statement,
            options: question.options,
            correct: question.correct,
            explanation: question.explanation,
            difficulty: difficultyOf(question)
          })),
          simulation = await store.insert('simulations', {
            id: crypto.randomUUID(),
            class_id: classId,
            subject_id: subjectId,
            bank_id: bankId,
            bank_revision: bank.revision,
            title,
            kind,
            question_count: questionCount,
            max_xp: maxXp,
            status: 'draft',
            questions,
            created_at: new Date().toISOString()
          });
        return { simulation: simulationSafe(simulation) };
      }
    },
    'set-simulation-status': {
      teacher: true,
      async run(p, auth, ip, action) {
        let simulation = (await store.get('simulations', { id: clean(p.id, 1, 50) }))[0],
          status = clean(p.status, 4, 10);
        if (!simulation) problem('Simulado não encontrado.', 404);
        if (!['open', 'closed'].includes(status)) problem('Estado do simulado inválido.');
        if (simulation.status === 'closed' && status === 'open')
          problem('Um simulado encerrado não pode ser reaberto.');
        simulation = await store.update('simulations', simulation.id, { status });
        return { simulation: simulationSafe(simulation) };
      }
    },
    // Resultado da turma: desempenho por dificuldade, nível de cada aluno, quem ainda não respondeu
    // e as perguntas com mais erros. Pensado para o diagnóstico, mas serve para qualquer simulado.
    'simulation-report': {
      teacher: true,
      async run(p) {
        const simulation = (await store.get('simulations', { id: clean(p.id, 1, 50) }))[0];
        if (!simulation) problem('Simulado não encontrado.', 404);
        const [students, attempts] = await Promise.all([
            store.get('students', { class_id: simulation.class_id }),
            store.get('simulation_attempts', { simulation_id: simulation.id })
          ]),
          questions = simulation.questions,
          rows = students.map(student => {
            const attempt = attempts.find(item => item.student_id === student.id);
            if (attempt?.status !== 'completed')
              return {
                student_id: student.id,
                name: student.name,
                access_code: student.access_code,
                status: attempt ? 'started' : 'pending'
              };
            const stats = attemptStats(questions, attempt.answers);
            return {
              student_id: student.id,
              name: student.name,
              access_code: student.access_code,
              status: 'completed',
              completed_at: attempt.completed_at,
              score: stats.score,
              total: stats.total,
              percent: stats.percent,
              level: stats.level.key,
              level_label: stats.level.label,
              by_level: stats.byLevel
            };
          }),
          completed = attempts.filter(item => item.status === 'completed'),
          questionStats = questions
            .map((question, index) => {
              const wrong = completed.filter(item => item.answers?.[index] !== question.correct).length;
              return {
                position: index + 1,
                statement: question.statement,
                difficulty: difficultyOf(question),
                wrong,
                answered: completed.length,
                error_rate: completed.length ? Math.round((wrong / completed.length) * 100) : 0
              };
            })
            .sort((a, b) => b.wrong - a.wrong || a.position - b.position);
        return {
          simulation: simulationSafe(simulation),
          levels: LEVELS.map(level => ({
            ...level,
            count: rows.filter(row => row.level === level.key).length
          })),
          question_mix: questions.reduce(
            (counts, question) => ({
              ...counts,
              [difficultyOf(question)]: counts[difficultyOf(question)] + 1
            }),
            { easy: 0, medium: 0, hard: 0 }
          ),
          students: rows,
          questions: questionStats
        };
      }
    }
  };
};
