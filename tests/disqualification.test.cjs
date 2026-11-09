const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createService}=require('../lib/service.cjs');

test('desclassificação docente registra motivo e avança o adversário sem punição automática',async()=>{
  const base=path.resolve(__dirname,'..','test-output');fs.mkdirSync(base,{recursive:true});const directory=fs.mkdtempSync(path.join(base,'evoluindo-disqualification-')),file=path.join(directory,'data.json');
  try{
    const service=createService({file}),login=await service.execute('setup',{password:'senha-de-teste-forte'}),teacher=await service.session(login.token),classroom=(await service.execute('create-class',{name:'Turma D'},teacher)).classroom,subject=(await service.execute('create-subject',{name:'Disciplina D'},teacher)).subject;
    await service.execute('set-class-subject',{classId:classroom.id,subjectId:subject.id,assigned:true},teacher);const bank=(await service.execute('create-question-bank',{subjectId:subject.id,name:'Banco D'},teacher)).bank;await service.execute('save-question',{bankId:bank.id,statement:'Pergunta para desclassificação?',options:['Não','Sim'],correct:1},teacher);
    const championship=(await service.execute('create-championship',{classId:classroom.id,subjectId:subject.id,bankId:bank.id,title:'Copa D',questionCount:1,duelXp:20,winnerBonus:10},teacher)).championship,sessions=[];
    for(let index=0;index<2;index++){const registration=await service.execute('register',{classCode:classroom.code,name:`Participante ${index+1}`,pin:`65432${index}`}),student=await service.session(registration.token);sessions.push(student);await service.execute('championship-join',{id:championship.id},student)}
    await service.execute('start-championship',{id:championship.id},teacher);for(const student of sessions){await service.execute('leveling-start',{id:championship.id},student);await service.execute('leveling-submit',{id:championship.id,answers:[1]},student)}await service.execute('start-knockout',{id:championship.id},teacher);const match=(await service.store.get('duel_matches',{championship_id:championship.id}))[0],removed=match.player1_id,winner=match.player2_id;
    await assert.rejects(()=>service.execute('disqualify-participant',{id:championship.id,studentId:removed,reason:'Conduta registrada pelo professor.'},sessions[0]),{status:401});
    await service.execute('disqualify-participant',{id:championship.id,studentId:removed,reason:'Conduta registrada pelo professor.'},teacher);const finished=(await service.store.get('championships',{id:championship.id}))[0];assert.equal(finished.status,'finished');assert.equal(finished.champion_id,winner);assert.equal((await service.store.get('xp_events')).length,0);
    const audit=await service.execute('championship-disqualifications',{id:championship.id},teacher);assert.equal(audit.participants.length,1);assert.equal(audit.participants[0].reason,'Conduta registrada pelo professor.');
  }finally{if(path.dirname(path.resolve(directory))!==base)throw Error('Diretório de teste inválido.');fs.rmSync(directory,{recursive:true,force:true})}
});
