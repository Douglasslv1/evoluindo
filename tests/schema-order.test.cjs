const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');

test('schema de instalação limpa cria tabelas referenciadas antes das dependentes',()=>{
  const sql=fs.readFileSync('database/schema.sql','utf8');
  const students=sql.indexOf('create table if not exists public.interface_students');
  const attempts=sql.indexOf('create table if not exists public.interface_simulation_attempts');
  const championships=sql.indexOf('create table if not exists public.interface_championships');
  assert.ok(students>0);
  assert.ok(students<attempts);
  assert.ok(students<championships);
  assert.match(sql,/add column if not exists duration_seconds/);
  assert.match(sql,/add column if not exists system_key/);
});
