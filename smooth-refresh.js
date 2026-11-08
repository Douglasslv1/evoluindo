(()=>{
  if(typeof teacherHome!=='function')return;
  const fullTeacherHome=teacherHome;
  let renderedClass=null,refreshing=false;

  teacherHome=async function(){
    const canRefreshInPlace=!refreshing&&typeof state!=='undefined'&&state?.role==='teacher'&&view==='teacher'&&selectedClass&&selectedClass===renderedClass&&report&&document.querySelector('.class-toolbar');
    if(!canRefreshInPlace){
      await fullTeacherHome();
      renderedClass=selectedClass||null;
      return;
    }
    refreshing=true;
    const scrollTop=window.scrollY,active=document.activeElement,focusId=active?.id||null;
    document.documentElement.classList.add('background-refresh');
    try{
      teacher=await api('teacher-state');
      report=await api('class-report',{classId:selectedClass});
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
