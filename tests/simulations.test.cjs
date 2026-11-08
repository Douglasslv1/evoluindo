const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createService}=require('../lib/service.cjs');

test('simulado da turma congela perguntas, corrige no servidor e concede XP uma vez',async()=>{
  const base=path.resolve(__dirname,'..','test-output');fs.mkdirSync(base,{recursive:true});const directory=fs.mkdtempSync(path.join(base,'evoluindo-simulations-')),file=path.join(directory,'data.json');
  try{
    const service=createService({file}),login=await service.execute('setup',{password:'senha-de-teste-forte'}),teacher=await service.session(login.token);
    const classroom=(await service.execute('create-class',{name:'Turma de testes'},teacher)).classroom,subject=(await service.execute('create-subject',{name:'Ciências'},teacher)).subject;
    await service.execute('set-class-subject',{classId:classroom.id,subjectId:subject.id,assigned:true},teacher);
    const bank=(await service.execute('create-question-bank',{subjectId:subject.id,name:'Revisão'},teacher)).bank;
    for(let index=0;index<3;index++)await service.execute('save-question',{bankId:bank.id,statement:`Pergunta número ${index+1}?`,options:['Errada A','Correta','Errada B','Errada C'],correct:1,explanation:'A alternativa B é a correta.'},teacher);
    const simulation=(await service.execute('create-simulation',{classId:classroom.id,subjectId:subject.id,bankId:bank.id,title:'Simulado inicial',questionCount:3,maxXp:120},teacher)).simulation;
    const registration=await service.execute('register',{classCode:classroom.code,name:'Estudante Teste',pin:'123456'}),student=await service.session(registration.token);
    assert.equal((await service.execute('me',{},student)).simulations.length,0);
    await service.execute('set-simulation-status',{id:simulation.id,status:'open'},teacher);
    const start=await service.execute('simulation-start',{id:simulation.id},student);assert.equal(start.questions.length,3);assert.equal(start.questions[0].correct,undefined);
    const submitted=await service.execute('simulation-submit',{id:simulation.id,answers:[1,1,0]},student);assert.equal(submitted.result.score,2);assert.equal(submitted.result.xp,80);assert.equal(submitted.state.xpEvents.length,1);assert.equal(submitted.state.xpEvents[0].xp,80);
    await assert.rejects(()=>service.execute('simulation-submit',{id:simulation.id,answers:[1,1,1]},student),{status:409});
    await service.execute('set-simulation-status',{id:simulation.id,status:'closed'},teacher);await assert.rejects(()=>service.execute('set-simulation-status',{id:simulation.id,status:'open'},teacher));
    const report=await service.execute('class-report',{classId:classroom.id},teacher);assert.equal(report.simulationAttempts[0].score,2);assert.equal(report.xpEvents.length,1);
  }finally{if(path.dirname(path.resolve(directory))!==base)throw Error('Diretório de teste inválido.');fs.rmSync(directory,{recursive:true,force:true})}
});
