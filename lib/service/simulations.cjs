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
  // Simulado aberto da turma do aluno e a tentativa dele (se existir).
  async function loadForStudent(p, auth) {
    need(auth, 'student');
    const simulation = (await store.get('simulations', { id: clean(p.id, 1, 50) }))[0];
    if (!simulation || simulation.class_id !== auth.student.class_id || simulation.status !== 'open')
      problem('Este simulado não está disponível.', 403);
    const attempt = (await store.get('simulation_attempts', { simulation_id: simulation.id })).find(
      item => item.student_id === auth.id
    );
    return { simulation, attempt };
  }
  // Só o enunciado e as alternativas da pergunta atual: o gabarito e as próximas perguntas ficam no servidor.
  function currentQuestion(simulation, attempt) {
    const index = (attempt.answers || []).length,
      question = simulation.questions[index];
    if (!question) return null;
    const seconds = simulation.question_seconds || null,
      deadline =
        seconds && attempt.current_started_at
          ? new Date(attempt.current_started_at).getTime() + seconds * 1000
          : null;
    return {
      index,
      total: simulation.questions.length,
      statement: question.statement,
      options: question.options,
      seconds,
      deadline_at: deadline ? new Date(deadline).toISOString() : null,
      // Tempo restante medido no servidor: a contagem na tela não depende do relógio do computador do aluno.
      remaining_ms: deadline ? Math.max(0, deadline - Date.now()) : null
    };
  }
  // Fecha a tentativa: pontuação, XP (uma única vez, pela chave do evento) e resultado final.
  async function finishAttempt(simulation, attempt, answers, auth) {
    const score = answers.reduce(
        (total, answer, index) => total + (answer === simulation.questions[index].correct ? 1 : 0),
        0
      ),
      diagnostic = simulation.kind === 'diagnostic',
      // Diagnóstico: XP fixo por participação, para o aluno responder com sinceridade, sem consultar.
      xp = diagnostic
        ? simulation.max_xp
        : Math.round((simulation.max_xp * score) / simulation.questions.length),
      completedAt = new Date().toISOString();
    await store.update('simulation_attempts', attempt.id, {
      answers,
      score,
      xp,
      status: 'completed',
      completed_at: completedAt,
      current_started_at: null
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
        kind: 'diagnostic',
        score,
        total: simulation.questions.length,
        xp,
        byLevel: attemptStats(simulation.questions, answers).byLevel
      };
    return {
      kind: 'practice',
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
    };
  }
  return {
    // Começa ou retoma o simulado na pergunta em que o aluno parou. O relógio da pergunta não recomeça ao recarregar.
    'simulation-start': {
      teacher: false,
      async run(p, auth) {
        let { simulation, attempt } = await loadForStudent(p, auth);
        if (attempt?.status === 'completed') problem('Este simulado já foi concluído.', 409);
        const now = new Date().toISOString();
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
              started_at: now,
              completed_at: null,
              current_started_at: now
            },
            'simulation_id,student_id'
          );
        else if (!attempt.current_started_at)
          attempt = await store.update('simulation_attempts', attempt.id, { current_started_at: now });
        return {
          simulation: simulationSafe(simulation),
          attempt: { id: attempt.id, status: attempt.status },
          question: currentQuestion(simulation, attempt)
        };
      }
    },
    // Responde a pergunta atual. A resposta é gravada antes de o gabarito ser revelado e não pode ser trocada.
    'simulation-answer': {
      teacher: false,
      async run(p, auth) {
        need(auth, 'student');
        if (!(await store.limit('simulation-answer:' + auth.id, 300)))
          problem('Muitas tentativas em sequência. Aguarde um pouco.', 429);
        let { simulation, attempt } = await loadForStudent(p, auth);
        if (!attempt) problem('Inicie o simulado antes de responder.', 409);
        if (attempt.status === 'completed') problem('Este simulado já foi concluído.', 409);
        const answers = (attempt.answers || []).slice(),
          index = Number(p.index),
          question = simulation.questions[answers.length];
        // A pergunta precisa ser a atual: impede responder fora de ordem ou repetir uma já respondida.
        if (!question || index !== answers.length) problem('Esta pergunta já foi respondida.', 409);
        const seconds = simulation.question_seconds || null,
          startedAt = new Date(attempt.current_started_at || attempt.started_at).getTime(),
          elapsed = Date.now() - startedAt,
          expired = seconds !== null && elapsed >= seconds * 1000,
          late = seconds !== null && elapsed > seconds * 1000 + LATE_GRACE_MS;
        let answer = Number(p.answer);
        // -1 = sem resposta, aceito só quando o tempo da pergunta acabou. Depois da tolerância, vale -1 de qualquer forma.
        if (late) answer = -1;
        else if (!Number.isInteger(answer) || answer >= question.options.length || (answer < 0 && !expired))
          problem('Escolha uma das alternativas.');
        if (answer < 0) answer = -1;
        answers.push(answer);
        const isCorrect = answer === question.correct,
          diagnostic = simulation.kind === 'diagnostic',
          // Prática: mostra se acertou e a correta. Diagnóstico: só confirma o registro.
          feedback = diagnostic
            ? { recorded: true, timed_out: answer === -1 }
            : {
                recorded: true,
                timed_out: answer === -1,
                chosen: answer,
                is_correct: isCorrect,
                correct: question.correct,
                explanation: question.explanation || ''
              };
        if (answers.length === simulation.questions.length) {
          const result = await finishAttempt(simulation, attempt, answers, auth);
          return { feedback, next: null, result, state: await studentState(auth.student) };
        }
        // O relógio da próxima pergunta só começa quando o aluno a abrir (simulation-start), para que o tempo
        // lendo a correção não seja descontado. Sem essa abertura, o tempo conta desde o início do simulado.
        await store.update('simulation_attempts', attempt.id, { answers, current_started_at: null });
        return { feedback, next: null, answered: answers.length, total: simulation.questions.length };
      }
    },
    // Envio de todas as respostas de uma vez: só para páginas abertas antes da atualização (sem temporizador
    // e sem respostas já registradas pergunta a pergunta).
    'simulation-submit': {
      teacher: false,
      async run(p, auth) {
        need(auth, 'student');
        if (!(await store.limit('simulation:' + auth.id, 30)))
          problem('Muitas tentativas em sequência. Aguarde um pouco.', 429);
        let { simulation, attempt } = await loadForStudent(p, auth);
        if (!attempt) problem('Inicie o simulado antes de enviar.', 409);
        if (attempt.status === 'completed') problem('Este simulado já foi concluído.', 409);
        if (simulation.question_seconds || (attempt.answers || []).length)
          problem('Atualize a página para responder uma pergunta por vez.', 409);
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
        const result = await finishAttempt(simulation, attempt, answers, auth);
        return { result, state: await studentState(auth.student) };
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
        // Temporizador por pergunta (opcional): vazio ou 0 desliga.
        const questionSeconds =
          p.questionSeconds === undefined || p.questionSeconds === null || Number(p.questionSeconds) === 0
            ? null
            : Number(p.questionSeconds);
        if (
          questionSeconds !== null &&
          (!Number.isInteger(questionSeconds) || questionSeconds < 10 || questionSeconds > 600)
        )
          problem('Use um temporizador entre 10 segundos e 10 minutos por pergunta.');
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
            question_seconds: questionSeconds,
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
