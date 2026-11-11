// Acesso: estado, configuração inicial, login, cadastro e PIN.
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
    status: {
      teacher: false,
      async run(p, auth, ip, action) {
        let localReady = store.cloud
          ? true
          : Boolean(
              (await store.get('settings', { id: 'teacher-password' }))[0] || process.env.ADMIN_PASSWORD
            );
        return {
          mode: store.cloud ? 'cloud' : 'local',
          needsSetup: !localReady,
          authenticated: !!auth,
          role: auth?.role || null
        };
      }
    },
    setup: {
      teacher: false,
      async run(p, auth, ip, action) {
        if (store.cloud) problem('A configuração inicial é feita no servidor.', 403);
        if ((await store.get('settings', { id: 'teacher-password' }))[0] || process.env.ADMIN_PASSWORD)
          problem('O professor já está configurado.', 409);
        let password = clean(p.password, 10, 128);
        await store.insert('settings', { id: 'teacher-password', value: await hash(password) });
        return { token: await sign({ role: 'teacher' }), role: 'teacher' };
      }
    },
    'teacher-login': {
      teacher: false,
      async run(p, auth, ip, action) {
        let password = clean(p.password, 1, 128),
          valid = false;
        if (process.env.ADMIN_PASSWORD) {
          const a = Buffer.from(password),
            b = Buffer.from(process.env.ADMIN_PASSWORD);
          valid = a.length === b.length && crypto.timingSafeEqual(a, b);
        } else if (!store.cloud) {
          valid = await verify(password, (await store.get('settings', { id: 'teacher-password' }))[0]?.value);
        }
        if (!valid) problem('Acesso do professor inválido.', 401);
        return { token: await sign({ role: 'teacher' }), role: 'teacher' };
      }
    },
    register: {
      teacher: false,
      async run(p, auth, ip, action) {
        let code = clean(p.classCode, 3, 30).toUpperCase(),
          cls = (await store.get('classes', { code }))[0];
        if (!cls || !cls.enrollment_open)
          problem('Turma não encontrada ou inscrições fechadas. Confira o código com o professor.', 404);
        let name = clean(p.name, 3, 80),
          pin = clean(p.pin, 6, 30);
        if (!/^\d{6,12}$/.test(pin)) problem('Escolha um PIN de 6 a 12 números.');
        let s = await store.insert('students', {
          id: crypto.randomUUID(),
          class_id: cls.id,
          name,
          access_code: randomCode(),
          pin_hash: await hash(pin),
          version: 1,
          created_at: new Date().toISOString()
        });
        return {
          token: await sign({ role: 'student', id: s.id, version: s.version }),
          ...(await studentState(s))
        };
      }
    },
    'student-login': {
      teacher: false,
      async run(p, auth, ip, action) {
        let code = clean(p.accessCode, 1, 30).toUpperCase(),
          s = (await store.get('students', { access_code: code }))[0];
        if (!s || !(await verify(String(p.pin ?? ''), s.pin_hash)))
          problem('Código pessoal ou PIN inválido.', 401);
        return {
          token: await sign({ role: 'student', id: s.id, version: s.version }),
          ...(await studentState(s))
        };
      }
    },
    me: {
      teacher: false,
      async run(p, auth, ip, action) {
        if (!auth) problem('Entre para continuar.', 401);
        return auth.role === 'teacher' ? { role: 'teacher' } : studentState(auth.student);
      }
    },
    'reset-pin': {
      teacher: true,
      async run(p, auth, ip, action) {
        let s = (await store.get('students', { id: clean(p.studentId, 1, 50) }))[0];
        if (!s) problem('Aluno não encontrado.', 404);
        let pin = clean(p.pin, 6, 12);
        if (!/^\d{6,12}$/.test(pin)) problem('Use um PIN de 6 a 12 números.');
        await store.update('students', s.id, { pin_hash: await hash(pin), version: s.version + 1 });
        return { ok: true };
      }
    }
  };
};
