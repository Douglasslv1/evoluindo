// Turmas e disciplinas: painel do professor, vínculos, relatório e nota oficial.
const crypto = require('node:crypto');
const { course, sheets, findTask, publicLesson } = require('../course.cjs');
const { grade } = require('../grader.cjs');
const { problem, hash, verify, clean, cleanText, LATE_GRACE_MS, randomCode } = require('./util.cjs');
const { xpStatement, complementGrade, complementKey, COMPLEMENT_LIMITS } = require('./xp.cjs');
const { difficultyCounts } = require('./difficulty.cjs');

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
    need,
    complementConfig
  } = ctx;
  return {
    'teacher-state': {
      teacher: true,
      async run(p, auth, ip, action) {
        let core = await ensureCoreSubject();
        await ensureCoreLessons(
          core,
          (await store.get('classes')).map(item => item.id)
        );
        let [
          classes,
          subjects,
          classSubjects,
          lessons,
          classLessons,
          banks,
          questions,
          simulations,
          attempts,
          championships,
          participants,
          focusEvents
        ] = await Promise.all([
          store.get('classes'),
          store.get('subjects'),
          store.get('class_subjects'),
          store.get('lessons'),
          store.get('class_lessons'),
          store.get('question_banks'),
          store.get('questions'),
          store.get('simulations'),
          store.get('simulation_attempts'),
          store.get('championships'),
          store.get('championship_participants'),
          store.get('focus_events')
        ]);
        // Nomes do pódio dos campeonatos encerrados, para o histórico da turma (só os alunos premiados).
        const podiumIds = [
            ...new Set(
              championships
                .flatMap(item => [item.champion_id, item.runner_up_id, item.third_id])
                .filter(Boolean)
            )
          ],
          podiumNames = Object.fromEntries(
            (await store.get('students', { id: podiumIds })).map(student => [student.id, student.name])
          );
        return {
          classes,
          subjects,
          classSubjects,
          lessons: lessons.filter(item => item.active !== false).map(item => lessonSafe(item)),
          classLessons,
          banks: banks.map(bank => {
            const active = questions.filter(question => question.bank_id === bank.id && question.active);
            return { ...bank, question_count: active.length, difficulty_counts: difficultyCounts(active) };
          }),
          simulations: simulations.map(simulation => ({
            ...simulationSafe(simulation),
            bank_revision: simulation.bank_revision,
            attempt_count: attempts.filter(
              attempt => attempt.simulation_id === simulation.id && attempt.status === 'completed'
            ).length
          })),
          championships: championships.map(championship => ({
            ...championshipSafe(championship),
            podium:
              championship.status === 'finished'
                ? {
                    champion: podiumNames[championship.champion_id] || null,
                    runner_up: podiumNames[championship.runner_up_id] || null,
                    third: podiumNames[championship.third_id] || null
                  }
                : null,
            bank_revision: championship.bank_revision,
            participant_count: participants.filter(
              item => item.championship_id === championship.id && !item.disqualified
            ).length,
            disqualified_count: participants.filter(
              item => item.championship_id === championship.id && item.disqualified
            ).length,
            focus_count: focusEvents.filter(
              event => event.championship_id === championship.id && event.event_type === 'hidden'
            ).length
          })),
          curriculum: course.map(l => ({
            id: l.id,
            title: l.title,
            subtitle: l.subtitle,
            topics: l.topics,
            agenda: l.agenda,
            tasks: l.tasks.map(({ id, title, type, xp, bonus }) => ({ id, title, type, xp, bonus })),
            maxXp: l.tasks.reduce((s, t) => s + t.xp, 0)
          }))
        };
      }
    },
    'create-subject': {
      teacher: true,
      async run(p, auth, ip, action) {
        let name = clean(p.name, 2, 80),
          description = clean(p.description || '', 0, 500),
          classId = p.classId ? clean(p.classId, 1, 50) : null;
        let [subjects, classes] = await Promise.all([
          store.get('subjects'),
          classId ? store.get('classes', { id: classId }) : Promise.resolve([])
        ]);
        if (
          subjects.some(subject => subject.name.localeCompare(name, 'pt-BR', { sensitivity: 'base' }) === 0)
        )
          problem('Já existe uma disciplina com esse nome.');
        if (classId && !classes[0]) problem('Turma não encontrada.', 404);
        let subject = await store.insert('subjects', {
            id: crypto.randomUUID(),
            name,
            description,
            system_key: null,
            active: true,
            created_at: new Date().toISOString()
          }),
          classSubject = classId
            ? await store.insert(
                'class_subjects',
                {
                  id: crypto.randomUUID(),
                  class_id: classId,
                  subject_id: subject.id,
                  created_at: new Date().toISOString()
                },
                'class_id,subject_id'
              )
            : null;
        return { subject, classSubject };
      }
    },
    'set-class-subject': {
      teacher: true,
      async run(p, auth, ip, action) {
        let classId = clean(p.classId, 1, 50),
          subjectId = clean(p.subjectId, 1, 50),
          [classes, subjects, links] = await Promise.all([
            store.get('classes', { id: classId }),
            store.get('subjects', { id: subjectId }),
            store.get('class_subjects', { class_id: classId })
          ]),
          cls = classes[0],
          subject = subjects[0];
        if (!cls || !subject) problem('Turma ou disciplina não encontrada.', 404);
        let existing = links.find(link => link.subject_id === subjectId);
        if (p.assigned === false) {
          if (existing) await store.remove('class_subjects', { id: existing.id });
          return { assigned: false, id: existing?.id || null };
        }
        if (!existing)
          existing = await store.insert(
            'class_subjects',
            {
              id: crypto.randomUUID(),
              class_id: classId,
              subject_id: subjectId,
              created_at: new Date().toISOString()
            },
            'class_id,subject_id'
          );
        return { assigned: true, link: existing };
      }
    },
    'create-class': {
      teacher: true,
      async run(p, auth, ip, action) {
        let name = clean(p.name, 3, 80),
          coreSubject = await ensureCoreSubject();
        let row = await store.insert('classes', {
          id: crypto.randomUUID(),
          name,
          code: randomCode().slice(0, 8),
          released: [],
          enrollment_open: true,
          created_at: new Date().toISOString()
        });
        await store.insert(
          'class_subjects',
          {
            id: crypto.randomUUID(),
            class_id: row.id,
            subject_id: coreSubject.id,
            created_at: new Date().toISOString()
          },
          'class_id,subject_id'
        );
        return { classroom: row };
      }
    },
    'class-report': {
      teacher: true,
      async run(p, auth, ip, action) {
        let classId = clean(p.classId, 1, 50),
          [classes, students, submissions, xpEvents, simulations, links, allSubjects, complement] =
            await Promise.all([
              store.get('classes', { id: classId }),
              store.get('students', { class_id: classId }),
              store.get('submissions', { class_id: classId }),
              store.get('xp_events', { class_id: classId }),
              store.get('simulations', { class_id: classId }),
              store.get('class_subjects', { class_id: classId }),
              store.get('subjects'),
              complementConfig(classId)
            ]),
          cls = classes[0];
        if (!cls) problem('Turma não encontrada.', 404);
        let subjects = links
            .map(link => allSubjects.find(subject => subject.id === link.subject_id))
            .filter(subject => subject?.active),
          // Só as tentativas dos simulados desta turma, em vez da tabela inteira.
          simulationAttempts = await store.get('simulation_attempts', {
            simulation_id: simulations.map(simulation => simulation.id)
          });
        return {
          classroom: cls,
          subjects,
          students: students.map(studentSafe),
          submissions,
          xpEvents,
          simulations: simulations.map(simulationSafe),
          simulationAttempts,
          complement,
          // Totais por aluno calculados no servidor: a tela e o CSV usam os mesmos números.
          summaries: students.map(student => {
            const statement = xpStatement(
              submissions.filter(item => item.student_id === student.id),
              xpEvents.filter(item => item.student_id === student.id)
            );
            return {
              student_id: student.id,
              totals: statement.totals,
              total: statement.total,
              complement_grade: complementGrade(statement.total, complement)
            };
          })
        };
      }
    },
    // Nota complementar por turma: máximo de pontos e XP necessário para atingi-lo. Máximo zero desativa.
    'set-complement': {
      teacher: true,
      async run(p) {
        let classId = clean(p.classId, 1, 50),
          cls = (await store.get('classes', { id: classId }))[0];
        if (!cls) problem('Turma não encontrada.', 404);
        const maxPoints = Number(p.maxPoints),
          targetXp = Number(p.targetXp),
          id = complementKey(classId),
          existing = (await store.get('settings', { id }))[0];
        if (!Number.isFinite(maxPoints) || maxPoints < 0 || maxPoints > COMPLEMENT_LIMITS.maxPoints)
          problem(`Use um máximo de 0 a ${COMPLEMENT_LIMITS.maxPoints} pontos.`);
        if (maxPoints === 0) {
          if (existing) await store.remove('settings', { id });
          return { complement: null };
        }
        if (
          !Number.isInteger(targetXp) ||
          targetXp < COMPLEMENT_LIMITS.minTarget ||
          targetXp > COMPLEMENT_LIMITS.maxTarget
        )
          problem(
            `Defina o XP para a nota máxima entre ${COMPLEMENT_LIMITS.minTarget} e ${COMPLEMENT_LIMITS.maxTarget.toLocaleString('pt-BR')}.`
          );
        const value = JSON.stringify({ maxPoints: Math.round(maxPoints * 10) / 10, targetXp });
        if (existing) await store.update('settings', id, { value });
        else await store.insert('settings', { id, value });
        return { complement: await complementConfig(classId) };
      }
    },
    'official-grade': {
      teacher: true,
      async run(p, auth, ip, action) {
        let s = (await store.get('students', { id: clean(p.studentId, 1, 50) }))[0];
        if (!s) problem('Aluno não encontrado.', 404);
        const value = Number(p.grade);
        if (p.grade === '' || !Number.isFinite(value) || value < 0 || value > 10)
          problem('Registre uma nota de 0 a 10.');
        return {
          student: studentSafe(
            await store.update('students', s.id, {
              official_grade: value,
              grade_note: clean(p.note || 'Avaliação oficial registrada pelo professor.', 5, 500)
            })
          )
        };
      }
    }
  };
};
