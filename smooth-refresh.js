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
