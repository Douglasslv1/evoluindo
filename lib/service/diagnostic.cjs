// Diagnóstico de nível: distribuição de perguntas por dificuldade, desempenho por nível e classificação do aluno.
const crypto = require('node:crypto');
const { DIFFICULTIES, difficultyOf } = require('./difficulty.cjs');

const SIMULATION_KINDS = ['practice', 'diagnostic'];
// Peso de cada acerto: perguntas difíceis contam mais para o nível.
const WEIGHTS = { easy: 1, medium: 2, hard: 3 };
// Faixas de aproveitamento ponderado (em %), da menor para a maior.
const LEVELS = [
  { key: 'beginner', label: 'Iniciante', min: 0 },
  { key: 'intermediate', label: 'Intermediário', min: 40 },
  { key: 'advanced', label: 'Avançado', min: 75 }
];

function shuffle(rows) {
  const result = rows.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Sorteia exatamente a quantidade pedida de cada nível e devolve do mais fácil ao mais difícil.
// Devolve { error } quando a distribuição não fecha com a quantidade total ou com o banco.
function pickByDistribution(rows, distribution, total) {
  const counts = {};
  for (const level of DIFFICULTIES) {
    const value = Number(distribution?.[level] ?? 0);
    if (!Number.isInteger(value) || value < 0) return { error: 'Use números inteiros na distribuição.' };
    counts[level] = value;
  }
  const sum = DIFFICULTIES.reduce((acc, level) => acc + counts[level], 0);
  if (sum !== total)
    return { error: `A distribuição soma ${sum}, mas o questionário tem ${total} perguntas.` };
  const picked = [];
  for (const level of DIFFICULTIES) {
    const available = rows.filter(row => difficultyOf(row) === level);
    if (available.length < counts[level]) {
      const [one, many] = {
          easy: ['fácil', 'fáceis'],
          medium: ['média', 'médias'],
          hard: ['difícil', 'difíceis']
        }[level],
        n = available.length;
      return {
        error: `O banco tem ${n} pergunta${n === 1 ? '' : 's'} ${n === 1 ? one : many}, mas a distribuição pede ${counts[level]}.`
      };
    }
    picked.push(...shuffle(available).slice(0, counts[level]));
  }
  return { questions: picked };
}

// Acertos por nível e aproveitamento ponderado de uma tentativa.
function attemptStats(questions, answers) {
  const byLevel = Object.fromEntries(DIFFICULTIES.map(level => [level, { correct: 0, total: 0 }]));
  let earned = 0,
    possible = 0,
    score = 0;
  questions.forEach((question, index) => {
    const level = difficultyOf(question),
      right = Array.isArray(answers) && answers[index] === question.correct;
    byLevel[level].total++;
    possible += WEIGHTS[level];
    if (right) {
      byLevel[level].correct++;
      earned += WEIGHTS[level];
      score++;
    }
  });
  const percent = possible ? Math.round((earned / possible) * 100) : 0;
  return { byLevel, score, total: questions.length, percent, level: levelFor(percent) };
}

function levelFor(percent) {
  return [...LEVELS].reverse().find(level => percent >= level.min);
}

module.exports = { SIMULATION_KINDS, WEIGHTS, LEVELS, pickByDistribution, attemptStats, levelFor };
