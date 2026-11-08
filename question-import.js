(()=>{
  if(typeof api!=='function')return;
  const originalApi=api;
  let activeBank=null;
  api=async function(action,payload={}){
    const result=await originalApi(action,payload);
    if(action==='bank-questions'){activeBank=result.bank;queueMicrotask(enhanceBank)}
    return result;
  };

  function enhanceBank(){
    const button=document.getElementById('new-question');if(!button||!activeBank||document.getElementById('import-questions'))return;
    const actions=document.createElement('div');actions.className='bank-import-actions';actions.innerHTML='<button type="button" class="ghost" id="import-questions">Importar JSON</button><button type="button" class="ghost" id="export-questions">Exportar JSON</button>';
    button.parentElement.append(actions);document.getElementById('import-questions').onclick=openImport;document.getElementById('export-questions').onclick=exportBank;
  }

  function openImport(){
    const bank=activeBank;modal(`<div class="eyebrow">IMPORTAR QUESTÕES / ${escapeHtml(bank.name)}</div><h2>Importação por JSON</h2><p>O arquivo inteiro será validado antes de qualquer pergunta ser salva.</p><form id="question-import-form"><label>Arquivo JSON<input id="question-json-file" type="file" accept="application/json,.json" required></label><div class="button-row"><button type="button" class="text-btn" id="download-question-template">Baixar modelo JSON</button></div><div id="question-import-preview" class="import-preview empty compact">Selecione um arquivo com até 500 perguntas.</div><p id="question-import-error" class="form-error" role="alert"></p><div class="button-row"><button type="submit" class="primary" id="confirm-question-import" disabled>Confirmar importação</button><button type="button" class="ghost" id="cancel-question-import">Cancelar</button></div></form>`);
    let questions=null;const file=document.getElementById('question-json-file'),preview=document.getElementById('question-import-preview'),error=document.getElementById('question-import-error'),confirm=document.getElementById('confirm-question-import');
    document.getElementById('download-question-template').onclick=downloadTemplate;document.getElementById('cancel-question-import').onclick=()=>openQuestionBank(bank.id);
    file.onchange=async()=>{questions=null;confirm.disabled=true;error.textContent='';try{const selected=file.files[0];if(!selected)throw Error('Selecione um arquivo JSON.');if(selected.size>900000)throw Error('O arquivo ultrapassa o limite de 900 KB.');const parsed=JSON.parse(await selected.text()),items=Array.isArray(parsed)?parsed:parsed?.questions;if(!Array.isArray(items)||!items.length)throw Error('O JSON deve ser uma lista de perguntas ou possuir o campo questions.');if(items.length>500)throw Error('O arquivo possui mais de 500 perguntas.');questions=items;preview.className='import-preview';preview.innerHTML=`<strong>${items.length} pergunta${items.length===1?'':'s'} encontrada${items.length===1?'':'s'}</strong><ol>${items.slice(0,5).map(item=>`<li>${escapeHtml(item.statement??item.question??'Sem enunciado')}</li>`).join('')}</ol>${items.length>5?`<small>e mais ${items.length-5} pergunta${items.length-5===1?'':'s'}...</small>`:''}`;confirm.disabled=false}catch(reason){preview.className='import-preview empty compact';preview.textContent='O arquivo não pôde ser preparado.';error.textContent=reason.message}};
    document.getElementById('question-import-form').onsubmit=async event=>{event.preventDefault();if(!questions)return;confirm.disabled=true;confirm.textContent='Validando e importando…';try{const result=await originalApi('import-questions',{bankId:bank.id,questions});toast(`${result.imported} pergunta${result.imported===1?' importada':'s importadas'} com sucesso.`);await openQuestionBank(bank.id)}catch(reason){error.textContent=reason.message;confirm.disabled=false;confirm.textContent='Confirmar importação'}};
  }

  async function exportBank(){
    const button=document.getElementById('export-questions');button.disabled=true;try{const data=await originalApi('export-question-bank',{bankId:activeBank.id}),name=(activeBank.name||'banco-de-questoes').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');downloadText(`${name||'banco-de-questoes'}.json`,JSON.stringify(data,null,2));toast('Banco exportado em JSON.')}catch(error){toast(error.message)}finally{button.disabled=false}
  }

  function downloadTemplate(){const template=[{statement:'Qual é a resposta correta?',options:['Alternativa A','Alternativa B','Alternativa C','Alternativa D'],correct:1,explanation:'A alternativa B é a resposta correta.'}];downloadText('modelo-banco-evoluindo.json',JSON.stringify(template,null,2))}
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}

  new MutationObserver(enhanceBank).observe(document.getElementById('modal-content'),{childList:true,subtree:true});
})();
