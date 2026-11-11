// Aulas: abertura, entregas, prévias, publicação por turma e avaliação.
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
  const handlers = {
    lesson: {
      teacher: false,
      async run(p, auth, ip, action) {
        need(auth, 'student');
        let id = clean(String(p.id), 1, 50),
          lesson;
        if (/^\d{1,3}$/.test(id)) {
          lesson = (await ensureCoreLessons(await ensureCoreSubject(), [auth.student.class_id])).find(
            item => item.legacy_lesson_id === Number(id)
          );
          id = lesson?.id || id;
        } else lesson = (await store.get('lessons', { id }))[0];
        let subjectLinks = await store.get('class_subjects', { class_id: auth.student.class_id }),
          classLesson = (await store.get('class_lessons', { class_id: auth.student.class_id })).find(
            link => link.lesson_id === id
          );
        if (
          !lesson ||
          lesson.active === false ||
          !subjectLinks.some(link => link.subject_id === lesson.subject_id) ||
          !classLesson?.published
        )
          problem('Esta aula ainda não foi publicada para a turma.', 403);
        if (lesson.legacy_lesson_id) {
          let legacy = course.find(item => item.id === lesson.legacy_lesson_id);
          if (!legacy) problem('Aula não encontrada.', 404);
          return {
            lesson: {
              ...publicLesson(legacy),
              id: lesson.id,
              legacy_lesson_id: legacy.id,
              subject_id: lesson.subject_id,
              kind: 'interactive'
            },
            sheets: Object.fromEntries(
              [...new Set(legacy.tasks.map(t => t.sheet).filter(Boolean))].map(key => [key, sheets[key]])
            )
          };
        }
        return { lesson: { ...lessonSafe(lesson, true), kind: 'content', tasks: [] }, sheets: {} };
      }
    },
    submit: {
      teacher: false,
      async run(p, auth, ip, action) {
        need(auth, 'student');
        if (!(await store.limit('submit:' + auth.id, 120)))
          problem('Muitas tentativas em sequência. Faça uma pausa e tente novamente.', 429);
        let t = findTask(p.taskId);
        if (!t) problem('Missão não encontrada.', 404);
        let cls = (await store.get('classes', { id: auth.student.class_id }))[0],
          coreSubject = await ensureCoreSubject(),
          coreLessons = await ensureCoreLessons(coreSubject, [auth.student.class_id]),
          lesson = coreLessons.find(item => item.legacy_lesson_id === t.lesson),
          published =
            lesson &&
            (await store.get('class_lessons', { class_id: auth.student.class_id })).some(
              link => link.lesson_id === lesson.id && link.published
            );
        if (!(await classHasSubject(auth.student.class_id, coreSubject.id)))
          problem('A disciplina Informática Básica não está vinculada a esta turma.', 403);
        if (!published)
          problem('A aula foi fechada pelo professor. Seu progresso já registrado foi preservado.', 403);
        let old = (await store.get('submissions', { student_id: auth.id, task_id: t.id }))[0];
        if (old?.status === 'approved') {
          const retry = grade(t, p.payload);
          return {
            result:
              retry.status === 'retry'
                ? { ...retry, feedback: retry.feedback + ' Seu XP anterior foi preservado.' }
                : {
                    status: old.status,
                    xp: old.xp,
                    feedback: 'Você já recebeu o XP desta missão. ' + old.feedback
                  },
            progress: await myProgress(auth.id)
          };
        }
        let outcome = grade(t, p.payload);
        if (outcome.status === 'retry') return { result: outcome, progress: await myProgress(auth.id) };
        let record = {
          student_id: auth.id,
          class_id: cls.id,
          task_id: t.id,
          lesson_id: t.lesson,
          payload: p.payload,
          status: outcome.status,
          xp: outcome.xp,
          feedback: outcome.feedback,
          updated_at: new Date().toISOString()
        };
        if (old) await store.update('submissions', old.id, record, true);
        else await store.insert('submissions', { id: crypto.randomUUID(), ...record }, 'student_id,task_id');
        let progress = await myProgress(auth.id),
          actual = progress.find(r => r.task_id === t.id);
        return { result: { status: actual.status, xp: actual.xp, feedback: actual.feedback }, progress };
      }
    },
    'preview-lesson': {
      teacher: true,
      async run(p, auth, ip, action) {
        const l = course.find(l => l.id === Number(p.id));
        if (!l) problem('Aula não encontrada.', 404);
        return { lesson: publicLesson(l), sheets };
      }
    },
    'preview-submit': {
      teacher: true,
      async run(p, auth, ip, action) {
        const t = findTask(p.taskId);
        if (!t) problem('Missão não encontrada.', 404);
        return { result: grade(t, p.payload), preview: true };
      }
    },
    'save-lesson': {
      teacher: true,
      async run(p, auth, ip, action) {
        let subjectId = clean(p.subjectId, 1, 50),
          subject = (await store.get('subjects', { id: subjectId }))[0];
        if (!subject) problem('Disciplina não encontrada.', 404);
        let title = clean(p.title, 3, 120),
          subtitle = clean(p.subtitle || '', 0, 300),
          content = cleanText(p.content || '', 20, 12000),
          minutes = Number(p.minutes),
          topics = String(p.topics || '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
            .slice(0, 8);
        if (!Number.isInteger(minutes) || minutes < 5 || minutes > 600)
          problem('Defina uma duração entre 5 e 600 minutos.');
        let lessons = await store.get('lessons', { subject_id: subjectId }),
          lesson;
        if (p.id) {
          lesson = lessons.find(item => item.id === clean(p.id, 1, 50));
          if (!lesson || lesson.legacy_lesson_id) problem('Esta aula não pode ser editada aqui.', 409);
          lesson = await store.update('lessons', lesson.id, { title, subtitle, content, topics, minutes });
        } else {
          let position = Math.max(0, ...lessons.map(item => item.position)) + 1;
          lesson = await store.insert('lessons', {
            id: crypto.randomUUID(),
            subject_id: subjectId,
            legacy_lesson_id: null,
            title,
            subtitle,
            content,
            topics,
            minutes,
            position,
            active: true,
            created_at: new Date().toISOString()
          });
        }
        return { lesson: lessonSafe(lesson) };
      }
    },
    'delete-lesson': {
      teacher: true,
      async run(p, auth, ip, action) {
        let lesson = (await store.get('lessons', { id: clean(p.id, 1, 50) }))[0];
        if (!lesson) problem('Aula não encontrada.', 404);
        if (lesson.legacy_lesson_id) problem('As aulas fundamentais não podem ser excluídas.', 409);
        await store.update('lessons', lesson.id, { active: false });
        return { ok: true };
      }
    },
    'set-class-lesson': {
      teacher: true,
      async run(p, auth, ip, action) {
        let classId = clean(p.classId, 1, 50),
          lessonId = clean(p.lessonId, 1, 50),
          [classes, lessons, links, classLessons] = await Promise.all([
            store.get('classes', { id: classId }),
            store.get('lessons', { id: lessonId }),
            store.get('class_subjects', { class_id: classId }),
            store.get('class_lessons', { class_id: classId })
          ]),
          lesson = lessons[0];
        if (!classes[0] || !lesson || !links.some(link => link.subject_id === lesson.subject_id))
          problem('Associe a disciplina à turma antes de publicar a aula.', 409);
        let existing = classLessons.find(link => link.lesson_id === lessonId);
        if (existing)
          existing = await store.update('class_lessons', existing.id, { published: p.published === true });
        else
          existing = await store.insert(
            'class_lessons',
            {
              id: crypto.randomUUID(),
              class_id: classId,
              lesson_id: lessonId,
              published: p.published === true,
              created_at: new Date().toISOString()
            },
            'class_id,lesson_id'
          );
        if (lesson.legacy_lesson_id) {
          let cls = classes[0],
            released =
              p.published === true
                ? [...new Set([...cls.released, lesson.legacy_lesson_id])]
                : cls.released.filter(id => id !== lesson.legacy_lesson_id);
          await store.update('classes', classId, { released: released.sort((a, b) => a - b) });
        }
        return { link: existing };
      }
    },
    release: {
      teacher: true,
      async run(p, auth, ip, action) {
        let cls = (await store.get('classes', { id: clean(p.classId, 1, 50) }))[0];
        if (!cls) problem('Turma não encontrada.', 404);
        if (action === 'enrollment')
          return { classroom: await store.update('classes', cls.id, { enrollment_open: p.open === true }) };
        if (!Array.isArray(p.lessons) || p.lessons.some(n => !Number.isInteger(n) || n < 1 || n > 10))
          problem('Selecione aulas de 1 a 10.');
        let released = [...new Set(p.lessons)].sort((a, b) => a - b),
          classroom = await store.update('classes', cls.id, { released }),
          coreLessons = await ensureCoreLessons(await ensureCoreSubject(), [cls.id]),
          links = await store.get('class_lessons', { class_id: cls.id });
        // Mantém a publicação nova (class_lessons) igual à liberação por número usada no painel antigo.
        for (const lesson of coreLessons) {
          const published = released.includes(lesson.legacy_lesson_id),
            link = links.find(item => item.lesson_id === lesson.id);
          if (link) {
            if (link.published !== published) await store.update('class_lessons', link.id, { published });
          } else
            await store.insert(
              'class_lessons',
              {
                id: crypto.randomUUID(),
                class_id: cls.id,
                lesson_id: lesson.id,
                published,
                created_at: new Date().toISOString()
              },
              'class_id,lesson_id'
            );
        }
        return { classroom };
      }
    },
    enrollment: { teacher: true, run: (...args) => handlers['release'].run(...args) },
    review: {
      teacher: true,
      async run(p, auth, ip, action) {
        let row = (await store.get('submissions', { id: clean(p.id, 1, 50) }))[0],
          t = row && findTask(row.task_id);
        if (!row || !t) problem('Entrega não encontrada.', 404);
        if (!['review', 'project'].includes(t.type)) problem('Esta missão tem correção automática.');
        if (!['approved', 'revision'].includes(p.status)) problem('Avaliação inválida.');
        let feedback = clean(p.feedback, 5, 1500);
        let updated = await store.update('submissions', row.id, {
          status: p.status,
          xp: p.status === 'approved' ? t.xp : 0,
          feedback,
          updated_at: new Date().toISOString()
        });
        return { submission: updated };
      }
    }
  };
  return handlers;
};
