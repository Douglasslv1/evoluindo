(()=>{
  if(typeof api!=='function')return;
  const originalApi=api;
  let active=null,timer=null,visibilityHandler=null;
  api=async function(action,payload={}){
    const result=await originalApi(action,payload);
    if(action==='duel-start'){
      active={type:'duel',matchId:payload.matchId,deadline:new Date(result.deadline_at).getTime()};
      queueMicrotask(attachMonitor);
    }
    if(action==='leveling-start'){
      active={type:'leveling',deadline:new Date(result.deadline_at).getTime()};
      queueMicrotask(attachMonitor);
    }
    if(action==='duel-submit'||action==='leveling-submit')clearMonitor();
    return result;
  };

  function clearMonitor(){
    if(timer)clearInterval(timer);timer=null;
    if(visibilityHandler)document.removeEventListener('visibilitychange',visibilityHandler);visibilityHandler=null;
    active=null;
  }

  function attachMonitor(){
    const form=document.getElementById(active?.type==='leveling'?'leveling-form':'duel-form');
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
    visibilityHandler=()=>{if(active?.type==='duel')originalApi('duel-focus',{matchId:active.matchId,eventType:document.hidden?'hidden':'visible'}).catch(()=>{})};
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
    const available=Number(form.elements.bankId?.selectedOptions?.[0]?.dataset.count||10),leveling=document.createElement('label');leveling.innerHTML=`Perguntas do nivelamento<input name="levelingQuestionCount" type="number" min="1" max="${Math.min(50,available)}" required value="${Math.min(10,available)}">`;columns.append(leveling);
    const label=document.createElement('label');label.innerHTML='Tempo por duelo (segundos)<input name="durationSeconds" type="number" min="30" max="600" required value="90">';columns.append(label);
  }

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let liveTimer=null,liveBusy=false;
  function roundLabel(round,total){if(round===total)return'Grande final';if(round===total-1)return'Semifinais';if(round===total-2)return'Quartas de final';if(round===total-3)return'Oitavas de final';return`Fase ${round}`}
  function renderLiveTree(target,data,isTeacher){
    if(data.championship.status==='finished')target.dataset.liveDone='true';
    if(data.championship.status==='leveling'){
      const ranked=data.participants.filter(item=>!item.disqualified).slice().sort((a,b)=>(b.leveling_score??-1)-(a.leveling_score??-1)||(a.leveling_time??Infinity)-(b.leveling_time??Infinity)),completed=ranked.filter(item=>item.leveling_status==='completed').length;
      target.innerHTML=`<div class="live-stage"><strong>Nivelamento em tempo real</strong><span>${completed} de ${ranked.length} concluíram</span></div><div class="leveling-ranking">${ranked.map((item,index)=>`<div><b>${index+1}º</b><span>${esc(item.name)}</span><small>${item.leveling_status==='completed'?`${item.leveling_score} acertos · ${(item.leveling_time/1000).toFixed(1)}s`:item.leveling_status==='started'?'Respondendo agora':'Aguardando início'}</small></div>`).join('')}</div>${isTeacher?`<button type="button" class="primary full" data-live-knockout="${esc(data.championship.id)}" ${completed===ranked.length&&ranked.length>=2?'':'disabled'}>Formar mata-mata por desempenho</button>`:''}`;return;
    }
    const eligible=data.participants.filter(item=>!item.disqualified),participantCount=eligible.length,bracketSize=participantCount>1?2**Math.ceil(Math.log2(participantCount)):0,totalRounds=bracketSize?Math.log2(bracketSize):0;
    const main=data.matches.filter(match=>match.kind==='main'),third=data.matches.find(match=>match.kind==='third'),rounds=Array.from({length:totalRounds},(_,index)=>index+1);
    const player=(match,side)=>{const id=match[`player${side}_id`],name=match[`player${side}_name`]||(!id?'A definir':'Aluno'),score=match[`player${side}_score`],winner=match.winner_id===id&&id;return `<i class="${winner?'winner':''}"><span>${esc(name)}</span>${score!==null&&score!==undefined?`<b>${score}</b>`:''}</i>`};
    const placeholder=(round,slot,kind='main')=>({round,slot,kind,status:'waiting',player1_id:null,player2_id:null,player1_name:'A definir',player2_name:'A definir',player1_score:null,player2_score:null,winner_id:null});
    const ordered=rounds.slice().sort((a,b)=>b-a),thirdMatch=third||placeholder(totalRounds,1,'third'),expectedMain=Math.max(0,bracketSize-1),expectedTotal=expectedMain+(totalRounds>=2?1:0),finished=data.matches.filter(match=>match.status==='finished').length;
    const participantName=id=>data.participants.find(item=>item.student_id===id)?.name||'A definir',podium=[{place:'2º',name:participantName(data.championship.runner_up_id)},{place:'1º',name:participantName(data.championship.champion_id)},{place:'3º',name:participantName(data.championship.third_id)}];
    target.innerHTML=`<div class="live-stage"><strong>${data.championship.status==='finished'?'Campeonato encerrado':'Árvore atualizada em tempo real'}</strong><span>${finished} de ${expectedTotal} confrontos concluídos</span></div>${rounds.length?`<div class="bracket-board"><div class="bracket-guide">DA BASE AO TOPO <b>↑</b> acompanhe o caminho até a grande final</div>${totalRounds>=2?`<aside class="third-place-live"><small>🥉 Disputa de terceiro lugar</small><span>Entre os perdedores das semifinais</span><div class="tree-match ${thirdMatch.status}">${player(thirdMatch,1)}${player(thirdMatch,2)}</div></aside>`:''}<div class="bracket-rounds">${ordered.map(round=>{const count=bracketSize/2**round,actual=new Map(main.filter(match=>match.round===round).map(match=>[match.slot,match])),matches=Array.from({length:count},(_,index)=>actual.get(index+1)||placeholder(round,index+1));return `<section class="bracket-round round-${round}"><h4>${roundLabel(round,totalRounds)}</h4><div class="bracket-row" style="--match-count:${matches.length}">${matches.map((match,index)=>`<article><small>Confronto ${index+1}</small><div class="tree-match ${match.status}">${player(match,1)}${player(match,2)}</div></article>`).join('')}</div></section>`}).join('')}</div></div><section class="live-podium"><div><small>PÓDIO DO CAMPEONATO</small><strong>${data.championship.status==='finished'?'Classificação final':'Será definido ao fim das duas decisões'}</strong></div><div class="live-podium-steps">${podium.map(item=>`<article class="place-${item.place[0]}"><span>${item.place}</span><b>${esc(item.name)}</b></article>`).join('')}</div></section>`:'<div class="empty compact">A chave aparecerá quando o campeonato for iniciado.</div>'}`;
  }
  async function refreshLiveTrees(){
    if(liveBusy||document.hidden||typeof state==='undefined')return;
    const teacherTargets=[...document.querySelectorAll('[data-live-bracket]:not([data-live-done])')],studentTargets=[...document.querySelectorAll('[data-student-bracket]:not([data-live-done])')],targets=[...teacherTargets,...studentTargets];if(!targets.length){if(liveTimer){clearInterval(liveTimer);liveTimer=null}return}
    liveBusy=true;
    try{await Promise.all(targets.map(async target=>{const isTeacher=target.hasAttribute('data-live-bracket'),id=isTeacher?target.dataset.liveBracket:target.dataset.studentBracket;try{renderLiveTree(target,await originalApi(isTeacher?'championship-live':'championship-watch',{id}),isTeacher)}catch(error){target.innerHTML=`<span class="muted small">${esc(error.message)}</span>`}}))}finally{liveBusy=false}
  }
  function scheduleLiveTrees(){
    const hasLive=document.querySelector('[data-live-bracket]:not([data-live-done]),[data-student-bracket]:not([data-live-done])');
    if(hasLive&&!liveTimer){refreshLiveTrees();liveTimer=setInterval(refreshLiveTrees,3000)}
    if(!hasLive&&liveTimer){clearInterval(liveTimer);liveTimer=null}
  }
  document.addEventListener('click',async event=>{const button=event.target.closest('[data-live-knockout]');if(!button)return;if(!confirm('Formar as chaves usando o ranking do nivelamento?'))return;button.disabled=true;try{await originalApi('start-knockout',{id:button.dataset.liveKnockout});await refreshLiveTrees();if(typeof toast==='function')toast('Mata-mata formado pelo desempenho do nivelamento.')}catch(error){if(typeof toast==='function')toast(error.message);button.disabled=false}});

  new MutationObserver(()=>{attachMonitor();focusIndicators();championshipDurationField();scheduleLiveTrees()}).observe(document.body,{childList:true,subtree:true});
  scheduleLiveTrees();
})();
