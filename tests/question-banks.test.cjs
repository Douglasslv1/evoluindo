const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createService}=require('../lib/service.cjs');

test('professor gerencia bancos e perguntas vinculados à disciplina',async()=>{
  const base=path.resolve(__dirname,'..','test-output');fs.mkdirSync(base,{recursive:true});const directory=fs.mkdtempSync(path.join(base,'evoluindo-banks-')),file=path.join(directory,'data.json');
  try{
    const service=createService({file}),login=await service.execute('setup',{password:'senha-de-teste-forte'}),teacher=await service.session(login.token);
    const subject=(await service.execute('create-subject',{name:'Matemática',description:'Raciocínio aplicado.'},teacher)).subject;
    const bank=(await service.execute('create-question-bank',{subjectId:subject.id,name:'Fundamentos',description:'Questões iniciais.'},teacher)).bank;
    const created=(await service.execute('save-question',{bankId:bank.id,statement:'Quanto é dois mais dois?',options:['3','4','5','6'],correct:1,explanation:'Dois grupos de dois totalizam quatro.'},teacher)).question;
    let data=await service.execute('bank-questions',{bankId:bank.id},teacher);assert.equal(data.questions.length,1);assert.equal(data.questions[0].options[1],'4');assert.equal(data.bank.revision,2);
    await service.execute('save-question',{bankId:bank.id,id:created.id,statement:'Quanto é três mais dois?',options:['4','5','6','7'],correct:1,explanation:'A soma resulta em cinco.'},teacher);
    data=await service.execute('bank-questions',{bankId:bank.id},teacher);assert.equal(data.questions[0].statement,'Quanto é três mais dois?');
    await assert.rejects(()=>service.execute('save-question',{bankId:bank.id,statement:'Alternativas repetidas',options:['A','A'],correct:0},teacher),/diferentes/);
    await service.execute('delete-question',{id:created.id},teacher);assert.equal((await service.execute('bank-questions',{bankId:bank.id},teacher)).questions.length,0);
    await assert.rejects(()=>service.execute('bank-questions',{bankId:bank.id},null),{status:401});
  }finally{if(path.dirname(path.resolve(directory))!==base)throw Error('Diretório de teste inválido.');fs.rmSync(directory,{recursive:true,force:true})}
});
