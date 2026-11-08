(() => {
  const switchers = [...document.querySelectorAll('.language-switcher')];
  document.addEventListener('click', event => {
    for (const switcher of switchers) {
      if (switcher.open && !switcher.contains(event.target)) switcher.open = false;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    for (const switcher of switchers) {
      if (!switcher.open) continue;
      switcher.open = false;
      switcher.querySelector('summary').focus();
      event.preventDefault();
    }
  });
})();
