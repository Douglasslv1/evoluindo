const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createStore}=require('../lib/store.cjs');

test('conclusão concorrente preserva o primeiro resultado confirmado do duelo',async()=>{
  const base=path.resolve(__dirname,'..','test-output');fs.mkdirSync(base,{recursive:true});const directory=fs.mkdtempSync(path.join(base,'evoluindo-cas-')),file=path.join(directory,'data.json');
  try{const store=createStore({file});await store.insert('duel_matches',{id:'match-1',status:'open',winner_id:null});const first=await store.update('duel_matches','match-1',{status:'finished',winner_id:'student-a'}),second=await store.update('duel_matches','match-1',{status:'finished',winner_id:'student-b'});assert.equal(first.winner_id,'student-a');assert.equal(second.winner_id,'student-a');assert.equal((await store.get('duel_matches',{id:'match-1'}))[0].winner_id,'student-a')}finally{if(path.dirname(path.resolve(directory))!==base)throw Error('Diretório de teste inválido.');fs.rmSync(directory,{recursive:true,force:true})}
});

test('pacote de publicação documenta banco, segredos e verificação externa',()=>{
  const guide=fs.readFileSync('PUBLICAR.md','utf8'),verify=fs.readFileSync('scripts/verify-deployment.cjs','utf8'),schema=fs.readFileSync('database/schema.sql','utf8'),check=fs.readFileSync('database/verify-after-schema.sql','utf8'),pkg=require('../package.json');
  assert.match(guide,/SUPABASE_SECRET_KEY/);assert.match(guide,/backup/i);assert.match(guide,/dois navegadores/i);assert.equal(pkg.scripts['verify:deployment'],'node scripts/verify-deployment.cjs');assert.match(verify,/data\.mode,'cloud'/);assert.match(schema,/interface_schema_migrations/);assert.match(check,/missing_table/);
});
