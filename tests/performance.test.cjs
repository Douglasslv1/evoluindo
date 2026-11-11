const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createService}=require('../lib/service.cjs'),{createStore}=require('../lib/store.cjs');
const base=path.resolve(__dirname,'..','test-output');
function tempDir(name){fs.mkdirSync(base,{recursive:true});return fs.mkdtempSync(path.join(base,name))}
function cleanup(directory){if(path.dirname(path.resolve(directory))!==base)throw Error('Diretório de teste inválido.');fs.rmSync(directory,{recursive:true,force:true})}

test('filtro por lista funciona no modo local e vira "in" no Supabase',async()=>{
  const directory=tempDir('evoluindo-filter-');
  try{
    const store=createStore({file:path.join(directory,'data.json')});
    for(const id of ['a','b','c'])await store.insert('settings',{id,value:id});
    assert.deepEqual((await store.get('settings',{id:['a','c']})).map(row=>row.id).sort(),['a','c']);
    assert.deepEqual(await store.get('settings',{id:[]}),[]);
  }finally{cleanup(directory)}
  const previous={mode:process.env.STORAGE_MODE,url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SECRET_KEY},originalFetch=global.fetch,urls=[];
  Object.assign(process.env,{STORAGE_MODE:'supabase',SUPABASE_URL:'https://exemplo.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_teste'});
  global.fetch=async url=>{urls.push(String(url));return {ok:true,status:200,json:async()=>[]}};
  try{
    const cloud=createStore();await cloud.get('students',{class_id:['id-1','id-2'],active:true});
    assert.equal(urls.length,1);const parsed=new URL(urls[0]);
    assert.equal(parsed.searchParams.get('class_id'),'in.("id-1","id-2")');assert.equal(parsed.searchParams.get('active'),'eq.true');
    urls.length=0;assert.deepEqual(await cloud.get('students',{class_id:[]}),[]);assert.equal(urls.length,0,'Lista vazia não deve consultar o banco.');
  }finally{
    global.fetch=originalFetch;
    for(const [key,name] of [['mode','STORAGE_MODE'],['url','SUPABASE_URL'],['key','SUPABASE_SECRET_KEY']])if(previous[key]===undefined)delete process.env[name];else process.env[name]=previous[key];
  }
});

test('atualização do aluno não lê tabelas inteiras nem refaz as aulas fundamentais',async()=>{
  const directory=tempDir('evoluindo-perf-');
  try{
    const service=createService({file:path.join(directory,'data.json')}),login=await service.execute('setup',{password:'senha-de-teste-forte'}),teacher=await service.session(login.token);
    const classes=[];for(let index=0;index<3;index++)classes.push((await service.execute('create-class',{name:`Turma ${index+1}`},teacher)).classroom);
    const subject=(await service.execute('create-subject',{name:'Disciplina desempenho',classId:classes[0].id},teacher)).subject,bank=(await service.execute('create-question-bank',{subjectId:subject.id,name:'Banco desempenho'},teacher)).bank;
    for(let index=0;index<2;index++)await service.execute('save-question',{bankId:bank.id,statement:`Pergunta desempenho ${index+1}?`,options:['Errada','Correta'],correct:1},teacher);
    await service.execute('create-championship',{classId:classes[0].id,subjectId:subject.id,bankId:bank.id,title:'Copa desempenho',levelingQuestionCount:2,questionCount:2,duelXp:10,winnerBonus:5},teacher);
    await service.execute('release',{classId:classes[0].id,lessons:[1]},teacher);
    const student=await service.session((await service.execute('register',{classCode:classes[0].code,name:'Aluno desempenho',pin:'135790'})).token);
    await service.execute('me',{},student);
    // Mede apenas a atualização periódica, depois que os caches da instância já existem.
    const calls=[],originalGet=service.store.get,originalInsert=service.store.insert;
    service.store.get=function(table,filters={}){calls.push({table,filters});return originalGet.call(this,table,filters)};
    service.store.insert=function(table,...rest){calls.push({table,insert:true});return originalInsert.call(this,table,...rest)};
    const state=await service.execute('me',{},student);
    service.store.get=originalGet;service.store.insert=originalInsert;
    const heavy=['students','duel_matches','championship_participants','lessons','class_lessons','classes','questions','submissions','xp_events'];
    assert.deepEqual(calls.filter(call=>!call.insert&&heavy.includes(call.table)&&!Object.keys(call.filters).length).map(call=>call.table),[],'Consultas sem filtro em tabelas grandes.');
    assert.deepEqual(calls.filter(call=>call.insert).map(call=>call.table),[],'A atualização não deve gravar nada.');
    assert.equal(calls.filter(call=>call.table==='settings').length,0,'A disciplina fundamental deve vir do cache.');
    assert.equal(state.lessons.find(lesson=>lesson.legacy_lesson_id===1).published,true);assert.equal(state.championships.length,1);
  }finally{cleanup(directory)}
});

test('limite de login protege cada conta sem bloquear a rede da escola',async()=>{
  const directory=tempDir('evoluindo-limit-');
  try{
    const service=createService({file:path.join(directory,'data.json')}),login=await service.execute('setup',{password:'senha-de-teste-forte'}),teacher=await service.session(login.token);
    const classroom=(await service.execute('create-class',{name:'Turma limite'},teacher)).classroom,registered=await service.execute('register',{classCode:classroom.code,name:'Aluno limite',pin:'246802'});
    const code=registered.student.access_code;
    // Tentativas erradas vindas de muitos IPs: a conta é protegida após 30 tentativas.
    for(let index=0;index<30;index++)await assert.rejects(()=>service.execute('student-login',{accessCode:code,pin:'000000'},null,'10.0.0.'+index),{status:401});
    await assert.rejects(()=>service.execute('student-login',{accessCode:code,pin:'246802'},null,'10.0.1.1'),{status:429});
    // Outros alunos na mesma rede continuam entrando normalmente.
    for(let index=0;index<5;index++){const other=await service.execute('register',{classCode:classroom.code,name:`Colega ${index+1}`,pin:'112233'},null,'escola');const ok=await service.execute('student-login',{accessCode:other.student.access_code,pin:'112233'},null,'escola');assert.ok(ok.token)}
  }finally{cleanup(directory)}
});
