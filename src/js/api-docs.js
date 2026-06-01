const docsSearch = document.querySelector('[data-docs-search]');
const docLinks = [...document.querySelectorAll('[data-doc-link]')];
const sections = [...document.querySelectorAll('[data-doc-section]')];

document.addEventListener('keydown', event => {
  const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
  if (!isCommandK) return;
  event.preventDefault();
  docsSearch?.focus();
});

docsSearch?.addEventListener('input', () => {
  const query = docsSearch.value.trim().toLowerCase();
  docLinks.forEach(link => {
    const label = link.textContent.toLowerCase();
    link.hidden = Boolean(query && !label.includes(query));
  });
  if (!query) return;
  const target = sections.find(section => section.textContent.toLowerCase().includes(query));
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

const segmentButtons = [...document.querySelectorAll('[data-doc-segment]')];
const panels = [...document.querySelectorAll('[data-doc-panel]')];

segmentButtons.forEach(button => {
  button.addEventListener('click', () => {
    const value = button.getAttribute('data-doc-segment');
    segmentButtons.forEach(other => {
      const isActive = other === button;
      other.classList.toggle('is-active', isActive);
      other.setAttribute('aria-selected', String(isActive));
    });
    panels.forEach(panel => {
      panel.hidden = panel.getAttribute('data-doc-panel') !== value;
    });
  });
});

document.querySelectorAll('[data-copy-code]').forEach(button => {
  button.addEventListener('click', async () => {
    const code = button.closest('.docs-code')?.querySelector('code')?.textContent || '';
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = 'Copied';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 1100);
    } catch {
      button.textContent = 'Select';
    }
  });
});

const observer = new IntersectionObserver(entries => {
  const visible = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const id = visible.target.id;
  docLinks.forEach(link => {
    link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
  });
}, { rootMargin: '-20% 0px -68% 0px', threshold: [0.1, 0.4, 0.8] });

sections.forEach(section => observer.observe(section));
