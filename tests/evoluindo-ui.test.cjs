const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs');

// O código é formatado pelo Prettier: compara também a versão sem espaços, para o teste não depender de quebras de linha.
const squash = text => text.replace(/\s+/g, '');
const matchCode = (text, pattern) =>
  assert.ok(pattern.test(text) || pattern.test(squash(text)), 'Não encontrado: ' + pattern);
const noCode = (text, pattern) =>
  assert.ok(!pattern.test(text) && !pattern.test(squash(text)), 'Não deveria existir: ' + pattern);

test('publica a gestão visual de disciplinas para professor e aluno', () => {
  const html = fs.readFileSync('index.html', 'utf8'),
    source = fs.readFileSync('evoluindo-admin.js', 'utf8'),
    monitor = fs.readFileSync('duel-monitor.js', 'utf8'),
    refresh = fs.readFileSync('smooth-refresh.js', 'utf8'),
    reports = fs.readFileSync('championship-reports.js', 'utf8'),
    controls = fs.readFileSync('disqualification-controls.js', 'utf8'),
    questionImport = fs.readFileSync('question-import.js', 'utf8'),
    brand = fs.readFileSync('brand.js', 'utf8'),
    css = fs.readFileSync('evoluindo.css', 'utf8');
  matchCode(html, /evoluindo-admin\.js/);
  matchCode(source, /create-subject/);
  matchCode(source, /set-class-subject/);
  matchCode(source, /Disciplinas desta turma/);
  matchCode(source, /student-subjects/);
  matchCode(source, /create-question-bank/);
  matchCode(source, /save-question/);
  matchCode(source, /bank-questions/);
  matchCode(source, /create-simulation/);
  matchCode(source, /simulation-start/);
  matchCode(source, /simulation-submit/);
  matchCode(source, /create-championship/);
  matchCode(source, /championship-join/);
  matchCode(source, /duel-start/);
  matchCode(source, /duel-submit/);
  matchCode(source, /duel-bracket/);
  matchCode(source, /coreCourseContext/);
  matchCode(source, /heading\?\.remove\(\);grid\.remove\(\)/);
  noCode(source, /Informática Básica não está vinculada/);
  matchCode(html, /duel-monitor\.js/);
  matchCode(monitor, /deadline_at/);
  matchCode(monitor, /visibilitychange/);
  matchCode(monitor, /duel-focus/);
  matchCode(monitor, /durationSeconds/);
  matchCode(monitor, /championship-watch/);
  matchCode(monitor, /bracket-board/);
  matchCode(monitor, /bracketSize/);
  matchCode(monitor, /thirdMatch/);
  matchCode(monitor, /live-podium/);
  matchCode(monitor, /actual\.get\(index\)/);
  matchCode(monitor, /2\*\*distance/);
  matchCode(source, /entre 4 e 64/);
  matchCode(source, /championship-disclosure/);
  matchCode(monitor, /championship-disclosure\[open\]/);
  matchCode(html, /smooth-refresh\.js/);
  matchCode(refresh, /scrollTop=window\.scrollY/);
  matchCode(refresh, /selectedClass===renderedClass/);
  noCode(refresh, /loading\(\)/);
  matchCode(refresh, /explicitNoClass/);
  matchCode(refresh, /Nenhuma turma selecionada/);
  matchCode(html, /championship-reports\.js/);
  matchCode(reports, /championship-report/);
  matchCode(reports, /Perguntas com mais erros/);
  matchCode(reports, /Baixar CSV/);
  matchCode(html, /disqualification-controls\.js/);
  matchCode(controls, /disqualify-participant/);
  matchCode(controls, /Motivo da desclassifica/);
  matchCode(html, /question-import\.js/);
  matchCode(questionImport, /import-questions/);
  matchCode(questionImport, /export-question-bank/);
  matchCode(questionImport, /Baixar modelo JSON/);
  matchCode(css, /\.subject-options/);
  matchCode(css, /@media\(max-width:600px\)/);
  matchCode(brand, /textContent!==label/);
  matchCode(brand, /!courseLabel\.dataset\.evoluindo/);
});
