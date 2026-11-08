(()=>{
  if(typeof api!=='function')return;
  const originalApi=api;
  let active=null,timer=null,visibilityHandler=null;
  api=async function(action,payload={}){
    const result=await originalApi(action,payload);
    if(action==='duel-start'){
      active={matchId:payload.matchId,deadline:new Date(result.deadline_at).getTime()};
      queueMicrotask(attachMonitor);
    }
    if(action==='duel-submit')clearMonitor();
    return result;
  };

  function clearMonitor(){
    if(timer)clearInterval(timer);timer=null;
    if(visibilityHandler)document.removeEventListener('visibilitychange',visibilityHandler);visibilityHandler=null;
    active=null;
  }

  function attachMonitor(){
    const form=document.getElementById('duel-form');
    if(!form||!active||form.dataset.monitored)return;
    form.dataset.monitored='true';
    const clock=document.createElement('div');clock.className='duel-clock';clock.setAttribute('role','timer');
    form.insertAdjacentElement('afterbegin',clock);
    const update=()=>{
      if(!active)return;
      const remaining=Math.max(0,active.deadline-Date.now()),seconds=Math.ceil(remaining/1000);
      clock.textContent=`Tempo restante: ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
      clock.classList.toggle('urgent',seconds<=15);
      if(remaining<=0){clearInterval(timer);timer=null;expire(form)}
    };
    visibilityHandler=()=>{if(active)originalApi('duel-focus',{matchId:active.matchId,eventType:document.hidden?'hidden':'visible'}).catch(()=>{})};
    document.addEventListener('visibilitychange',visibilityHandler);update();timer=setInterval(update,250);
  }

  function expire(form){
    form.querySelectorAll('input[type=radio]').forEach(input=>input.required=false);
    const groups=[...new Set([...form.querySelectorAll('input[type=radio]')].map(input=>input.name))];
    for(const name of groups)if(!form.querySelector(`input[name="${name}"]:checked`)){
      const hidden=document.createElement('input');hidden.type='hidden';hidden.name=name;hidden.value='-1';form.append(hidden);
    }
    const button=form.querySelector('button[type=submit]');if(button){button.textContent='Tempo encerrado · enviando…';form.requestSubmit(button)}
  }

  function focusIndicators(){
    if(typeof state==='undefined'||state?.role!=='teacher'||typeof teacher==='undefined')return;
    const cards=document.querySelectorAll('.championship-manager .championship-grid>article'),items=(teacher.championships||[]).filter(item=>item.class_id===selectedClass);
    cards.forEach((card,index)=>{const item=items[index];if(!item?.focus_count||card.querySelector('.focus-indicator'))return;const note=document.createElement('small');note.className='focus-indicator';note.textContent=`⚠ ${item.focus_count} saída${item.focus_count===1?'':'s'} da aba registrada${item.focus_count===1?'':'s'}`;card.append(note)})
  }

  function championshipDurationField(){
    const form=document.getElementById('championship-form'),columns=form?.querySelector('.form-columns');
    if(!columns||form.elements.durationSeconds)return;
    const label=document.createElement('label');label.innerHTML='Tempo por duelo (segundos)<input name="durationSeconds" type="number" min="30" max="600" required value="90">';columns.append(label);
  }

  new MutationObserver(()=>{attachMonitor();focusIndicators();championshipDurationField()}).observe(document.body,{childList:true,subtree:true});
})();
