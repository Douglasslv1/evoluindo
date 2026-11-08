const {sheets}=require('./course.cjs');const {calculate}=require('./formula.cjs');
const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[.!?]+$/,'').replace(/\s+/g,' ').trim();
function safeLink(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}}
function grade(task,payload){
  const p=payload&&typeof payload==='object'&&!Array.isArray(payload)?payload:{};
  const fail=message=>({status:'retry',xp:0,feedback:message});const ok=(feedback='Missão concluída. Explique ao colega como você chegou ao resultado.')=>({status:'approved',xp:task.xp,feedback});
  const review=()=>({status:'pending',xp:0,feedback:'Recebido. O professor vai ler e devolver uma avaliação. O XP entra após a aprovação.'});
  if(task.type==='choice')return Number.isInteger(p.option)&&p.option===task.answer?ok(task.explain):fail('Ainda não. '+task.hint);
  if(task.type==='order'||task.type==='macro')return JSON.stringify(p.order)===JSON.stringify(task.answer)?ok(task.type==='macro'?'Simulação concluída: cópia criada, cabeçalho aplicado, total calculado e cópia de saída salva.':'Sequência correta.'):fail('Reveja a sequência. '+task.hint);
  if(task.type==='cables'){let expected={power:'power',usb:'usb',hdmi:'hdmi',network:'network',audio:'audio',mic:'mic'};let n=Object.keys(expected).filter(k=>p.connections?.[k]===expected[k]).length;return n===6?ok('Estação conectada: energia, teclado, vídeo, rede, áudio e microfone corretos.'):fail(`${n} de 6 conexões corretas. Observe o formato e a função de cada porta.`)}
  if(task.type==='files'){let expected={'desenho.pdf':'Projetos','medidas.xlsx':'Planilhas','relato.docx':'Relatórios'};let n=Object.keys(expected).filter(k=>p.locations?.[k]===expected[k]).length;return n===3?ok('Arquivos organizados. Mover mudou o local dos arquivos, sem criar cópias.'):fail(`${n} de 3 arquivos estão na pasta correta.`)}
  if(task.type==='operations')return JSON.stringify(p.values?.map(Number))===JSON.stringify([200,350,300,60])?ok('Os quatro cálculos estão corretos: 200, 350, 300 e 60.'):fail('Confira cada operação e a ordem dos números.');
  if(task.type==='formula'){
    try{let f=String(p.formula??''),normalized=normalize(f).toUpperCase();if(!new RegExp('\\b'+task.required+'\\s*\\(').test(normalized))return fail('Use a função '+task.required+' nesta missão.');const rows=structuredClone(sheets[task.sheet]);let v=calculate(f,rows);if(normalize(v)!==normalize(task.expected))return fail('A fórmula retornou '+String(v)+'. Confira as referências e o critério.');
      // Uma segunda tabela evita aceitar constantes disfarçadas de fórmula.
      let altered=structuredClone(rows),expected;if(task.sheet==='hours'){altered[1][1]=5;expected=task.required==='SOMA'?15:5}
      if(task.sheet==='grades'){altered[1][1]=8;expected='Aprovado'}
      if(task.sheet==='categories'){altered[1][1]=6;altered[2][1]=20;expected=11}
      if(task.sheet==='parts'){altered[2][2]=90;expected=90}
      if(normalize(calculate(f,altered))!==normalize(expected))return fail('A fórmula funcionou nesta tabela, mas não acompanhou uma mudança dos dados. Use as referências e o critério pedidos.');return ok('Fórmula correta. Resultado: '+String(v)+'. Ela também acompanhou uma alteração dos dados.');
    }catch(e){return fail(e.message)}
  }
  if(task.type==='text')return normalize(p.text)===normalize(task.answer)||(task.id==='l3-revision'&&normalize(p.text)==='os equipamentos precisam de manutencao preventiva')?ok('Concordância e escrita revisadas.'):fail('Confira o plural, a concordância e a acentuação.');
  if(task.type==='editor'){const text=String(p.body??''),current=/p[uú]blico/i.test(text)&&/objetivo/i.test(text)&&/orienta[cç][aã]o/i.test(text),legacy=/cliente/i.test(text)&&/servi[cç]o/i.test(text)&&/seguran[cç]a/i.test(text);return String(p.title??'').trim().length>=5&&text.length>=100&&(current||legacy)&&p.list===true&&p.highlight===true?ok('Estrutura preenchida, lista e destaque ativos. Revise também a clareza do texto.'):fail('Inclua título, pelo menos 100 caracteres, Público, Objetivo e Orientação. Ative lista e destaque.');}
  if(task.type==='slides'){let s=p.slides;if(!Array.isArray(s)||s.length!==3)return fail('Crie os três slides.');if(!s.every(x=>x&&typeof x.title==='string'&&x.title.trim().length>=4&&typeof x.body==='string'&&x.body.trim().length>=25))return fail('Cada slide precisa de título (4 caracteres) e texto (25 caracteres).');if(!s.some(x=>['gear','circuit','tools'].includes(x.image)&&String(x.alt??'').trim().length>=15))return fail('Escolha uma imagem e escreva uma descrição com pelo menos 15 caracteres.');if(!safeLink(s[1].video))return fail('Inclua um link de vídeo HTTPS válido no segundo slide.');return ok('Os três slides cumprem a estrutura. Confira conteúdo, fontes e legibilidade com o colega.');}
  if(task.type==='database'){let f=p.fields;return ['itens','pecas'].includes(normalize(p.table))&&Array.isArray(f)&&f.length===3&&f.every(x=>x&&typeof x==='object')&&f[0].name==='id'&&f[0].type==='INTEGER'&&f[0].primary===true&&f[1].name==='nome'&&f[1].type==='TEXT'&&!f[1].primary&&f[2].name==='estoque'&&f[2].type==='INTEGER'&&!f[2].primary?ok('Tabela criada no simulador: id único, nome textual e estoque numérico.'):fail('Confira o nome itens, os campos na ordem id, nome e estoque, seus tipos e a chave primária somente em id.');}
  if(task.type==='sql')return /^select\s+\*\s+from\s+(itens|pecas)\s+where\s+estoque\s*<\s*5\s*;?$/i.test(String(p.sql??'').trim())?ok('Consulta válida: Caneta (2) e Agenda (4) estão abaixo de 5 unidades.'):fail('Use SELECT * FROM itens WHERE estoque < 5; O simulador aceita essa forma de consulta.');
  if(task.type==='project'){let keys=['theme','audience','goal','outline','sources'];return keys.every(k=>typeof p[k]==='string'&&p[k].trim().length>=10)&&String(p.outline).length>=100?review():fail('Preencha os cinco campos (10 caracteres cada), com roteiro de pelo menos 100 caracteres.');}
  if(task.type==='review')return typeof p.text==='string'&&p.text.trim().length>=(task.min||120)?review():fail(`Desenvolva a resposta com pelo menos ${task.min||120} caracteres. A qualidade será avaliada pelo professor.`);
  return fail('Atividade desconhecida.');
}
module.exports={grade,safeLink};
