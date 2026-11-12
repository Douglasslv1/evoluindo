// Dificuldade das perguntas e sorteio equilibrado entre os níveis.
const crypto = require('node:crypto');

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const DIFFICULTY_LABELS = { easy: 'Fácil', medium: 'Média', hard: 'Difícil' };

// Aceita os valores internos e os nomes em português (com ou sem acento), vindos do formulário ou de um JSON importado.
const ALIASES = {
  easy: 'easy',
  facil: 'easy',
  medium: 'medium',
  media: 'medium',
  medio: 'medium',
  hard: 'hard',
  dificil: 'hard'
};
function normalizeDifficulty(value) {
  if (value === undefined || value === null || value === '') return 'medium';
  // Remove acentos: "Fácil" → "facil", "Difícil" → "dificil".
  const key = String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  return ALIASES[key] || null;
}
// Perguntas antigas, sem o campo, contam como média.
const difficultyOf = question =>
  DIFFICULTIES.includes(question?.difficulty) ? question.difficulty : 'medium';

function shuffle(rows) {
  const result = rows.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Sorteia "count" perguntas alternando entre fácil, média e difícil enquanto houver de cada nível,
// e devolve em ordem crescente de dificuldade. Com um único nível no banco, equivale a um sorteio simples.
function pickBalanced(rows, count) {
  const groups = DIFFICULTIES.map(level => shuffle(rows.filter(row => difficultyOf(row) === level))),
    picked = [];
  while (picked.length < count && groups.some(group => group.length))
    for (const group of shuffle(groups.filter(group => group.length))) {
      if (picked.length >= count) break;
      picked.push(group.shift());
    }
  return picked.sort((a, b) => DIFFICULTIES.indexOf(difficultyOf(a)) - DIFFICULTIES.indexOf(difficultyOf(b)));
}

// Quantidade de perguntas por nível, para o painel do professor.
function difficultyCounts(rows) {
  const counts = { easy: 0, medium: 0, hard: 0 };
  for (const row of rows) counts[difficultyOf(row)]++;
  return counts;
}

module.exports = {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  normalizeDifficulty,
  difficultyOf,
  pickBalanced,
  difficultyCounts
};
