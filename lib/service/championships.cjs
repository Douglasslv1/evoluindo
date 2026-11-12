// Campeonatos: inscrição, nivelamento, duelos, chave ao vivo e relatórios.
const crypto = require('node:crypto');
const { course, sheets, findTask, publicLesson } = require('../course.cjs');
const { grade } = require('../grader.cjs');
const { problem, hash, verify, clean, cleanText, LATE_GRACE_MS, randomCode } = require('./util.cjs');
const { difficultyOf, pickBalanced } = require('./difficulty.cjs');

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
    'championship-join': {
      teacher: false,
      async run(p, auth, ip, action) {
        need(auth, 'student');
        let championship = (await store.get('championships', { id: clean(p.id, 1, 50) }))[0];
        if (
          !championship ||
          championship.class_id !== auth.student.class_id ||
          championship.status !== 'registration'
        )
          problem('As inscrições deste campeonato não estão abertas.', 403);
        await store.insert(
          'championship_participants',
          {
            id: crypto.randomUUID(),
            championship_id: championship.id,
            student_id: auth.id,
            disqualified: false,
            disqualification_reason: null,
            disqualified_at: null,
            leveling_status: 'pending',
            leveling_score: null,
            leveling_time: null,
            leveling_answers: [],
            leveling_started_at: null,
            leveling_completed_at: null,
            joined_at: new Date().toISOString()
          },
          'championship_id,student_id'
        );
        return { state: await studentState(auth.student) };
      }
    },
    'leveling-start': {
      teacher: false,
      async run(p, auth, ip, action) {
        need(auth, 'student');
        let championship = (await store.get('championships', { id: clean(p.id, 1, 50) }))[0];
        if (
          !championship ||
          championship.class_id !== auth.student.class_id ||
          championship.status !== 'leveling'
        )
          problem('O nivelamento não está disponível.', 403);
        let participant = (
          await store.get('championship_participants', { championship_id: championship.id })
        ).find(item => item.student_id === auth.id);
        if (!participant || participant.disqualified)
          problem('Participante não habilitado para o nivelamento.', 403);
        if (participant.leveling_status === 'completed') problem('Seu nivelamento já foi concluído.', 409);
        if (!participant.leveling_started_at)
          participant = await store.update('championship_participants', participant.id, {
            leveling_status: 'started',
            leveling_started_at: new Date().toISOString()
          });
        let questions = championship.leveling_questions || [],
          deadline = new Date(
            new Date(participant.leveling_started_at).getTime() +
              (championship.duration_seconds || 90) * 1000 * questions.length
          );
        return {
          championship: championshipSafe(championship),
          questions: questions.map(({ id, statement, options }) => ({ id, statement, options })),
          started_at: participant.leveling_started_at,
          deadline_at: deadline.toISOString()
        };
      }
    },
    'leveling-submit': {
      teacher: false,
      async run(p, auth, ip, action) {
        need(auth, 'student');
        let championship = (await store.get('championships', { id: clean(p.id, 1, 50) }))[0];
        if (
          !championship ||
          championship.class_id !== auth.student.class_id ||
          championship.status !== 'leveling'
        )
          problem('O nivelamento não está disponível.', 403);
        let participant = (
            await store.get('championship_participants', { championship_id: championship.id })
          ).find(item => item.student_id === auth.id),
          questions = championship.leveling_questions || [];
        if (!participant || participant.disqualified || participant.leveling_status === 'completed')
          problem('Este nivelamento não pode ser enviado.', 409);
        if (!Array.isArray(p.answers) || p.answers.length !== questions.length)
          problem('Responda todas as perguntas do nivelamento.');
        let now = new Date(),
          deadline =
            new Date(participant.leveling_started_at).getTime() +
            (championship.duration_seconds || 90) * 1000 * questions.length,
          expired = now.getTime() >= deadline,
          late = now.getTime() > deadline + LATE_GRACE_MS,
          answers = late ? questions.map(() => -1) : p.answers.map(Number);
        if (
          answers.some(
            (answer, index) =>
              !Number.isInteger(answer) ||
              answer >= questions[index].options.length ||
              (answer < 0 && !expired)
          )
        )
          problem(
            expired
              ? 'Uma resposta do nivelamento é inválida.'
              : 'Responda todas as perguntas do nivelamento.'
          );
        let score = answers.reduce(
            (total, answer, index) => total + (answer === questions[index].correct ? 1 : 0),
            0
          ),
          elapsed = Math.max(
            1,
            Math.min(
              (championship.duration_seconds || 90) * 1000 * questions.length,
              now.getTime() - new Date(participant.leveling_started_at || now).getTime()
            )
          );
        await store.update('championship_participants', participant.id, {
          leveling_status: 'completed',
          leveling_score: score,
          leveling_time: elapsed,
          leveling_answers: answers,
          leveling_completed_at: now.toISOString()
        });
        return { score, total: questions.length, expired, late, state: await studentState(auth.student) };
      }
    },
    'duel-start': {
      teacher: false,
      async run(p, auth, ip, action) {
        need(auth, 'student');
        let match = (await store.get('duel_matches', { id: clean(p.matchId, 1, 50) }))[0];
        if (!match || match.status !== 'open' || ![match.player1_id, match.player2_id].includes(auth.id))
          problem('Nenhum duelo disponível para este aluno.', 403);
        let championship = (await store.get('championships', { id: match.championship_id }))[0];
        if (!championship || championship.status !== 'active') problem('O campeonato não está ativo.', 403);
        match = await settleDuel(match, championship);
        if (match.status !== 'open') problem('Este duelo já foi encerrado.', 409);
        let attempt = (await store.get('duel_attempts', { match_id: match.id })).find(
          item => item.student_id === auth.id
        );
        if (attempt?.status === 'completed') problem('Sua participação neste duelo já foi concluída.', 409);
        if (!attempt)
          attempt = await store.insert(
            'duel_attempts',
            {
              id: crypto.randomUUID(),
              match_id: match.id,
              student_id: auth.id,
              answers: [],
              score: null,
              elapsed_ms: null,
              status: 'started',
              started_at: new Date().toISOString(),
              completed_at: null
            },
            'match_id,student_id'
          );
        return {
          match: { id: match.id, round: match.round, kind: match.kind },
          championship: championshipSafe(championship),
          deadline_at: new Date(
            new Date(attempt.started_at).getTime() + (championship.duration_seconds || 90) * 1000
          ).toISOString(),
          questions: match.questions.map(({ id, statement, options }) => ({ id, statement, options }))
        };
      }
    },
    'duel-focus': {
      teacher: false,
      async run(p, auth, ip, action) {
        need(auth, 'student');
        let match = (await store.get('duel_matches', { id: clean(p.matchId, 1, 50) }))[0],
          eventType = clean(p.eventType, 6, 7);
        if (!match || match.status !== 'open' || ![match.player1_id, match.player2_id].includes(auth.id))
          problem('Duelo não encontrado.', 404);
        if (!['hidden', 'visible'].includes(eventType)) problem('Evento de foco inválido.');
        await store.insert('focus_events', {
          id: crypto.randomUUID(),
          championship_id: match.championship_id,
          match_id: match.id,
          student_id: auth.id,
          event_type: eventType,
          created_at: new Date().toISOString()
        });
        return { ok: true };
      }
    },
    'duel-submit': {
      teacher: false,
      async run(p, auth, ip, action) {
        need(auth, 'student');
        if (!(await store.limit('duel:' + auth.id, 40)))
          problem('Muitas tentativas em sequência. Aguarde um pouco.', 429);
        let match = (await store.get('duel_matches', { id: clean(p.matchId, 1, 50) }))[0];
        if (!match || match.status !== 'open' || ![match.player1_id, match.player2_id].includes(auth.id))
          problem('Este duelo não está disponível.', 403);
        let championship = (await store.get('championships', { id: match.championship_id }))[0],
          attempt = (await store.get('duel_attempts', { match_id: match.id })).find(
            item => item.student_id === auth.id
          );
        if (!attempt || attempt.status === 'completed')
          problem('Inicie o duelo ou aguarde o resultado.', 409);
        if (!Array.isArray(p.answers) || p.answers.length !== match.questions.length)
          problem('Responda todas as perguntas antes de concluir.');
        let now = new Date(),
          deadline = new Date(attempt.started_at).getTime() + (championship.duration_seconds || 90) * 1000,
          expired = now.getTime() >= deadline,
          late = now.getTime() > deadline + LATE_GRACE_MS,
          answers = late ? match.questions.map(() => -1) : p.answers.map(Number);
        if (
          answers.some(
            (answer, index) =>
              !Number.isInteger(answer) ||
              answer >= match.questions[index].options.length ||
              (answer < 0 && !expired)
          )
        )
          problem(
            expired ? 'Uma das respostas é inválida.' : 'Responda todas as perguntas antes de concluir.'
          );
        let score = answers.reduce(
            (total, answer, index) => total + (answer === match.questions[index].correct ? 1 : 0),
            0
          ),
          elapsed = Math.max(
            1,
            Math.min(
              (championship.duration_seconds || 90) * 1000,
              now.getTime() - new Date(attempt.started_at).getTime()
            )
          );
        attempt = await store.update('duel_attempts', attempt.id, {
          answers,
          score,
          elapsed_ms: elapsed,
          status: 'completed',
          completed_at: now.toISOString()
        });
        let resolved = await settleDuel(match, championship);
        return {
          waiting: resolved.status !== 'finished',
          score,
          expired,
          late,
          state: await studentState(auth.student)
        };
      }
    },
    'championship-watch': {
      teacher: false,
      async run(p, auth, ip, action) {
        need(auth, 'student');
        let live = await championshipLive(clean(p.id, 1, 50));
        if (live.championship.class_id !== auth.student.class_id)
          problem('Campeonato não disponível para esta turma.', 403);
        return live;
      }
    },
    'championship-live': {
      teacher: true,
      async run(p, auth, ip, action) {
        return championshipLive(clean(p.id, 1, 50));
      }
    },
    'seed-demo-students': {
      teacher: true,
      async run(p, auth, ip, action) {
        let championship = (await store.get('championships', { id: clean(p.id, 1, 50) }))[0],
          count = Number(p.count || 8);
        if (!championship || championship.status !== 'registration')
          problem('Adicione alunos de demonstração enquanto as inscrições estiverem abertas.', 409);
        if (!Number.isInteger(count) || count < 4 || count > 64)
          problem('Escolha entre 4 e 64 alunos de demonstração.');
        let existing = await store.get('students', { class_id: championship.class_id }),
          start = existing.filter(student => student.name.startsWith('Aluno Demo ')).length + 1,
          pinHash = await hash('123456'),
          created = [];
        for (let index = 0; index < count; index++) {
          let student = await store.insert('students', {
            id: crypto.randomUUID(),
            class_id: championship.class_id,
            name: `Aluno Demo ${String(start + index).padStart(2, '0')}`,
            access_code: randomCode(),
            pin_hash: pinHash,
            version: 1,
            official_grade: null,
            grade_note: '',
            created_at: new Date().toISOString()
          });
          await store.insert(
            'championship_participants',
            {
              id: crypto.randomUUID(),
              championship_id: championship.id,
              student_id: student.id,
              disqualified: false,
              disqualification_reason: null,
              disqualified_at: null,
              leveling_status: 'pending',
              leveling_score: null,
              leveling_time: null,
              leveling_answers: [],
              leveling_started_at: null,
              leveling_completed_at: null,
              joined_at: new Date().toISOString()
            },
            'championship_id,student_id'
          );
          created.push({ name: student.name, access_code: student.access_code, pin: '123456' });
        }
        return { students: created, live: await championshipLive(championship.id) };
      }
    },
    'advance-demo-championship': {
      teacher: true,
      async run(p, auth, ip, action) {
        let championship = (await store.get('championships', { id: clean(p.id, 1, 50) }))[0];
        if (!championship || !['leveling', 'active'].includes(championship.status))
          problem('Inicie o nivelamento ou o mata-mata antes de simular.', 409);
        let [students, participants] = await Promise.all([
            store.get('students', { class_id: championship.class_id }),
            store.get('championship_participants', { championship_id: championship.id })
          ]),
          demoIds = new Set(
            students.filter(student => student.name.startsWith('Aluno Demo ')).map(student => student.id)
          ),
          demoParticipants = participants.filter(item => demoIds.has(item.student_id) && !item.disqualified);
        if (!demoParticipants.length) problem('Este campeonato não possui alunos de demonstração.');
        if (championship.status === 'leveling') {
          let questions = championship.leveling_questions || [];
          await Promise.all(
            demoParticipants
              .filter(item => item.leveling_status !== 'completed')
              .map((item, index) => {
                let score = Math.max(0, questions.length - (index % Math.max(1, questions.length))),
                  answers = questions.map((question, questionIndex) =>
                    questionIndex < score
                      ? question.correct
                      : (question.correct + 1) % question.options.length
                  );
                return store.update('championship_participants', item.id, {
                  leveling_status: 'completed',
                  leveling_score: score,
                  leveling_time: 45000 + index * 3700,
                  leveling_answers: answers,
                  leveling_started_at: new Date(Date.now() - 50000 - index * 3700).toISOString(),
                  leveling_completed_at: new Date().toISOString()
                });
              })
          );
          return { stage: 'leveling', live: await championshipLive(championship.id) };
        }
        let matches = (await store.get('duel_matches', { championship_id: championship.id })).filter(
            match => match.status === 'open' && demoIds.has(match.player1_id) && demoIds.has(match.player2_id)
          ),
          now = new Date().toISOString();
        if (!matches.length) problem('Não há confronto aberto apenas entre alunos de demonstração.');
        for (const match of matches) {
          let p1Answers = match.questions.map(question => question.correct),
            p2Answers = match.questions.map(question => (question.correct + 1) % question.options.length),
            p1Score = match.questions.length,
            p2Score = Math.max(0, match.questions.length - 1);
          await Promise.all([
            store.insert(
              'duel_attempts',
              {
                id: crypto.randomUUID(),
                match_id: match.id,
                student_id: match.player1_id,
                answers: p1Answers,
                score: p1Score,
                elapsed_ms: 42000,
                status: 'completed',
                started_at: new Date(Date.now() - 42000).toISOString(),
                completed_at: now
              },
              'match_id,student_id'
            ),
            store.insert(
              'duel_attempts',
              {
                id: crypto.randomUUID(),
                match_id: match.id,
                student_id: match.player2_id,
                answers: p2Answers,
                score: p2Score,
                elapsed_ms: 51000,
                status: 'completed',
                started_at: new Date(Date.now() - 51000).toISOString(),
                completed_at: now
              },
              'match_id,student_id'
            )
          ]);
          await store.update('duel_matches', match.id, {
            winner_id: match.player1_id,
            loser_id: match.player2_id,
            player1_score: p1Score,
            player2_score: p2Score,
            player1_time: 42000,
            player2_time: 51000,
            status: 'finished'
          });
          await Promise.all(
            [match.player1_id, match.player2_id].map(studentId =>
              store.insert(
                'xp_events',
                {
                  id: crypto.randomUUID(),
                  student_id: studentId,
                  class_id: championship.class_id,
                  source_type: 'duel',
                  source_id: match.id,
                  xp: championship.duel_xp + (studentId === match.player1_id ? championship.winner_bonus : 0),
                  description: 'Duelo de demonstração: ' + championship.title,
                  created_at: now
                },
                'student_id,source_type,source_id'
              )
            )
          );
        }
        await advanceChampionship(championship.id);
        return { stage: 'knockout', live: await championshipLive(championship.id) };
      }
    },
    'create-championship': {
      teacher: true,
      async run(p, auth, ip, action) {
        if (p.durationSeconds === undefined) p.durationSeconds = 90;
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
          problem('Associe a disciplina à turma antes de criar o campeonato.');
        let available = rawQuestions.filter(question => question.active),
          questionCount = Number(p.questionCount),
          levelingQuestionCount = Number(p.levelingQuestionCount || Math.min(20, available.length)),
          duelXp = Number(p.duelXp),
          winnerBonus = Number(p.winnerBonus),
          durationSeconds = Number(p.durationSeconds);
        if (
          !Number.isInteger(questionCount) ||
          questionCount < 1 ||
          questionCount > 20 ||
          questionCount > available.length
        )
          problem('Escolha uma quantidade de perguntas disponível no banco.');
        if (
          !Number.isInteger(levelingQuestionCount) ||
          levelingQuestionCount < 1 ||
          levelingQuestionCount > 50 ||
          levelingQuestionCount > available.length
        )
          problem('Escolha uma quantidade válida para o nivelamento.');
        if (
          !Number.isInteger(duelXp) ||
          duelXp < 0 ||
          duelXp > 500 ||
          !Number.isInteger(winnerBonus) ||
          winnerBonus < 0 ||
          winnerBonus > 500
        )
          problem('Defina recompensas de XP entre 0 e 500.');
        if (!Number.isInteger(durationSeconds) || durationSeconds < 30 || durationSeconds > 600)
          problem('Defina um tempo entre 30 e 600 segundos.');
        let title = clean(p.title, 3, 100),
          pool = available.map(question => ({
            id: question.id,
            statement: question.statement,
            options: question.options,
            correct: question.correct,
            explanation: question.explanation,
            difficulty: difficultyOf(question)
          })),
          // Nivelamento equilibrado: todos respondem às mesmas perguntas, alternando fácil, média e difícil.
          levelingQuestions = pickBalanced(pool, levelingQuestionCount),
          championship = await store.insert('championships', {
            id: crypto.randomUUID(),
            class_id: classId,
            subject_id: subjectId,
            bank_id: bankId,
            bank_revision: bank.revision,
            title,
            question_count: questionCount,
            leveling_question_count: levelingQuestionCount,
            leveling_questions: levelingQuestions,
            duel_xp: duelXp,
            winner_bonus: winnerBonus,
            duration_seconds: durationSeconds,
            status: 'registration',
            question_pool: pool,
            champion_id: null,
            runner_up_id: null,
            third_id: null,
            created_at: new Date().toISOString(),
            finished_at: null
          });
        return { championship: championshipSafe(championship) };
      }
    },
    'start-championship': {
      teacher: true,
      async run(p, auth, ip, action) {
        let championship = (await store.get('championships', { id: clean(p.id, 1, 50) }))[0];
        if (!championship || championship.status !== 'registration')
          problem('Este campeonato não pode ser iniciado.', 409);
        let participants = (
          await store.get('championship_participants', { championship_id: championship.id })
        ).filter(item => !item.disqualified);
        if (participants.length < 2) problem('Inscreva pelo menos dois alunos antes de iniciar.');
        let levelingQuestions = championship.leveling_questions?.length
          ? championship.leveling_questions
          : pickBalanced(
              championship.question_pool,
              Math.min(
                championship.leveling_question_count || championship.question_count,
                championship.question_pool.length
              )
            );
        await Promise.all(
          participants.map(item =>
            store.update('championship_participants', item.id, {
              leveling_status: 'pending',
              leveling_score: null,
              leveling_time: null,
              leveling_answers: [],
              leveling_started_at: null,
              leveling_completed_at: null
            })
          )
        );
        await store.update('championships', championship.id, {
          status: 'leveling',
          leveling_question_count: levelingQuestions.length,
          leveling_questions: levelingQuestions
        });
        return { ok: true };
      }
    },
    'start-knockout': {
      teacher: true,
      async run(p, auth, ip, action) {
        let championship = (await store.get('championships', { id: clean(p.id, 1, 50) }))[0];
        if (!championship || championship.status !== 'leveling')
          problem('O mata-mata não pode ser formado agora.', 409);
        let participants = (
          await store.get('championship_participants', { championship_id: championship.id })
        ).filter(item => !item.disqualified);
        if (participants.length < 2) problem('São necessários pelo menos dois participantes habilitados.');
        if (participants.some(item => item.leveling_status !== 'completed'))
          problem('Aguarde todos concluírem o nivelamento.');
        participants.sort(
          (a, b) =>
            b.leveling_score - a.leveling_score ||
            a.leveling_time - b.leveling_time ||
            a.joined_at.localeCompare(b.joined_at)
        );
        let bracketSize = 2 ** Math.ceil(Math.log2(participants.length)),
          byeCount = bracketSize - participants.length,
          byes = participants.slice(0, byeCount),
          remaining = participants.slice(byeCount),
          slots = bracketSize / 2,
          first = Array(slots),
          byePositions = new Set();
        for (let index = 0; index < byes.length; index++)
          byePositions.add(Math.floor((index * slots) / byes.length));
        let byeIndex = 0,
          pairIndex = 0;
        for (let slot = 0; slot < slots; slot++)
          first[slot] = byePositions.has(slot)
            ? [byes[byeIndex++].student_id, null]
            : [remaining[pairIndex++]?.student_id || null, remaining[pairIndex++]?.student_id || null];
        await store.update('championships', championship.id, { status: 'active' });
        await Promise.all(
          first.map((players, slot) =>
            createDuelMatch(championship, 1, slot, players[0], players[1], 'main', participants)
          )
        );
        await advanceChampionship(championship.id);
        return { ok: true };
      }
    },
    'disqualify-participant': {
      teacher: true,
      async run(p, auth, ip, action) {
        let championship = (await store.get('championships', { id: clean(p.id, 1, 50) }))[0],
          studentId = clean(p.studentId, 1, 50),
          reason = clean(p.reason, 5, 500);
        if (!championship || championship.status === 'finished')
          problem('Este campeonato não aceita desclassificações.', 409);
        let participant = (
          await store.get('championship_participants', { championship_id: championship.id })
        ).find(item => item.student_id === studentId);
        if (!participant) problem('Participante não encontrado.', 404);
        if (participant.disqualified) problem('Este participante já foi desclassificado.', 409);
        await store.update('championship_participants', participant.id, {
          disqualified: true,
          disqualification_reason: reason,
          disqualified_at: new Date().toISOString()
        });
        if (championship.status === 'active') {
          let match = (await store.get('duel_matches', { championship_id: championship.id })).find(
            item => item.status === 'open' && [item.player1_id, item.player2_id].includes(studentId)
          );
          if (match) {
            let opponent = match.player1_id === studentId ? match.player2_id : match.player1_id;
            await store.update('duel_matches', match.id, {
              winner_id: opponent,
              loser_id: studentId,
              player1_score: 0,
              player2_score: 0,
              player1_time: 0,
              player2_time: 0,
              status: 'finished'
            });
            await advanceChampionship(championship.id);
          }
        }
        return { ok: true };
      }
    },
    'forfeit-duel': {
      teacher: true,
      async run(p, auth, ip, action) {
        let match = (await store.get('duel_matches', { id: clean(p.matchId, 1, 50) }))[0],
          winner = clean(p.winnerId, 1, 50);
        if (!match || match.status !== 'open' || !match.player1_id || !match.player2_id)
          problem('Este duelo não está em andamento.', 409);
        if (![match.player1_id, match.player2_id].includes(winner))
          problem('Escolha um dos dois alunos do confronto.');
        let championship = (await store.get('championships', { id: match.championship_id }))[0];
        if (!championship || championship.status !== 'active') problem('O campeonato não está ativo.', 409);
        return {
          match: await finishDuel(
            match,
            championship,
            winner,
            await store.get('duel_attempts', { match_id: match.id })
          )
        };
      }
    },
    'championship-report': {
      teacher: true,
      async run(p, auth, ip, action) {
        let championship = (await store.get('championships', { id: clean(p.id, 1, 50) }))[0];
        if (!championship) problem('Campeonato não encontrado.', 404);
        let entries = await store.get('championship_participants', { championship_id: championship.id }),
          students = await store.get('students', { class_id: championship.class_id }),
          matches = await store.get('duel_matches', { championship_id: championship.id }),
          attempts = await store.get('duel_attempts'),
          focusEvents = await store.get('focus_events'),
          xpEvents = await store.get('xp_events', { class_id: championship.class_id }),
          names = Object.fromEntries(students.map(student => [student.id, student.name])),
          questionStats = new Map();
        for (const match of matches) {
          for (const attempt of attempts.filter(
            item => item.match_id === match.id && item.status === 'completed'
          ))
            match.questions.forEach((question, index) => {
              let stat = questionStats.get(question.id) || {
                id: question.id,
                statement: question.statement,
                correct_answer: question.options[question.correct],
                answers: 0,
                errors: 0
              };
              stat.answers++;
              if (attempt.answers[index] !== question.correct) stat.errors++;
              questionStats.set(question.id, stat);
            });
        }
        return {
          championship: championshipSafe(championship),
          podium: {
            champion: names[championship.champion_id] || null,
            runner_up: names[championship.runner_up_id] || null,
            third: names[championship.third_id] || null
          },
          participants: entries.map(entry => ({
            student_id: entry.student_id,
            name: names[entry.student_id] || 'Aluno',
            duels: matches.filter(
              match => [match.player1_id, match.player2_id].includes(entry.student_id) && match.player2_id
            ).length,
            wins: matches.filter(match => match.winner_id === entry.student_id && match.player2_id).length,
            xp: xpEvents
              .filter(
                event =>
                  event.student_id === entry.student_id &&
                  event.source_type === 'duel' &&
                  matches.some(match => match.id === event.source_id)
              )
              .reduce((total, event) => total + event.xp, 0),
            focus_losses: focusEvents.filter(
              event =>
                event.student_id === entry.student_id &&
                event.event_type === 'hidden' &&
                event.championship_id === championship.id
            ).length
          })),
          matches: matches.map(match => ({
            round: match.round,
            kind: match.kind,
            player1: names[match.player1_id] || null,
            player2: names[match.player2_id] || null,
            winner: names[match.winner_id] || null,
            player1_score: match.player1_score,
            player2_score: match.player2_score,
            status: match.status
          })),
          questions: [...questionStats.values()]
            .map(stat => ({
              ...stat,
              error_rate: stat.answers ? Math.round((stat.errors / stat.answers) * 100) : 0
            }))
            .sort((a, b) => b.error_rate - a.error_rate || b.errors - a.errors)
        };
      }
    },
    'championship-disqualifications': {
      teacher: true,
      async run(p, auth, ip, action) {
        let championship = (await store.get('championships', { id: clean(p.id, 1, 50) }))[0];
        if (!championship) problem('Campeonato não encontrado.', 404);
        return {
          participants: (await store.get('championship_participants', { championship_id: championship.id }))
            .filter(item => item.disqualified)
            .map(item => ({
              student_id: item.student_id,
              reason: item.disqualification_reason,
              disqualified_at: item.disqualified_at
            }))
        };
      }
    }
  };
};
