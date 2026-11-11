(() => {
  const esc = value =>
    String(value ?? '').replace(
      /[&<>"']/g,
      char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
    );
  let currentReport = null;

  function enhanceCards() {
    if (typeof state === 'undefined' || state?.role !== 'teacher' || typeof teacher === 'undefined') return;
    const items = (teacher.championships || []).filter(item => item.class_id === selectedClass),
      cards = document.querySelectorAll('.championship-manager .championship-grid>article');
    cards.forEach((card, index) => {
      const item = items[index];
      if (!item || card.querySelector('[data-championship-report]')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ghost report-button';
      button.dataset.championshipReport = item.id;
      button.textContent = 'Ver relatório';
      button.onclick = () => openReport(item.id);
      card.append(button);
    });
  }

  async function openReport(id) {
    try {
      currentReport = await api('championship-report', { id });
      const report = currentReport,
        finished = report.championship.status === 'finished';
      modal(
        `<div class="eyebrow">HISTÓRICO DO CAMPEONATO</div><div class="report-title"><div><h2>${esc(report.championship.title)}</h2><p>${finished ? 'Campeonato finalizado.' : 'Relatório parcial atualizado.'}</p></div><button type="button" class="ghost" id="export-championship-report">Baixar CSV</button></div>${finished ? `<div class="report-podium"><span><b>1º</b>${esc(report.podium.champion || '—')}</span><span><b>2º</b>${esc(report.podium.runner_up || '—')}</span><span><b>3º</b>${esc(report.podium.third || '—')}</span></div>` : ''}<div class="report-metrics"><article><strong>${report.participants.length}</strong><span>Participantes</span></article><article><strong>${report.matches.filter(match => match.status === 'finished' && match.player2).length}</strong><span>Duelos concluídos</span></article><article><strong>${report.participants.reduce((sum, item) => sum + item.xp, 0)}</strong><span>XP concedido</span></article><article><strong>${report.participants.reduce((sum, item) => sum + item.focus_losses, 0)}</strong><span>Saídas da aba</span></article></div><h3>Desempenho dos participantes</h3><div class="table-scroll"><table><thead><tr><th>Aluno</th><th>Duelos</th><th>Vitórias</th><th>XP</th><th>Saídas da aba</th></tr></thead><tbody>${report.participants.map(item => `<tr><td>${esc(item.name)}</td><td>${item.duels}</td><td>${item.wins}</td><td>${item.xp}</td><td>${item.focus_losses}</td></tr>`).join('')}</tbody></table></div><h3>Perguntas com mais erros</h3><div class="question-report">${report.questions.length ? report.questions.map((item, index) => `<article><span>${index + 1}</span><div><b>${esc(item.statement)}</b><small>${item.errors} erro${item.errors === 1 ? '' : 's'} em ${item.answers} resposta${item.answers === 1 ? '' : 's'} · gabarito: ${esc(item.correct_answer)}</small></div><strong>${item.error_rate}%</strong></article>`).join('') : '<div class="empty compact">As estatísticas aparecerão depois dos primeiros duelos.</div>'}</div>`
      );
      document.getElementById('export-championship-report').onclick = exportReport;
    } catch (error) {
      toast(error.message);
    }
  }

  function exportReport() {
    if (!currentReport) return;
    const quote = value =>
        '"' +
        String(value ?? '')
          .replace(/^[=+@-]/, "'$&")
          .replace(/"/g, '""') +
        '"',
      rows = [
        ['Campeonato', currentReport.championship.title],
        ['Status', currentReport.championship.status],
        [],
        ['Aluno', 'Duelos', 'Vitórias', 'XP', 'Saídas da aba'],
        ...currentReport.participants.map(item => [
          item.name,
          item.duels,
          item.wins,
          item.xp,
          item.focus_losses
        ]),
        [],
        ['Pergunta', 'Respostas', 'Erros', 'Taxa de erro', 'Gabarito'],
        ...currentReport.questions.map(item => [
          item.statement,
          item.answers,
          item.errors,
          item.error_rate + '%',
          item.correct_answer
        ])
      ];
    downloadText(
      'relatorio-campeonato.csv',
      '\uFEFF' + rows.map(row => row.map(quote).join(';')).join('\r\n')
    );
  }

  new MutationObserver(enhanceCards).observe(document.getElementById('app'), {
    childList: true,
    subtree: true
  });
  enhanceCards();
})();
