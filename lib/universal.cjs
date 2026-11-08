const {plans}=require('./learning.cjs');
// Apenas conteúdo editorial. Identificadores de missões e valores de XP permanecem estáveis.
function universalize(course,sheets){
  const substitutions=[['máquinas CNC','equipamentos conectados'],['um CAD','um editor de vídeo'],['o CAD','o editor de vídeo'],['desenhos abertos','arquivos abertos'],['alterações no desenho','alterações no documento'],['desenho em uma','documento em uma'],['Torno','Leitura'],['Fresa','Pesquisa'],['Inspeção','Atividade'],['inspeção','revisão'],['Peça A','Atividade A'],['Peça B','Atividade B'],['Peça C','Atividade C'],['Mecânica','Estudo'],['mecânica','estudo'],['Elétrica','Trabalho'],['Rolamento','Caderno'],['Correia','Mochila'],['Eixo','Fone'],['oficina','laboratório'],['Oficina','Estudos'],['pecas','itens'],['peças','itens'],['peça','item'],['Peça','Produto'],['peca.pdf','relatorio.pdf']];
  function walk(value){if(typeof value==='string'){for(const [from,to]of substitutions)value=value.split(from).join(to);return value}if(Array.isArray(value))return value.map(walk);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,walk(v)]));return value;}
  for(let i=0;i<course.length;i++){const updated=walk(course[i]);Object.assign(course[i],updated);course[i].study=plans[course[i].id];course[i].agenda=course[i].study.blocks.map(b=>[b.title,b.minutes]);}
  for(const l of course)l.concept=l.concept.map(c=>({...c,text:c.text.replaceAll('Prova Padrão Grau Técnico','prova oficial da instituição')}));
  for(const key of Object.keys(sheets))sheets[key]=walk(sheets[key]);
  sheets.categories[0][0]='Categoria';
  const set=(id,patch)=>Object.assign(course.flatMap(l=>l.tasks).find(t=>t.id===id),patch);
  course[0].title='Computadores: história e funcionamento';
  course[0].practice='Percorra as oito estações de estudo. Faça previsões, teste os simuladores e depois realize as missões. O modo guiado oferece apoio sem retirar pontos.';
  course[0].stretch='Compare perfis de uso, explique limites de desempenho e proponha verificações para problemas de memória, armazenamento e conexões.';
  set('l1-bonus',{title:'Diagnóstico de um computador',prompt:'Um computador fica lento com navegador, chamada de vídeo e documentos abertos. Descreva duas medições que faria e uma hipótese. Explique por que GHz sozinho não resolve o diagnóstico.'});
  course[1].title='Seu ambiente digital organizado';
  course[2].practice='Crie um comunicado sobre uma atividade de estudo, trabalho ou vida cotidiana. Use título, público, objetivo e orientações. Confira a prévia antes de enviar.';
  set('l3-editor',{title:'Um comunicado que orienta',prompt:'Crie um comunicado com título, público, objetivo e orientações para uma atividade de tema livre. Ative a lista e destaque a orientação principal.',hint:'Use Público:, Objetivo: e Orientação: no texto. Escreva pelo menos 100 caracteres, ative lista e destaque.'});
  set('l3-revision',{prompt:'Reescreva corretamente: “Os aluno precisa de orientacao para a atividade.”',answer:'os alunos precisam de orientação para a atividade',hint:'Revise o plural de aluno e a concordância do verbo. Acentue orientação.'});
  set('l3-bonus',{prompt:'Reescreva um comunicado sobre uma atividade com pelo menos duas orientações claras. Explique uma decisão de formatação e uma melhoria de acessibilidade.'});
  course[3].title='Organize e calcule com planilhas';course[3].practice='A planilha acompanha horas de atividades. Observe os endereços, explore as quatro operações e escreva fórmulas que acompanhem as mudanças de dados.';
  set('l5-sumif',{title:'Horas de estudo',prompt:'Use SOMASE para somar as horas da categoria "Estudo" em A2:B4.'});
  set('l5-if',{title:'Uma regra de acompanhamento'});
  set('l7-slides',{title:'Três slides, uma mensagem',prompt:'Crie uma apresentação de tema livre com abertura, desenvolvimento e conclusão. Inclua uma imagem com descrição e um link HTTPS de vídeo no desenvolvimento.'});
  set('l7-bonus',{prompt:'Escolha uma habilidade ou processo do cotidiano e descreva um vídeo curto que o ensine. Inclua objetivo, o que observar e uma alternativa caso o vídeo não funcione.'});
  set('l9-schema',{title:'Construa um catálogo',prompt:'Crie a tabela itens com id INTEGER (chave primária), nome TEXT e estoque INTEGER. Depois confira os registros fictícios.'});
  set('l9-query',{title:'Quais itens estão acabando?'});
  set('l9-bonus',{title:'Relacione cadastros',prompt:'Proponha campos para clientes e pedidos, ou leitores e empréstimos. Identifique as chaves primárias e a chave estrangeira que liga os registros. Explique como evitar repetição desnecessária de dados.'});
  set('l10-integrated',{title:'Explique seu projeto digital',prompt:'Descreva como organizar um projeto de estudo, trabalho ou vida pessoal usando pastas, documento, planilha e banco de dados. Cite um cuidado com salvamento e explique a diferença entre XP e nota oficial.'});
  course[9].stretch='Explique como um projeto pessoal, acadêmico ou profissional pode passar pelos aplicativos estudados sem perder organização e rastreabilidade.';
}
module.exports={universalize};
