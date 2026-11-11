// Funções compartilhadas: erros, senhas/PIN e validação de entradas.
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
function problem(message, status = 400) {
  const e = Error(message);
  e.status = status;
  throw e;
}
async function hash(password) {
  const salt = crypto.randomBytes(16).toString('hex'),
    out = await scrypt(password, salt, 64);
  return salt + ':' + out.toString('hex');
}
async function verify(password, stored) {
  if (typeof password !== 'string' || password.length > 128 || !stored) return false;
  const [salt, hex] = stored.split(':');
  if (!salt || !hex) return false;
  const derived = await scrypt(password, salt, 64);
  const expected = Buffer.from(hex, 'hex');
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}
function clean(value, min = 1, max = 100) {
  if (typeof value !== 'string') problem('Preencha os campos solicitados.');
  const v = value.trim();
  if (v.length < min || v.length > max || /[\u0000-\u001f]/.test(v))
    problem(`Use entre ${min} e ${max} caracteres, sem quebras de linha.`);
  return v;
}
function cleanText(value, min = 0, max = 12000) {
  if (typeof value !== 'string') problem('Preencha os campos solicitados.');
  const v = value.replace(/\r\n?/g, '\n').trim();
  if (v.length < min || v.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))
    problem(`Use entre ${min} e ${max} caracteres.`);
  return v;
}
// Tolerância para atraso de rede no envio automático ao fim do tempo. Depois disso, as respostas são descartadas.
const LATE_GRACE_MS = 10000;
const randomCode = () => crypto.randomBytes(6).toString('hex').toUpperCase();
module.exports = { problem, hash, verify, clean, cleanText, LATE_GRACE_MS, randomCode };
