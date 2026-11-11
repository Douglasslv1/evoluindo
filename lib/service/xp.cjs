// Extrato de XP e nota complementar. Regras puras: recebem os registros e não acessam o banco.
const { findTask } = require('../course.cjs');

const SOURCE_LABELS = { mission: 'Missões', simulation: 'Simulados', duel: 'Duelos' };
const COMPLEMENT_LIMITS = { maxPoints: 10, minTarget: 100, maxTarget: 100000 };

// Junta missões aprovadas (submissions) e eventos de simulados e duelos (xp_events) em um único extrato.
function xpStatement(submissions = [], xpEvents = []) {
  const entries = [
    ...submissions
      .filter(item => item.status === 'approved' && Number(item.xp) > 0)
      .map(item => ({
        source: 'mission',
        description: 'Missão: ' + (findTask(item.task_id)?.title || item.task_id),
        xp: Number(item.xp),
        date: item.updated_at || null
      })),
    ...xpEvents.map(event => ({
      source: SOURCE_LABELS[event.source_type] ? event.source_type : 'other',
      description: event.description || 'XP',
      xp: Number(event.xp || 0),
      date: event.created_at || null
    }))
  ].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const totals = { mission: 0, simulation: 0, duel: 0, other: 0 };
  for (const entry of entries) totals[entry.source] += entry.xp;
  return { entries, totals, total: entries.reduce((sum, entry) => sum + entry.xp, 0) };
}

// Configuração salva em settings como JSON. Sem configuração (ou com máximo zero), a nota complementar fica desativada.
function parseComplement(row) {
  if (!row?.value) return null;
  try {
    const value = JSON.parse(row.value),
      maxPoints = Number(value.maxPoints),
      targetXp = Number(value.targetXp);
    if (!(maxPoints > 0 && maxPoints <= COMPLEMENT_LIMITS.maxPoints)) return null;
    if (!Number.isInteger(targetXp) || targetXp < COMPLEMENT_LIMITS.minTarget) return null;
    return { maxPoints, targetXp };
  } catch {
    return null;
  }
}

// Proporcional ao XP, limitada ao máximo e arredondada para uma casa decimal.
function complementGrade(totalXp, config) {
  if (!config) return null;
  const value = Math.min(config.maxPoints, (config.maxPoints * Math.max(0, totalXp)) / config.targetXp);
  return Math.round(value * 10) / 10;
}

const complementKey = classId => 'complement:' + classId;

module.exports = {
  xpStatement,
  parseComplement,
  complementGrade,
  complementKey,
  COMPLEMENT_LIMITS,
  SOURCE_LABELS
};
