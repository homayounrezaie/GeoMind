function initTheme() {
  const root = document.documentElement;
  const buttons = [...document.querySelectorAll('[data-theme-toggle], #theme-toggle')];
  const saved = localStorage.getItem('gm-theme');
  let theme = saved || 'dark';

  function apply(nextTheme) {
    theme = nextTheme === 'light' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    buttons.forEach(button => {
      button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      button.setAttribute('title', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }

  apply(theme);
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      apply(theme === 'dark' ? 'light' : 'dark');
      localStorage.setItem('gm-theme', theme);
    });
  });
}

initTheme();
