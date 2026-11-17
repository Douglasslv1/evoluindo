// Backup: exportação completa dos registros, tabela por tabela, para o professor guardar uma cópia.
const { problem, clean } = require('./util.cjs');

// Ordem pensada para uma eventual restauração: tabelas referenciadas antes das dependentes.
const BACKUP_TABLES = [
  'settings',
  'classes',
  'subjects',
  'class_subjects',
  'students',
  'lessons',
  'class_lessons',
  'submissions',
  'question_banks',
  'questions',
  'simulations',
  'simulation_attempts',
  'championships',
  'championship_participants',
  'duel_matches',
  'duel_attempts',
  'focus_events',
  'xp_events'
];
// Segredos do servidor nunca saem no backup: hash da senha do professor e segredo das sessões.
const SECRET_SETTINGS = new Set(['teacher-password', 'session-secret']);
const PAGE_SIZE = 1000;

module.exports = ctx => {
  const { store } = ctx;
  return {
    'backup-tables': {
      teacher: true,
      async run() {
        return { format: 'evoluindo-backup-v1', tables: BACKUP_TABLES, pageSize: PAGE_SIZE };
      }
    },
    // Uma página de uma tabela por chamada, para cada resposta ficar pequena (limite de resposta da Vercel).
    'backup-table': {
      teacher: true,
      async run(p) {
        const table = clean(String(p.table ?? ''), 1, 40),
          offset = Number(p.offset ?? 0);
        if (!BACKUP_TABLES.includes(table)) problem('Tabela inválida para o backup.');
        if (!Number.isInteger(offset) || offset < 0) problem('Posição inválida.');
        let rows = await store.get(table);
        if (table === 'settings') rows = rows.filter(row => !SECRET_SETTINGS.has(row.id));
        rows.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        const page = rows.slice(offset, offset + PAGE_SIZE),
          next = offset + page.length < rows.length ? offset + page.length : null;
        return { table, total: rows.length, offset, rows: page, next };
      }
    }
  };
};

module.exports.BACKUP_TABLES = BACKUP_TABLES;
