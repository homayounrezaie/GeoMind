// Shared behaviour for the GeoMind API docs pages (welcome, get-started, endpoint).
const docsSearch = document.querySelector('[data-docs-search]');
const navLinks = [...document.querySelectorAll('.docs-sidebar a')];

// Cmd/Ctrl-K focuses the search box.
document.addEventListener('keydown', event => {
  const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
  if (!isCommandK) return;
  event.preventDefault();
  docsSearch?.focus();
});

// Filter the sidebar nav by label.
docsSearch?.addEventListener('input', () => {
  const query = docsSearch.value.trim().toLowerCase();
  navLinks.forEach(link => {
    link.hidden = Boolean(query && !link.textContent.toLowerCase().includes(query));
  });
});

// Keep card counts in sync with the live index (hard-coded numbers are fallbacks).
const countEls = [...document.querySelectorAll('[data-count]')];
if (countEls.length) {
  fetch('../api/index.json')
    .then(r => r.json())
    .then(data => {
      const counts = Object.fromEntries((data.endpoints || []).map(e => [e.name, e.count]));
      countEls.forEach(el => {
        const count = counts[el.getAttribute('data-count')];
        if (count == null) return;
        el.textContent = count.toLocaleString() + (el.getAttribute('data-count-suffix') || '');
      });
    })
    .catch(() => {});
}

// Code-tab switching: one [data-tabs] group has [data-tab] buttons and [data-panel] panels.
document.querySelectorAll('[data-tabs]').forEach(group => {
  const tabs = [...group.querySelectorAll('[data-tab]')];
  const panels = [...group.querySelectorAll('[data-panel]')];
  group.addEventListener('click', event => {
    const tab = event.target.closest('[data-tab]');
    if (!tab) return;
    const value = tab.getAttribute('data-tab');
    tabs.forEach(other => other.setAttribute('aria-selected', String(other === tab)));
    panels.forEach(panel => { panel.hidden = panel.getAttribute('data-panel') !== value; });
  });
});

// Copy buttons copy the nearest visible code block.
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-copy-code]');
  if (!button) return;
  const scope = button.closest('.docs-tabs, .docs-code');
  const visible = scope?.querySelector('.docs-tabpanel:not([hidden]) code') || scope?.querySelector('code');
  try {
    await navigator.clipboard.writeText(visible?.textContent || '');
    const original = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = original; }, 1100);
  } catch {
    button.textContent = 'Select';
  }
});

// Scroll-spy drives the right-hand "On this page" table of contents.
const tocLinks = [...document.querySelectorAll('.docs-toc a')];
const sections = [...document.querySelectorAll('[data-doc-section]')];
if (tocLinks.length && sections.length) {
  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const id = visible.target.id;
    tocLinks.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
    });
  }, { rootMargin: '-20% 0px -68% 0px', threshold: [0.1, 0.4, 0.8] });
  sections.forEach(section => observer.observe(section));
}
