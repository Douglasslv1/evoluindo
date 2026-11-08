const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createService}=require('../lib/service.cjs');

test('disciplinas independentes podem ser vinculadas e removidas das turmas',async()=>{
  const base=path.resolve(__dirname,'..','test-output');fs.mkdirSync(base,{recursive:true});
  const directory=fs.mkdtempSync(path.join(base,'evoluindo-subjects-')),file=path.join(directory,'data.json');
  try{
    const service=createService({file}),login=await service.execute('setup',{password:'senha-de-teste-forte'}),teacher=await service.session(login.token);
    const classroom=(await service.execute('create-class',{name:'Mecânica 2027'},teacher)).classroom;
    const subject=(await service.execute('create-subject',{name:'Desenho Mecânico',description:'Disciplina cadastrada, sem vínculo fixo com AutoCAD.'},teacher)).subject;
    assert.equal((await service.execute('teacher-state',{},teacher)).subjects.length,1);
    await service.execute('set-class-subject',{classId:classroom.id,subjectId:subject.id,assigned:true},teacher);
    let report=await service.execute('class-report',{classId:classroom.id},teacher);
    assert.deepEqual(report.subjects.map(item=>item.name),['Desenho Mecânico']);
    const registered=await service.execute('register',{classCode:classroom.code,name:'Aluno Teste',pin:'123456'}),student=await service.session(registered.token);
    assert.deepEqual((await service.execute('me',{},student)).subjects.map(item=>item.id),[subject.id]);
    await service.execute('set-class-subject',{classId:classroom.id,subjectId:subject.id,assigned:false},teacher);
    report=await service.execute('class-report',{classId:classroom.id},teacher);
    assert.equal(report.subjects.length,0);
    await assert.rejects(()=>service.execute('create-subject',{name:'desenho mecânico'},teacher),/Já existe/);
  }finally{if(path.dirname(path.resolve(directory))!==base)throw Error('Diretório de teste inválido.');fs.rmSync(directory,{recursive:true,force:true})}
});
