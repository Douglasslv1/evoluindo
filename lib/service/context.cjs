// Contexto compartilhado pelas ações: armazenamento, sessão, caches e regras usadas por mais de uma área.
const crypto = require('node:crypto');
const { course, sheets, findTask, publicLesson } = require('../course.cjs');
const { grade } = require('../grader.cjs');
const { problem, hash, verify, clean, cleanText, LATE_GRACE_MS, randomCode } = require('./util.cjs');
const { createStore } = require('../store.cjs');
const { xpStatement, parseComplement, complementGrade, complementKey } = require('./xp.cjs');

function createContext(options = {}) {
  let store = options.store || createStore(options),
    secret = options.secret || process.env.SESSION_SECRET,
    localSecret;
  const coreSubjectKey = 'informatica-basica';
  // Caches por instância do servidor. Numa função da Vercel, duram enquanto a instância estiver ativa.
  let coreSubjectCache = null,
    coreLessonsCache = null;
  const coreClassesReady = new Set();
  async function signingSecret() {
    if (secret?.length >= 32) return secret;
    if (store.cloud) problem('Configure SESSION_SECRET com pelo menos 32 caracteres.', 503);
    if (localSecret) return localSecret;
    let row = (await store.get('settings', { id: 'session-secret' }))[0];
    if (!row)
      row = await store.insert('settings', {
        id: 'session-secret',
        value: crypto.randomBytes(48).toString('hex')
      });
    return (localSecret = row.value);
  }
  async function sign(data) {
    const encoded = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + 7 * 86400000 })).toString(
      'base64url'
    );
    const signature = crypto
      .createHmac('sha256', await signingSecret())
      .update(encoded)
      .digest('base64url');
    return encoded + '.' + signature;
  }
  async function session(token) {
    try {
      if (!token || token.length > 2000) return null;
      let [body, sig] = token.split('.');
      let expected = crypto
        .createHmac('sha256', await signingSecret())
        .update(body)
        .digest('base64url');
      if (
        !sig ||
        sig.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
      )
        return null;
      let data = JSON.parse(Buffer.from(body, 'base64url').toString());
      if (data.exp < Date.now()) return null;
      if (data.role === 'teacher') return data;
      let student = (await store.get('students', { id: data.id }))[0];
      return student && student.version === data.version ? { ...data, student } : null;
    } catch {
      return null;
    }
  }
  const studentSafe = s => ({
    id: s.id,
    name: s.name,
    class_id: s.class_id,
    access_code: s.access_code,
    created_at: s.created_at,
    official_grade: s.official_grade ?? null,
    grade_note: s.grade_note || ''
  });
  async function myProgress(id) {
    return (await store.get('submissions', { student_id: id })).map(
      ({ id, task_id, status, xp, feedback, updated_at, payload }) => ({
        id,
        task_id,
        status,
        xp,
        feedback,
        updated_at,
        payload
      })
    );
  }
  async function subjectsForClass(classId) {
    const links = await store.get('class_subjects', { class_id: classId }),
      subjects = await store.get('subjects');
    return links
      .map(link => subjects.find(subject => subject.id === link.subject_id))
      .filter(subject => subject?.active);
  }
  async function ensureCoreSubject() {
    if (coreSubjectCache) return coreSubjectCache;
    let subject = (await store.get('subjects')).find(item => item.system_key === coreSubjectKey);
    if (!subject)
      subject = await store.insert('subjects', {
        id: crypto.randomUUID(),
        name: 'Informática Básica',
        description: 'Aulas, laboratórios e missões fundamentais de informática.',
        system_key: coreSubjectKey,
        active: true,
        created_at: new Date().toISOString()
      });
    let migration = (await store.get('settings', { id: 'core-subject-linked-v1' }))[0];
    if (!migration) {
      let classes = await store.get('classes'),
        links = await store.get('class_subjects');
      for (const cls of classes)
        if (!links.some(link => link.class_id === cls.id && link.subject_id === subject.id))
          await store.insert(
            'class_subjects',
            {
              id: crypto.randomUUID(),
              class_id: cls.id,
              subject_id: subject.id,
              created_at: new Date().toISOString()
            },
            'class_id,subject_id'
          );
      await store.insert('settings', { id: 'core-subject-linked-v1', value: new Date().toISOString() });
    }
    return (coreSubjectCache = subject);
  }
  // Cria as aulas fundamentais uma vez e o vínculo com cada turma uma vez por instância, em vez de percorrer todas as turmas a cada requisição.
  async function ensureCoreLessons(subject, classIds = []) {
    if (!coreLessonsCache) {
      let lessons = (await store.get('lessons', { subject_id: subject.id })).filter(
        row => row.legacy_lesson_id
      );
      for (const item of course) {
        if (!lessons.some(row => row.legacy_lesson_id === item.id))
          lessons.push(
            await store.insert(
              'lessons',
              {
                id: crypto.randomUUID(),
                subject_id: subject.id,
                legacy_lesson_id: item.id,
                title: item.title,
                subtitle: item.subtitle || '',
                content: '',
                topics: item.topics || [],
                minutes: item.minutes || 180,
                position: item.id,
                active: true,
                created_at: new Date().toISOString()
              },
              'subject_id,legacy_lesson_id'
            )
          );
      }
      coreLessonsCache = lessons;
    }
    let lessons = coreLessonsCache,
      pending = [...new Set(classIds)].filter(id => id && !coreClassesReady.has(id));
    if (pending.length) {
      let [classes, links] = await Promise.all([
        store.get('classes', { id: pending }),
        store.get('class_lessons', { class_id: pending })
      ]);
      for (const cls of classes) {
        for (const lesson of lessons)
          if (!links.some(link => link.class_id === cls.id && link.lesson_id === lesson.id))
            await store.insert(
              'class_lessons',
              {
                id: crypto.randomUUID(),
                class_id: cls.id,
                lesson_id: lesson.id,
                published: (cls.released || []).includes(lesson.legacy_lesson_id),
                created_at: new Date().toISOString()
              },
              'class_id,lesson_id'
            );
        coreClassesReady.add(cls.id);
      }
    }
    return lessons;
  }
  const lessonSafe = (lesson, published = false) => ({
    id: lesson.id,
    subject_id: lesson.subject_id,
    legacy_lesson_id: lesson.legacy_lesson_id ?? null,
    title: lesson.title,
    subtitle: lesson.subtitle || '',
    content: lesson.content || '',
    topics: Array.isArray(lesson.topics) ? lesson.topics : [],
    minutes: lesson.minutes,
    position: lesson.position,
    active: lesson.active !== false,
    published,
    taskCount: lesson.legacy_lesson_id
      ? course.find(item => item.id === lesson.legacy_lesson_id)?.tasks.length || 0
      : 0,
    maxXp: lesson.legacy_lesson_id
      ? course
          .find(item => item.id === lesson.legacy_lesson_id)
          ?.tasks.reduce((sum, task) => sum + task.xp, 0) || 0
      : 0
  });
  async function classHasSubject(classId, subjectId) {
    return (await store.get('class_subjects', { class_id: classId })).some(
      link => link.subject_id === subjectId
    );
  }
  function questionData(p) {
    let statement = clean(p.statement, 5, 1000),
      explanation = clean(p.explanation || '', 0, 1500);
    if (!Array.isArray(p.options) || p.options.length < 2 || p.options.length > 5)
      problem('Cadastre entre 2 e 5 alternativas.');
    let options = p.options.map(option => clean(option, 1, 300));
    if (new Set(options.map(option => option.toLocaleLowerCase('pt-BR'))).size !== options.length)
      problem('As alternativas precisam ser diferentes.');
    let correct = Number(p.correct);
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length)
      problem('Selecione a alternativa correta.');
    return { statement, options, correct, explanation };
  }
  function shuffled(rows) {
    let result = rows.slice();
    for (let i = result.length - 1; i > 0; i--) {
      let j = crypto.randomInt(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  const simulationSafe = simulation => ({
    id: simulation.id,
    class_id: simulation.class_id,
    subject_id: simulation.subject_id,
    bank_id: simulation.bank_id,
    title: simulation.title,
    question_count: simulation.question_count,
    max_xp: simulation.max_xp,
    status: simulation.status,
    created_at: simulation.created_at
  });
  const championshipSafe = championship => ({
    id: championship.id,
    class_id: championship.class_id,
    subject_id: championship.subject_id,
    bank_id: championship.bank_id,
    title: championship.title,
    question_count: championship.question_count,
    leveling_question_count: championship.leveling_question_count || championship.question_count,
    duel_xp: championship.duel_xp,
    winner_bonus: championship.winner_bonus,
    duration_seconds: championship.duration_seconds || 90,
    status: championship.status,
    champion_id: championship.champion_id,
    runner_up_id: championship.runner_up_id,
    third_id: championship.third_id,
    created_at: championship.created_at
  });
  async function championshipCatalog(classId, studentId) {
    let championships = await store.get('championships', { class_id: classId }),
      ids = championships.map(item => item.id);
    let [participants, matches, students] = await Promise.all([
        store.get('championship_participants', { championship_id: ids }),
        store.get('duel_matches', { championship_id: ids }),
        ids.length ? store.get('students', { class_id: classId }) : Promise.resolve([])
      ]),
      names = Object.fromEntries(students.map(student => [student.id, student.name]));
    return championships.map(championship => {
      let joined = participants.some(
          item => item.championship_id === championship.id && item.student_id === studentId
        ),
        championshipParticipants = participants.filter(item => item.championship_id === championship.id);
      return {
        ...championshipSafe(championship),
        joined,
        participant_count: championshipParticipants.length,
        participants: championshipParticipants.map(item => ({
          student_id: item.student_id,
          name: names[item.student_id] || 'Aluno',
          disqualified: !!item.disqualified,
          leveling_status: item.leveling_status || 'pending',
          leveling_score: item.leveling_score ?? null,
          leveling_time: item.leveling_time ?? null
        })),
        matches: matches
          .filter(match => match.championship_id === championship.id)
          .map(match => ({
            id: match.id,
            round: match.round,
            slot: match.slot,
            kind: match.kind,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            player1_name: names[match.player1_id] || null,
            player2_name: names[match.player2_id] || null,
            winner_id: match.winner_id,
            status: match.status,
            player1_score: match.player1_score,
            player2_score: match.player2_score
          }))
      };
    });
  }
  async function championshipLive(id) {
    let found = (await store.get('championships', { id }))[0];
    if (!found) problem('Campeonato não encontrado.', 404);
    await settleChampionship(found);
    let [championships, matches, participants, students] = await Promise.all([
        store.get('championships', { id }),
        store.get('duel_matches', { championship_id: id }),
        store.get('championship_participants', { championship_id: id }),
        store.get('students', { class_id: found.class_id })
      ]),
      championship = championships[0];
    if (!championship) problem('Campeonato não encontrado.', 404);
    let openAttempts = (
        await Promise.all(
          matches
            .filter(match => match.status === 'open')
            .map(match => store.get('duel_attempts', { match_id: match.id }))
        )
      ).flat(),
      playerState = (match, id) => {
        if (!id || match.status !== 'open') return null;
        let attempt = openAttempts.find(item => item.match_id === match.id && item.student_id === id);
        return attempt?.status || 'pending';
      },
      names = Object.fromEntries(
        students
          .filter(student => student.class_id === championship.class_id)
          .map(student => [student.id, student.name])
      );
    return {
      championship: championshipSafe(championship),
      participants: participants.map(item => ({
        student_id: item.student_id,
        name: names[item.student_id] || 'Aluno',
        disqualified: !!item.disqualified,
        leveling_status: item.leveling_status || 'pending',
        leveling_score: item.leveling_score ?? null,
        leveling_time: item.leveling_time ?? null
      })),
      matches: matches.map(match => ({
        id: match.id,
        round: match.round,
        slot: match.slot,
        kind: match.kind,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        player1_name: names[match.player1_id] || null,
        player2_name: names[match.player2_id] || null,
        winner_id: match.winner_id,
        status: match.status,
        player1_score: match.player1_score,
        player2_score: match.player2_score,
        player1_state: playerState(match, match.player1_id),
        player2_state: playerState(match, match.player2_id)
      }))
    };
  }
  async function createDuelMatch(
    championship,
    round,
    slot,
    player1,
    player2,
    kind = 'main',
    knownParticipants
  ) {
    let questions = shuffled(championship.question_pool).slice(0, championship.question_count),
      participants =
        knownParticipants ||
        (await store.get('championship_participants', { championship_id: championship.id })),
      p1Disqualified = participants.some(item => item.student_id === player1 && item.disqualified),
      p2Disqualified = participants.some(item => item.student_id === player2 && item.disqualified),
      bye = !player2 || p2Disqualified || p1Disqualified,
      winner = !player2 || p2Disqualified ? player1 : p1Disqualified ? player2 : null,
      loser = p1Disqualified ? player1 : p2Disqualified ? player2 : null,
      now = new Date().toISOString();
    return store.insert(
      'duel_matches',
      {
        id: crypto.randomUUID(),
        championship_id: championship.id,
        round,
        slot,
        kind,
        player1_id: player1 || null,
        player2_id: player2 || null,
        winner_id: bye ? winner : null,
        loser_id: bye ? loser : null,
        player1_score: bye ? 0 : null,
        player2_score: bye && player2 ? 0 : null,
        player1_time: bye ? 0 : null,
        player2_time: bye && player2 ? 0 : null,
        status: bye ? 'finished' : 'open',
        questions,
        created_at: now
      },
      'championship_id,round,slot,kind'
    );
  }
  async function advanceChampionship(championshipId) {
    for (let guard = 0; guard < 20; guard++) {
      let [championships, matches, participants] = await Promise.all([
          store.get('championships', { id: championshipId }),
          store.get('duel_matches', { championship_id: championshipId }),
          store.get('championship_participants', { championship_id: championshipId })
        ]),
        championship = championships[0],
        main = matches.filter(match => match.kind === 'main'),
        maxRound = Math.max(...main.map(match => match.round)),
        current = main.filter(match => match.round === maxRound);
      if (current.some(match => match.status !== 'finished')) return;
      if (current.length === 1) {
        let final = current[0],
          third = matches.find(match => match.kind === 'third');
        if (third && third.status !== 'finished') return;
        await store.update('championships', championshipId, {
          status: 'finished',
          champion_id: final.winner_id,
          runner_up_id: final.loser_id,
          third_id: third?.winner_id || null,
          finished_at: new Date().toISOString()
        });
        return;
      }
      if (main.some(match => match.round === maxRound + 1)) return;
      let winners = current.map(match => match.winner_id),
        nextRound = maxRound + 1,
        tasks = [];
      for (let index = 0; index < winners.length; index += 2)
        tasks.push(
          createDuelMatch(
            championship,
            nextRound,
            index / 2,
            winners[index],
            winners[index + 1] || null,
            'main',
            participants
          )
        );
      if (current.length === 2 && current.every(match => match.loser_id))
        tasks.push(
          createDuelMatch(
            championship,
            nextRound,
            0,
            current[0].loser_id,
            current[1].loser_id,
            'third',
            participants
          )
        );
      await Promise.all(tasks);
    }
  }
  // Resolução de duelos: idempotente e segura para chamadas simultâneas. O vencedor gravado no banco prevalece.
  function pickWinner(match, attempts) {
    let p1 = attempts.find(item => item.student_id === match.player1_id),
      p2 = attempts.find(item => item.student_id === match.player2_id);
    if (p1.score !== p2.score) return p1.score > p2.score ? match.player1_id : match.player2_id;
    if (p1.elapsed_ms !== p2.elapsed_ms)
      return p1.elapsed_ms < p2.elapsed_ms ? match.player1_id : match.player2_id;
    return crypto.randomInt(2) ? match.player1_id : match.player2_id;
  }
  async function finishDuel(match, championship, winner, attempts) {
    let completed = attempts.filter(item => item.status === 'completed'),
      p1 = completed.find(item => item.student_id === match.player1_id),
      p2 = completed.find(item => item.student_id === match.player2_id),
      loser = winner === match.player1_id ? match.player2_id : match.player1_id,
      now = new Date().toISOString();
    let resolved = await store.update('duel_matches', match.id, {
      winner_id: winner,
      loser_id: loser,
      player1_score: p1?.score ?? 0,
      player2_score: p2?.score ?? 0,
      player1_time: p1?.elapsed_ms ?? 0,
      player2_time: p2?.elapsed_ms ?? 0,
      status: 'finished'
    });
    if (!resolved || resolved.status !== 'finished') return resolved || match;
    // XP de participação para quem concluiu a tentativa e bônus para o vencedor gravado. As chaves únicas evitam duplicidade.
    for (const studentId of [resolved.player1_id, resolved.player2_id])
      if (
        studentId &&
        (studentId === resolved.winner_id || completed.some(item => item.student_id === studentId))
      )
        await store.insert(
          'xp_events',
          {
            id: crypto.randomUUID(),
            student_id: studentId,
            class_id: championship.class_id,
            source_type: 'duel',
            source_id: resolved.id,
            xp: championship.duel_xp + (studentId === resolved.winner_id ? championship.winner_bonus : 0),
            description: 'Duelo: ' + championship.title,
            created_at: now
          },
          'student_id,source_type,source_id'
        );
    await advanceChampionship(championship.id);
    return resolved;
  }
  async function settleDuel(match, championship) {
    if (!match || match.status !== 'open' || !match.player1_id || !match.player2_id) return match;
    let attempts = await store.get('duel_attempts', { match_id: match.id }),
      limit = (championship.duration_seconds || 90) * 1000,
      now = Date.now();
    // Tentativa aberta que passou do prazo e da tolerância é encerrada sem acertos: o duelo não fica travado por abandono.
    for (const attempt of attempts)
      if (
        attempt.status === 'started' &&
        now > new Date(attempt.started_at).getTime() + limit + LATE_GRACE_MS
      )
        Object.assign(
          attempt,
          (await store.update('duel_attempts', attempt.id, {
            answers: match.questions.map(() => -1),
            score: 0,
            elapsed_ms: limit,
            status: 'completed',
            completed_at: new Date(now).toISOString()
          })) || {}
        );
    if (
      ![match.player1_id, match.player2_id].every(id =>
        attempts.some(item => item.student_id === id && item.status === 'completed')
      )
    )
      return match;
    return finishDuel(match, championship, pickWinner(match, attempts), attempts);
  }
  async function settleChampionship(championship) {
    if (championship?.status !== 'active') return;
    for (const match of (await store.get('duel_matches', { championship_id: championship.id })).filter(
      item => item.status === 'open'
    ))
      await settleDuel(match, championship);
  }
  async function studentState(s) {
    let coreSubject = await ensureCoreSubject();
    await ensureCoreLessons(coreSubject, [s.class_id]);
    let subjectLinks = await store.get('class_subjects', { class_id: s.class_id }),
      linkedIds = subjectLinks.map(link => link.subject_id);
    let [
        classes,
        links,
        allSubjects,
        allLessons,
        classLessons,
        rawSimulations,
        simulationAttempts,
        duelAttempts,
        xpEvents,
        progress,
        championships,
        complement
      ] = await Promise.all([
        store.get('classes', { id: s.class_id }),
        Promise.resolve(subjectLinks),
        store.get('subjects', { id: linkedIds }),
        store.get('lessons', { subject_id: linkedIds }),
        store.get('class_lessons', { class_id: s.class_id }),
        store.get('simulations', { class_id: s.class_id }),
        store.get('simulation_attempts', { student_id: s.id }),
        store.get('duel_attempts', { student_id: s.id }),
        store.get('xp_events', { student_id: s.id }),
        myProgress(s.id),
        championshipCatalog(s.class_id, s.id),
        complementConfig(s.class_id)
      ]),
      cls = classes[0];
    if (!cls) problem('Turma não encontrada.', 404);
    let subjects = links
        .map(link => allSubjects.find(subject => subject.id === link.subject_id))
        .filter(subject => subject?.active),
      subjectIds = new Set(subjects.map(subject => subject.id)),
      simulations = rawSimulations.filter(item => item.status !== 'draft').map(simulationSafe),
      lessons = allLessons
        .filter(lesson => lesson.active !== false && subjectIds.has(lesson.subject_id))
        .map(lesson =>
          lessonSafe(
            lesson,
            classLessons.some(link => link.lesson_id === lesson.id && link.published)
          )
        )
        .sort((a, b) => a.position - b.position),
      statement = xpStatement(progress, xpEvents);
    return {
      role: 'student',
      // Extrato único de XP e nota complementar (null quando o professor não ativou), separada da nota oficial.
      xpStatement: statement,
      complement: complement ? { ...complement, grade: complementGrade(statement.total, complement) } : null,
      student: studentSafe(s),
      classroom: { id: cls.id, name: cls.name, released: cls.released },
      subjects,
      courseSubject: subjects.find(subject => subject.id === coreSubject.id) || null,
      simulations,
      simulationAttempts,
      championships,
      duelAttempts,
      xpEvents,
      progress,
      lessons
    };
  }
  function need(auth, role) {
    if (!auth || auth.role !== role) problem('Entre com o acesso adequado para continuar.', 401);
  }
  async function complementConfig(classId) {
    return parseComplement((await store.get('settings', { id: complementKey(classId) }))[0]);
  }
  return {
    complementConfig,
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
  };
}
module.exports = { createContext };
