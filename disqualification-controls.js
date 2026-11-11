(() => {
  if (typeof api !== 'function') return;
  const originalApi = api;
  let report = null,
    disqualified = [];
  api = async function (action, payload = {}) {
    const result = await originalApi(action, payload);
    if (action === 'championship-report') {
      report = result;
      const status = await originalApi('championship-disqualifications', { id: result.championship.id });
      disqualified = status.participants || [];
      queueMicrotask(enhanceReport);
    }
    return result;
  };

  function enhanceReport() {
    if (!report || report.championship.status === 'finished') return;
    const table = document.querySelector('#modal-content .table-scroll table');
    if (!table || table.dataset.disqualificationControls) return;
    table.dataset.disqualificationControls = 'true';
    const heading = document.createElement('th');
    heading.textContent = 'Controle';
    table.querySelector('thead tr')?.append(heading);
    table.querySelectorAll('tbody tr').forEach((row, index) => {
      const participant = report.participants[index],
        record = disqualified.find(item => item.student_id === participant?.student_id),
        cell = document.createElement('td');
      if (record) {
        cell.innerHTML = `<span class="disqualified-label" title="${escapeAttribute(record.reason)}">Desclassificado</span>`;
      } else {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'text-btn danger';
        button.textContent = 'Desclassificar';
        button.onclick = () => disqualify(participant, cell);
        cell.append(button);
      }
      row.append(cell);
    });
  }

  function escapeAttribute(value) {
    return String(value || '').replace(
      /[&<>"']/g,
      char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
    );
  }

  async function disqualify(participant, cell) {
    const reason = prompt(`Motivo da desclassificação de ${participant.name}:`);
    if (reason === null) return;
    if (reason.trim().length < 5) return toast('Informe um motivo com pelo menos 5 caracteres.');
    const button = cell.querySelector('button');
    button.disabled = true;
    try {
      await originalApi('disqualify-participant', {
        id: report.championship.id,
        studentId: participant.student_id,
        reason: reason.trim()
      });
      cell.innerHTML = '<span class="disqualified-label">Desclassificado</span>';
      toast('Participante desclassificado. A chave foi atualizada.');
      document.getElementById('modal').close();
      await teacherHome();
    } catch (error) {
      toast(error.message);
      button.disabled = false;
    }
  }

  new MutationObserver(enhanceReport).observe(document.getElementById('modal-content'), {
    childList: true,
    subtree: true
  });
})();
