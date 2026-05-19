import { showOverview } from './panels.js';

export function initSearch() {
  const searchEl = document.getElementById('search');
  const srcount  = document.getElementById('srcount');

  function doSearch(q) {
    const query = q.toLowerCase().trim();
    if (!query) {
      document.body.classList.remove('searching');
      srcount.textContent = '';
      document.querySelectorAll('.tag').forEach(t => t.classList.remove('sm'));
      document.querySelectorAll('.sg').forEach(g => g.classList.remove('no-match'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('no-match'));
      /* Re-import current to get latest value */
      import('./panels.js').then(m => { if (m.current) showOverview(m.current); });
      return;
    }
    document.body.classList.add('searching');
    document.querySelectorAll('.panel-ov').forEach(o => o.style.display = 'none');
    document.querySelectorAll('.panel-back').forEach(b => b.classList.remove('vis'));
    document.querySelectorAll('.sg').forEach(sg => sg.style.removeProperty('display'));
    let total = 0;
    document.querySelectorAll('.sg').forEach(g => {
      let matched = 0;
      g.querySelectorAll('.tag').forEach(t => {
        const m = t.textContent.toLowerCase().includes(query);
        t.classList.toggle('sm', m);
        if (m) matched++;
      });
      g.classList.toggle('no-match', matched === 0);
      total += matched;
    });
    document.querySelectorAll('.panel').forEach(p => {
      const vis = [...p.querySelectorAll('.sg')].some(g => !g.classList.contains('no-match'));
      p.classList.toggle('no-match', !vis);
    });
    srcount.textContent = total ? `${total} found` : 'no match';
  }

  searchEl.addEventListener('input',  e => doSearch(e.target.value));
  searchEl.addEventListener('search', e => doSearch(e.target.value));

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchEl.focus(); searchEl.select(); }
    if (e.key === 'Escape') {
      if (document.activeElement === searchEl) {
        searchEl.value = ''; doSearch(''); searchEl.blur();
      } else {
        import('./panels.js').then(m => m.closeLayer());
      }
    }
  });
}
