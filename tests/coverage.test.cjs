const {test}=require('node:test'),assert=require('node:assert/strict');const {course}=require('../lib/course.cjs'),{grade}=require('../lib/grader.cjs');
test('cada uma das quarenta missões pode ser concluída ou enviada para avaliação',()=>{
const formulas={'l4-sum':'=SOMA(B2:B4)','l4-average':'=MÉDIA(B2:B4)','l5-if':'=SE(B2<7;"Revisar";"Aprovado")','l5-sumif':'=SOMASE(A2:A4;"Estudo";B2:B4)','l5-vlookup':'=PROCV("P02";A2:C4;3;FALSO)'};
for(const task of course.flatMap(l=>l.tasks)){
 let p={};switch(task.type){
 case 'choice':p={option:task.answer};break;
 case 'order':case 'macro':p={order:task.answer};break;
 case 'review':p={text:'Resposta desenvolvida pelo aluno para avaliação do professor, com exemplos e explicação. '.repeat(5)};break;
 case 'project':p={theme:'Manutenção de equipamentos',audience:'Alunos de mecânica',goal:'Explicar as etapas de manutenção preventiva',outline:'Abertura com objetivo e cenário. Desenvolvimento com etapas e exemplos. Fechamento com cuidados e perguntas para a turma.',sources:'Manual do fabricante consultado em aula.'};break;
 case 'cables':p={connections:Object.fromEntries(task.items.map(([id])=>[id,id]))};break;
 case 'files':p={locations:{'desenho.pdf':'Projetos','medidas.xlsx':'Planilhas','relato.docx':'Relatórios'}};break;
 case 'editor':p={title:'Comunicado de atividade',body:'Público: participantes do projeto. Objetivo: organizar um encontro de estudos com exemplos e exercícios. Orientação: trazer as anotações e registrar as dúvidas para a discussão.',list:true,highlight:true};break;
 case 'text':p={text:task.answer};break;
 case 'operations':p={values:[200,350,300,60]};break;
 case 'formula':p={formula:formulas[task.id]};break;
 case 'slides':p={slides:[{title:'Manutenção preventiva',body:'A manutenção preventiva reduz falhas e exige planejamento.',image:'gear',alt:'Engrenagem representa a transmissão do movimento.'},{title:'Inspeção dos componentes',body:'Observe sinais de desgaste e registre as condições da peça.',video:'https://example.com/video'},{title:'Cuidados e conclusão',body:'Siga os procedimentos da oficina e registre os resultados.'}]};break;
 case 'database':p={table:'pecas',fields:[{name:'id',type:'INTEGER',primary:true},{name:'nome',type:'TEXT',primary:false},{name:'estoque',type:'INTEGER',primary:false}]};break;
 case 'sql':p={sql:'SELECT * FROM pecas WHERE estoque < 5;'};break;
 default:assert.fail('Tipo de missão sem teste: '+task.type);
 }
 const result=grade(task,p);assert.equal(result.status,['project','review'].includes(task.type)?'pending':'approved',task.id+': '+result.feedback);assert.equal(result.xp,result.status==='pending'?0:task.xp);assert.equal(grade(task,{}).xp,0,task.id+' não deve aceitar envio vazio');
}
});
