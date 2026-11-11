const fs = require('node:fs'),
  path = require('node:path');
// Limpeza restrita à saída gerada, sem tocar no código nem nos dados locais.
const output = path.resolve(__dirname, 'dist');
if (path.dirname(output) !== path.resolve(__dirname)) throw Error('Saída inválida.');
fs.mkdirSync(output, { recursive: true });
for (const item of fs.readdirSync(output, { withFileTypes: true })) {
  if (item.isFile()) fs.unlinkSync(path.join(output, item.name));
}
for (const name of [
  'index.html',
  'course.css',
  'course-app.js',
  'study.js',
  'study.css',
  'evoluindo.css',
  'brand.js',
  'evoluindo-admin.js',
  'duel-monitor.js',
  'smooth-refresh.js',
  'championship-reports.js',
  'disqualification-controls.js',
  'question-import.js',
  'owl.svg'
])
  fs.copyFileSync(path.join(__dirname, name), path.join(output, name));
console.log('Evoluindo pronta em dist. API e conteúdo protegido permanecem no servidor.');
