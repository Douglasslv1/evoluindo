(() => {
  function applyBrand() {
    document.querySelectorAll('.brand').forEach(brand => {
      if (brand.dataset.evoluindo) return;
      brand.dataset.evoluindo = 'true';
      brand.innerHTML =
        '<img class="logo-icon owl-logo" src="owl.svg" alt="">evoluindo<span class="brand-dot">●</span>';
    });
    document.querySelectorAll('footer span:first-child').forEach(node => {
      const label = 'EVOLUINDO / APRENDIZAGEM E CAMPEONATOS';
      if (node.textContent !== label) node.textContent = label;
    });
    const courseLabel = document.querySelector('.course-label');
    if (courseLabel && !courseLabel.dataset.evoluindo) {
      courseLabel.dataset.evoluindo = 'true';
      courseLabel.innerHTML = 'APRENDER • PRATICAR • CONQUISTAR<strong>Plataforma Evoluindo</strong>';
    }
  }
  new MutationObserver(applyBrand).observe(document.getElementById('app'), {
    childList: true,
    subtree: true
  });
  applyBrand();
})();
