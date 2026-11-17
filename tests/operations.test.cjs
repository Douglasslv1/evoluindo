const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const { createService } = require('../lib/service.cjs');

const base = path.resolve(__dirname, '..', 'test-output');
function tempDir(name) {
  fs.mkdirSync(base, { recursive: true });
  return fs.mkdtempSync(path.join(base, name));
}
function cleanup(directory) {
  if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
  fs.rmSync(directory, { recursive: true, force: true });
}

test('backup exporta todas as tabelas em páginas, só para o professor e sem segredos do servidor', async () => {
  const directory = tempDir('evoluindo-backup-');
  try {
    const service = createService({ file: path.join(directory, 'data.json') }),
      teacher = await service.session(
        (await service.execute('setup', { password: 'senha-de-teste-forte' })).token
      ),
      classroom = (await service.execute('create-class', { name: 'Turma backup' }, teacher)).classroom,
      student = await service.session(
        (
          await service.execute('register', {
            classCode: classroom.code,
            name: 'Aluna backup',
            pin: '112358'
          })
        ).token
      );
    await assert.rejects(() => service.execute('backup-tables', {}, student), { status: 401 });
    await assert.rejects(() => service.execute('backup-table', { table: 'students' }, null), { status: 401 });
    await assert.rejects(() => service.execute('backup-table', { table: 'limits' }, teacher), {
      status: 400
    });

    const plan = await service.execute('backup-tables', {}, teacher);
    assert.equal(plan.format, 'evoluindo-backup-v1');
    assert.ok(plan.tables.includes('students') && plan.tables.includes('questions'));

    const settings = await service.execute('backup-table', { table: 'settings' }, teacher);
    assert.ok(settings.rows.every(row => !['teacher-password', 'session-secret'].includes(row.id)));
    const students = await service.execute('backup-table', { table: 'students' }, teacher);
    assert.equal(students.total, 1);
    assert.ok(students.rows[0].pin_hash, 'O backup preserva o PIN (com hash) para permitir restauração.');

    // Paginação: 1.005 registros saem em duas páginas, sem repetir nem perder nenhum.
    const now = new Date().toISOString();
    await service.store.insertMany(
      'xp_events',
      Array.from({ length: 1005 }, (_, index) => ({
        id: crypto.randomUUID(),
        student_id: student.id,
        class_id: classroom.id,
        source_type: 'simulation',
        source_id: 'teste-' + index,
        xp: 1,
        description: 'Teste',
        created_at: now
      }))
    );
    const first = await service.execute('backup-table', { table: 'xp_events' }, teacher),
      second = await service.execute('backup-table', { table: 'xp_events', offset: first.next }, teacher);
    assert.equal(first.rows.length, 1000);
    assert.equal(first.next, 1000);
    assert.equal(second.rows.length, 5);
    assert.equal(second.next, null);
    assert.equal(new Set([...first.rows, ...second.rows].map(row => row.id)).size, 1005);
  } finally {
    cleanup(directory);
  }
});

test('erro inesperado vira registro no log com código de referência e sem dados pessoais', async () => {
  const previous = {
      STORAGE_MODE: process.env.STORAGE_MODE,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
      SESSION_SECRET: process.env.SESSION_SECRET
    },
    originalFetch = global.fetch,
    originalError = console.error,
    logs = [];
  Object.assign(process.env, {
    STORAGE_MODE: 'supabase',
    SUPABASE_URL: 'https://exemplo.supabase.co',
    SUPABASE_SECRET_KEY: 'sb_secret_teste',
    SESSION_SECRET: 'x'.repeat(40)
  });
  // Simula o banco recusando a operação, como quando falta uma coluna ou função no Supabase.
  global.fetch = async () => ({
    ok: false,
    status: 404,
    text: async () =>
      JSON.stringify({
        code: 'PGRST202',
        message: 'Could not find the function public.interface_take_limit',
        details: 'valor-sensivel-123',
        hint: null
      })
  });
  console.error = line => logs.push(line);
  try {
    const handler = require('../api/index.js');
    let output = '';
    const res = {
      statusCode: 200,
      setHeader() {},
      end(text) {
        output = text || '';
      }
    };
    await handler(
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          'x-vercel-id': 'gru1::abc12-1700000000000-feedbeef'
        },
        body: { action: 'student-login', accessCode: 'CODIGO123', pin: '987654' },
        socket: { remoteAddress: 'teste' }
      },
      res
    );
    const data = JSON.parse(output);
    assert.equal(res.statusCode, 503);
    assert.equal(data.ref, 'abc12-1700000000000-feedbeef');
    assert.match(data.error, /ref\. abc12-1700000000000-feedbeef/);
    assert.doesNotMatch(output, /PGRST202|interface_take_limit/, 'O navegador não recebe detalhes internos.');

    assert.equal(logs.length, 1);
    const entry = JSON.parse(logs[0]);
    assert.equal(entry.level, 'error');
    assert.equal(entry.ref, data.ref);
    assert.equal(entry.action, 'student-login');
    assert.equal(entry.detail.code, 'PGRST202');
    assert.equal(entry.detail.table, 'rpc/interface_take_limit');
    assert.match(entry.detail.message, /interface_take_limit/);
    assert.doesNotMatch(
      logs[0],
      /valor-sensivel-123|CODIGO123|987654/,
      'Sem valores de registros nem dados de acesso.'
    );
  } finally {
    global.fetch = originalFetch;
    console.error = originalError;
    for (const [name, value] of Object.entries(previous))
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
  }
});

test('verificação automática no GitHub roda formatação, sintaxe, testes e build', () => {
  const workflow = fs.readFileSync('.github/workflows/verificacao.yml', 'utf8');
  for (const step of ['npm ci', 'npm run format:check', 'npm run check', 'npm test', 'npm run build'])
    assert.ok(workflow.includes(step), 'Falta a etapa: ' + step);
  assert.match(workflow, /database\/schema\.sql/);
});
