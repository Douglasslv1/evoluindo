// Ponto de entrada da API: cria o contexto, registra as ações de cada área e aplica limites e permissões.
const { createContext } = require('./service/context.cjs');
const { problem, hash, verify } = require('./service/util.cjs');
const areas = [
  require('./service/auth.cjs'),
  require('./service/lessons.cjs'),
  require('./service/simulations.cjs'),
  require('./service/questions.cjs'),
  require('./service/championships.cjs'),
  require('./service/classes.cjs')
];

function createService(options = {}) {
  const ctx = createContext(options),
    { store, need } = ctx,
    actions = new Map();
  for (const area of areas)
    for (const [name, handler] of Object.entries(area(ctx))) {
      if (actions.has(name)) throw Error('Ação duplicada: ' + name);
      actions.set(name, handler);
    }
  async function execute(action, p = {}, auth = null, ip = 'local') {
    if (
      ['student-login', 'register', 'teacher-login', 'setup'].includes(action) &&
      !(await store.limit('auth:' + ip, 600))
    )
      problem('Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.', 429);
    if (
      ['student-login', 'teacher-login'].includes(action) &&
      !(await store.limit(
        'login:' + ip + ':' + (action === 'teacher-login' ? 'teacher' : String(p.accessCode).toUpperCase()),
        12
      ))
    )
      problem('Muitas tentativas para este acesso. Aguarde 15 minutos.', 429);
    // Proteção do PIN por conta, independente da rede: a sala inteira pode compartilhar o mesmo IP.
    if (
      ['student-login', 'teacher-login'].includes(action) &&
      !(await store.limit(
        'account:' + (action === 'teacher-login' ? 'teacher' : String(p.accessCode).toUpperCase()),
        action === 'teacher-login' ? 60 : 30
      ))
    )
      problem('Muitas tentativas para este acesso. Aguarde 15 minutos.', 429);
    const handler = actions.get(action);
    // Ações de aluno e públicas validam o próprio acesso; as demais exigem o professor.
    if (handler && !handler.teacher) return handler.run(p, auth, ip, action);
    need(auth, 'teacher');
    if (handler) return handler.run(p, auth, ip, action);
    problem('Operação não encontrada.', 404);
  }
  return { execute, session: ctx.session, store };
}
module.exports = { createService, hash, verify };
