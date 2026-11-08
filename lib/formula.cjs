// Interpretador limitado ao laboratório. Nenhum eval, Function ou SQL é executado.
function calculate(source, rows) {
  if(typeof source!=='string'||source.length>300||!source.trim().startsWith('='))throw Error('Comece a fórmula com = e use até 300 caracteres.');
  const input=source.trim().slice(1).replace(/\$/g,'');let pos=0,tokens=[];
  while(pos<input.length){if(/\s/.test(input[pos])){pos++;continue}const m=/^("(?:[^"]|"")*"|\d+(?:\.\d+)?|[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ_0-9]*|>=|<=|<>|[+*/()=:;<>,-])/.exec(input.slice(pos));if(!m)throw Error('Há um símbolo não reconhecido na fórmula.');tokens.push(m[0]);pos+=m[0].length;if(tokens.length>150)throw Error('Fórmula muito longa.');}
  let at=0,depth=0;const peek=()=>tokens[at],take=()=>tokens[at++],norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  function cell(ref){const m=/^([A-Z]{1,2})([1-9]\d?)$/i.exec(ref);if(!m)throw Error('Referência inválida.');let col=0;for(const c of m[1].toUpperCase())col=col*26+c.charCodeAt(0)-64;const row=+m[2];if(row>30||col>20)throw Error('Use células entre A1 e T30.');return {row:row-1,col:col-1};}
  function get(ref){const c=cell(ref);return rows[c.row]?.[c.col]??'';}
  function num(v){if(Array.isArray(v)||typeof v==='boolean'||v===''||!Number.isFinite(Number(v)))throw Error('O cálculo exige valores numéricos.');return Number(v);}
  function atom(){if(++depth>30)throw Error('Muitos parênteses.');let t=take(),v;if(!t)throw Error('Fórmula incompleta.');
    if(t==='('){v=compare();if(take()!==')')throw Error('Feche os parênteses.');}
    else if(t==='-'||t==='+')v=(t==='-'?-1:1)*num(atom());
    else if(t.startsWith('"'))v=t.slice(1,-1).replace(/""/g,'"');
    else if(/^\d/.test(t))v=Number(t);
    else if(peek()==='('){take();let args=[];if(peek()!==')'){do{args.push(compare());if(peek()!==';'&&peek()!==',')break;take()}while(true)}if(take()!==')')throw Error('Confira os argumentos e parênteses.');let name=norm(t),flat=args.flat(3);if(name==='SOMA'||name==='MEDIA'){let n=flat.filter(x=>typeof x==='number');if(!n.length)throw Error('O intervalo não contém números.');v=n.reduce((s,x)=>s+x,0);if(name==='MEDIA')v/=n.length;}
      else if(name==='SE'){if(args.length!==3||typeof args[0]!=='boolean')throw Error('SE exige um teste e dois resultados.');v=args[0]?args[1]:args[2];}
      else if(name==='SOMASE'){if(args.length!==3||!Array.isArray(args[0])||!Array.isArray(args[2]))throw Error('Use SOMASE(intervalo;critério;intervalo_soma).');let criteria=args[0].flat(),values=args[2].flat();if(criteria.length!==values.length)throw Error('Os intervalos devem ter o mesmo tamanho.');v=criteria.reduce((s,x,i)=>s+(norm(x)===norm(args[1])?num(values[i]):0),0);}
      else if(name==='PROCV'){if(args.length!==4||!Array.isArray(args[1])||args[3]!==false)throw Error('Use PROCV com quatro argumentos e FALSO para a busca exata.');let ix=num(args[2]);if(!Number.isInteger(ix)||ix<1||ix>args[1][0].length)throw Error('Índice de coluna fora da tabela.');let row=args[1].find(r=>norm(r[0])===norm(args[0]));if(!row)throw Error('Código não encontrado na primeira coluna.');v=row[ix-1];}
      else throw Error('Função não disponível: use SOMA, MÉDIA, SE, SOMASE ou PROCV.');
    }else if(['VERDADEIRO','FALSO'].includes(norm(t)))v=norm(t)==='VERDADEIRO';
    else if(/^[A-Z]{1,2}[1-9]\d?$/i.test(t)){if(peek()===':'){take();let end=take(),a=cell(t),b=cell(end);if(a.row>b.row||a.col>b.col)throw Error('Confira a ordem do intervalo.');v=[];for(let r=a.row;r<=b.row;r++){let line=[];for(let c=a.col;c<=b.col;c++)line.push(rows[r]?.[c]??'');v.push(line)}}else v=get(t);}
    else throw Error('Nome ou referência não reconhecida.');depth--;return v;
  }
  function product(){let v=atom();while(peek()==='*'||peek()==='/'){let op=take(),r=num(atom());if(op==='/'&&r===0)throw Error('Divisão por zero.');v=op==='*'?num(v)*r:num(v)/r}return v;}
  function sum(){let v=product();while(peek()==='+'||peek()==='-'){let op=take(),r=num(product());v=op==='+'?num(v)+r:num(v)-r}return v;}
  function compare(){let v=sum();if(['=','<>','>','<','>=','<='].includes(peek())){let op=take(),r=sum();v=op==='='?v===r:op==='<>'?v!==r:op==='>'?v>r:op==='<'?v<r:op==='>='?v>=r:v<=r}return v;}
  const value=compare();if(at!==tokens.length||Array.isArray(value)||typeof value==='boolean'||(typeof value==='number'&&!Number.isFinite(value)))throw Error('Confira a fórmula: o resultado deve ser um número ou texto.');return value;
}
module.exports={calculate};
