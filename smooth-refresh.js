(()=>{
  if(typeof teacherHome!=='function')return;
  const fullTeacherHome=teacherHome;
  let renderedClass=null,refreshing=false,explicitNoClass=false;

  document.addEventListener('change',event=>{
    if(event.target?.id==='class-select')explicitNoClass=event.target.value==='';
  },true);

  function updateNoClassMessage(){
    if(selectedClass||!teacher?.classes?.length)return;
    const empty=document.querySelector('#screen .empty');if(!empty)return;
    const title=empty.querySelector('h2'),text=empty.querySelector('p');
    if(title)title.textContent='Nenhuma turma selecionada.';
    if(text)text.textContent='Selecione uma turma para acompanhar alunos, aulas, simulados e campeonatos.';
  }

  let deliverySignature='';
  window.refreshTeacherSilently=async function(){
    if(refreshing||!selectedClass||view!=='teacher'||!document.querySelector('.class-toolbar'))return;
    refreshing=true;
    try{
      const [nextTeacher,nextReport]=await Promise.all([api('teacher-state'),api('class-report',{classId:selectedClass})]),rows=[...document.querySelectorAll('.roster tbody tr')];
      teacher=nextTeacher;report=nextReport;
      if(rows.length!==report.students.length){teacherPage();renderedClass=selectedClass;return}
      const submissions=report.submissions||[],metrics=document.querySelectorAll('.teacher-metrics article strong'),pending=submissions.filter(item=>item.status==='pending').length,approved=submissions.filter(item=>item.status==='approved').length;
      if(metrics[0])metrics[0].textContent=report.students.length;
      if(metrics[1])metrics[1].innerHTML=`${report.classroom.released.length}<small> / 10</small>`;
      if(metrics[2])metrics[2].textContent=pending;
      if(metrics[3])metrics[3].textContent=approved;
      rows.forEach((row,index)=>{const student=report.students[index],records=submissions.filter(item=>item.student_id===student.id),activity=records.filter(item=>item.status==='approved').reduce((total,item)=>total+Number(item.xp||0),0),extra=(report.xpEvents||[]).filter(item=>item.student_id===student.id).reduce((total,item)=>total+Number(item.xp||0),0);if(row.children[1])row.children[1].innerHTML=`<strong>${Number(activity+extra).toLocaleString('pt-BR')}</strong>${extra?`<small>${extra.toLocaleString('pt-BR')} XP em simulados e duelos</small>`:''}`;if(row.children[2])row.children[2].textContent=`${records.filter(item=>item.status==='approved').length} / 40`;if(row.children[3])row.children[3].textContent=student.official_grade===null?'Não registrada':student.official_grade+' / 10'});
      const signature=submissions.map(item=>`${item.id}:${item.status}:${item.updated_at}`).join('|');
      if(signature!==deliverySignature&&typeof renderDeliveries==='function'){deliverySignature=signature;renderDeliveries(document.getElementById('delivery-filter')?.value||'pending')}
    }catch(error){if(typeof toast==='function')toast(error.message)}finally{refreshing=false}
  };

  teacherHome=async function(){
    if(explicitNoClass&&selectedClass===''){
      view='teacher';activeLesson=null;activeTask=null;refreshing=true;
      try{teacher=await api('teacher-state');report=null;teacherPage();renderedClass=null;updateNoClassMessage()}catch(error){if(typeof toast==='function')toast(error.message);else throw error}finally{refreshing=false}
      return;
    }
    if(selectedClass)explicitNoClass=false;
    const canRefreshInPlace=!refreshing&&typeof state!=='undefined'&&state?.role==='teacher'&&view==='teacher'&&selectedClass&&selectedClass===renderedClass&&report&&document.querySelector('.class-toolbar');
    if(!canRefreshInPlace){
      await fullTeacherHome();
      renderedClass=selectedClass||null;
      updateNoClassMessage();
      return;
    }
    refreshing=true;
    const scrollTop=window.scrollY,active=document.activeElement,focusId=active?.id||null;
    document.documentElement.classList.add('background-refresh');
    try{
      [teacher,report]=await Promise.all([api('teacher-state'),api('class-report',{classId:selectedClass})]);
      teacherPage();
      renderedClass=selectedClass;
      requestAnimationFrame(()=>{
        window.scrollTo({top:scrollTop,left:0,behavior:'auto'});
        if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});
      });
    }catch(error){
      if(typeof toast==='function')toast(error.message);
      else throw error;
    }finally{
      refreshing=false;
      document.documentElement.classList.remove('background-refresh');
    }
  };
})();
