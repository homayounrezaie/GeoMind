const CONFIG = {
  papers: {
    file: 'papers.csv',
    label: 'Research Index',
    title: 'Papers',
    intro: 'Browse geospatial AI papers with citation signals, venues, methods, datasets, and links to code or source pages.',
    searchPlaceholder: 'Search papers, authors, venues, methods...',
    empty: 'No papers match this query.',
    titleField: 'title',
    subtitle: row => joinClean([row.authors, row.venue || row.conference]),
    description: row => row.abstract || row.tags || row.matched_terms || row.topic_query,
    url: row => row.link || row.url || doiUrl(row.doi),
    codeUrl: row => row.code_url,
    metric: row => numberLabel(row.citations || row.citation_count, 'citation'),
    sortValue: row => paperSortValue(row),
    tags: row => splitValues(row.task || row.method_family || row.modality || row.matched_terms || row.tags),
    meta: row => joinClean([row.year, row.venue || row.conference, row.discovered_via]),
    filters: [
      { key: 'all', label: 'All' },
      { key: 'recent', label: 'Recent', test: row => Number(row.year) >= 2025 },
      { key: 'code', label: 'Code', test: row => paperCodeUrl(row) || row.github_url || row.huggingface_url },
      { key: 'cited', label: 'Cited', test: row => Number(row.citations || row.citation_count) > 0 },
      { key: 'foundation', label: 'Foundation models', test: row => includesAny(row, ['foundation']) },
    ],
  },
  models: {
    file: 'foundation-models.csv',
    label: 'Model Index',
    title: 'Foundation Models',
    intro: 'Browse model cards, weights, remote sensing foundation models, vision-language systems, agents, and related model resources.',
    searchPlaceholder: 'Search models, developers, sections, weights...',
    empty: 'No models match this query.',
    titleField: 'title',
    subtitle: row => joinClean([row.authors, row.venue, row.abbreviation]),
    description: row => row.notes || row.awesome_section || row.source_query,
    url: row => row.code_weights_url || row.paper_url || row.url || doiUrl(row.doi),
    codeUrl: row => row.code_weights_url,
    metric: row => row.publication_type || row.status,
    sortValue: row => Number(row.year) || 0,
    tags: row => splitValues(row.category || row.awesome_section || row.notes),
    meta: row => joinClean([row.year, row.category, row.source]),
    filters: [
      { key: 'all', label: 'All' },
      { key: 'weights', label: 'Weights', test: row => row.code_weights_url },
      { key: 'vlm', label: 'Vision-language', test: row => includesAny(row, ['vision_language', 'vision-language', 'vlm']) },
      { key: 'agents', label: 'Agents', test: row => includesAny(row, ['agent']) },
      { key: 'recent', label: 'Recent', test: row => Number(row.year) >= 2025 },
    ],
  },
  datasets: {
    file: 'datasets.csv',
    label: 'Dataset Index',
    title: 'Datasets',
    intro: 'Browse geospatial datasets with task categories, source links, download signals, tags, and descriptions.',
    searchPlaceholder: 'Search datasets, tasks, tags, publishers...',
    empty: 'No datasets match this query.',
    titleField: 'name',
    subtitle: row => joinClean([row.dataset_id, row.task_categories]),
    description: row => row.description || row.tags || row.matched_terms,
    url: row => row.url,
    codeUrl: () => '',
    metric: row => numberLabel(row.downloads, 'download') || numberLabel(row.likes, 'like'),
    sortValue: row => Number(row.downloads) || Number(row.trending_score) || 0,
    tags: row => splitValues(row.task_categories || row.size_categories || row.tags || row.matched_terms),
    meta: row => joinClean([row.size_categories, row.languages, row.last_modified ? `updated ${formatDate(row.last_modified)}` : '']),
    filters: [
      { key: 'all', label: 'All' },
      { key: 'hugging-face', label: 'Hugging Face', test: row => includesAny(row, ['huggingface.co', 'hugging-face']) },
      { key: 'segmentation', label: 'Segmentation', test: row => includesAny(row, ['segmentation']) },
      { key: 'classification', label: 'Classification', test: row => includesAny(row, ['classification']) },
      { key: 'large', label: 'Large', test: row => includesAny(row, ['1M<n', '10M<n', '100M<n']) },
    ],
  },
};

const PAGE_SIZE = 20;
const state = { rows: [], filtered: [], page: 1, query: '', filter: 'all', domain: 'all', sort: 'trending' };
const githubCache = new Map();

const page = document.body.dataset.catalog;
const config = CONFIG[page];

if (config) init(config);

async function init(cfg) {
  const els = getElements();
  setText(els.label, cfg.label);
  setText(els.title, cfg.title);
  setText(els.intro, cfg.intro);
  els.search.placeholder = cfg.searchPlaceholder;
  renderFilters(els.filters, cfg);

  try {
    const csv = await fetchCsv(cfg.file);
    state.rows = parseCsv(csv).filter(row => row[cfg.titleField]);
    state.filtered = [...state.rows];
    if (page === 'papers') renderPaperDomains(els.domains, state.rows);
    applyFilters(cfg, els);
  } catch (error) {
    els.list.innerHTML = `<div class="catalog-empty">Could not load ${escapeHtml(cfg.file)}.</div>`;
    console.error(error);
  }

  els.search.addEventListener('input', event => {
    state.query = event.target.value.trim().toLowerCase();
    state.page = 1;
    applyFilters(cfg, els);
  });

  els.domains?.addEventListener('click', event => {
    const button = event.target.closest('button[data-domain]');
    if (!button) return;
    state.domain = button.dataset.domain;
    state.page = 1;
    els.domains.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('is-active', btn === button);
    });
    applyFilters(cfg, els);
  });

  els.sort?.addEventListener('click', event => {
    const button = event.target.closest('button[data-sort]');
    if (!button) return;
    state.sort = button.dataset.sort;
    state.page = 1;
    els.sort.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('is-active', btn === button);
    });
    applyFilters(cfg, els);
  });

  els.filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter;
    state.page = 1;
    els.filters.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('is-active', btn === button);
    });
    applyFilters(cfg, els);
  });

  els.pager.addEventListener('click', event => {
    const button = event.target.closest('button[data-page]');
    if (!button || button.disabled) return;
    state.page = Number(button.dataset.page);
    renderList(cfg, els);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function getElements() {
  return {
    label: document.querySelector('[data-catalog-label]'),
    title: document.querySelector('[data-catalog-title]'),
    intro: document.querySelector('[data-catalog-intro]'),
    search: document.querySelector('[data-catalog-search]'),
    filters: document.querySelector('[data-catalog-filters]'),
    list: document.querySelector('[data-catalog-list]'),
    status: document.querySelector('[data-catalog-status]'),
    pager: document.querySelector('[data-catalog-pager]'),
    domains: document.querySelector('[data-paper-domains]'),
    sort: document.querySelector('[data-paper-sort]'),
  };
}

async function fetchCsv(file) {
  const response = await fetch(`../data/${file}`);
  if (!response.ok) throw new Error(`Failed to load ${file}`);
  return response.text();
}

function applyFilters(cfg, els) {
  const filter = cfg.filters.find(item => item.key === state.filter);
  const query = state.query;
  state.filtered = state.rows
    .filter(row => !filter?.test || filter.test(row))
    .filter(row => state.domain === 'all' || paperDomains(row).includes(state.domain))
    .filter(row => !query || Object.values(row).some(value => String(value).toLowerCase().includes(query)))
    .sort((a, b) => cfg.sortValue(b) - cfg.sortValue(a));
  renderList(cfg, els);
}

function renderFilters(container, cfg) {
  container.innerHTML = cfg.filters.map((filter, index) => (
    `<button type="button" class="catalog-chip ${index === 0 ? 'is-active' : ''}" data-filter="${filter.key}">${escapeHtml(filter.label)}</button>`
  )).join('');
}

function renderList(cfg, els) {
  const total = state.filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  state.page = Math.min(Math.max(1, state.page), pageCount);
  const start = (state.page - 1) * PAGE_SIZE;
  const visible = state.filtered.slice(start, start + PAGE_SIZE);
  const end = Math.min(start + visible.length, total);
  setText(els.status, page === 'papers'
    ? `${total.toLocaleString()} papers`
    : total ? `${(start + 1).toLocaleString()}-${end.toLocaleString()} of ${total.toLocaleString()} results` : '0 results');

  if (!visible.length) {
    els.list.innerHTML = `<div class="catalog-empty">${escapeHtml(cfg.empty)}</div>`;
    els.pager.innerHTML = '';
    return;
  }

  els.list.innerHTML = visible.map(row => page === 'papers' ? renderPaperItem(cfg, row) : renderItem(cfg, row)).join('');
  if (page === 'papers') hydrateGithubStats(els.list);
  renderPager(els.pager, pageCount);
}

function renderPaperDomains(container, rows) {
  if (!container) return;
  const counts = new Map();
  for (const row of rows) {
    for (const domain of paperDomains(row)) {
      counts.set(domain, (counts.get(domain) || 0) + 1);
    }
  }
  const domains = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  container.innerHTML = [
    `<button type="button" class="is-active" data-domain="all"><span>All domains</span><strong>${rows.length.toLocaleString()}</strong></button>`,
    ...domains.map(([domain, count]) => (
      `<button type="button" data-domain="${escapeAttr(domain)}"><span>${escapeHtml(titleCase(domain))}</span><strong>${count.toLocaleString()}</strong></button>`
    )),
  ].join('');
}

function renderPaperItem(cfg, row) {
  const title = row[cfg.titleField] || 'Untitled';
  const url = cfg.url(row);
  const authors = truncateAuthors(row.authors);
  const venue = row.venue || row.conference;
  const description = truncate(cleanText(cfg.description(row)), 320);
  const tags = paperDomains(row).slice(0, 3);
  const citationCount = Number(row.citations || row.citation_count) || 0;
  const year = row.year || 'unknown';
  const pdfUrl = paperPdfUrl(row);
  const arxivUrl = paperArxivUrl(row);
  const githubUrl = paperGithubUrl(row);
  const huggingFaceUrl = paperHuggingFaceUrl(row);
  const websiteUrl = paperWebsiteUrl(row, url);
  const code = paperCodeUrl(row) || githubUrl || huggingFaceUrl || cfg.codeUrl(row);
  const githubRepo = githubRepoName(githubUrl || code);
  const citationPace = paperCitationPace(row, citationCount);
  const source = row.venue || row.discovered_via || 'Paper';
  const actions = paperActions({ pdfUrl, arxivUrl, githubUrl, huggingFaceUrl, websiteUrl, code });

  return `
    <article class="research-item">
      <div class="research-paper-mark" aria-hidden="true">
        <span class="research-paper-year">${escapeHtml(String(year).slice(0, 4))}</span>
        <b>${escapeHtml(truncate(source, 18))}</b>
        <strong>${escapeHtml(truncate(title, 64))}</strong>
        <i></i><i></i><i></i><i></i><i></i>
      </div>
      <div class="research-item-body">
        <h2>${url ? `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${escapeHtml(title)}</a>` : escapeHtml(title)}</h2>
        <p class="research-byline">${escapeHtml(joinClean([authors, venue, year]))}</p>
        ${description ? `<p class="research-abstract">${escapeHtml(description)}</p>` : ''}
        ${tags.length ? `<div class="research-tags">${tags.map(tag => `<span>${escapeHtml(titleCase(tag))}</span>`).join('')}</div>` : ''}
        ${actions ? `<div class="research-links">${actions}</div>` : ''}
      </div>
      <div class="research-stats">
        <div class="research-stat ${githubRepo ? '' : 'is-empty'}" ${githubRepo ? `data-github-repo="${escapeAttr(githubRepo)}"` : ''}>
          <div class="research-stat-value">
            ${iconSvg('github')}
            <strong data-github-stars>${githubRepo ? '...' : '-'}</strong>
          </div>
          <span>stars</span>
          ${githubRepo ? `<a href="${escapeAttr(`https://github.com/${githubRepo}`)}" target="_blank" rel="noopener">${escapeHtml(githubRepo)}</a>` : ''}
        </div>
        <div class="research-stat ${citationCount ? '' : 'is-empty'}">
          <div class="research-stat-value">
            ${iconSvg('trend')}
            <strong>${citationCount ? escapeHtml(compactNumber(citationCount)) : '-'}</strong>
          </div>
          <span>citations</span>
          <small>${citationPace ? `${escapeHtml(citationPace)} / yr` : 'no citation data'}</small>
        </div>
      </div>
    </article>
  `;
}

function hydrateGithubStats(root) {
  root.querySelectorAll('[data-github-repo]').forEach(async element => {
    const repo = element.dataset.githubRepo;
    const target = element.querySelector('[data-github-stars]');
    if (!repo || !target) return;
    try {
      const data = githubCache.has(repo)
        ? githubCache.get(repo)
        : await fetchGithubRepo(repo);
      if (data?.stars != null) target.textContent = compactNumber(data.stars);
    } catch {
      target.textContent = '-';
    }
  });
}

async function fetchGithubRepo(repo) {
  const response = await fetch(`https://api.github.com/repos/${repo}`);
  if (!response.ok) throw new Error(`GitHub lookup failed for ${repo}`);
  const json = await response.json();
  const data = { stars: json.stargazers_count || 0 };
  githubCache.set(repo, data);
  return data;
}

function paperActions({ pdfUrl, arxivUrl, githubUrl, huggingFaceUrl, websiteUrl, code }) {
  return [
    pdfUrl && paperAction('file', 'View PDF', pdfUrl),
    arxivUrl && paperAction('external', 'arXiv page', arxivUrl),
    githubUrl && paperAction('github', 'GitHub', githubUrl),
    huggingFaceUrl && paperAction('huggingface', 'Hugging Face', huggingFaceUrl),
    websiteUrl && paperAction('globe', 'Website', websiteUrl),
    code && code !== githubUrl && code !== huggingFaceUrl && code !== websiteUrl && paperAction('code', 'Code', code),
  ].filter(Boolean).join('');
}

function paperAction(icon, label, url) {
  return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${iconSvg(icon)}<span>${escapeHtml(label)}</span></a>`;
}

function iconSvg(name) {
  const icons = {
    github: '<svg class="research-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.58 2 12.25c0 4.52 2.87 8.35 6.84 9.71.5.09.68-.22.68-.49 0-.24-.01-1.05-.01-1.91-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.1-1.49-1.1-1.49-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.55-1.14-4.55-5.05 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.04A9.23 9.23 0 0 1 12 6.98c.85 0 1.7.12 2.5.35 1.9-1.32 2.74-1.04 2.74-1.04.55 1.4.2 2.44.1 2.7.64.71 1.03 1.62 1.03 2.74 0 3.92-2.34 4.78-4.56 5.04.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.1 10.1 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"/></svg>',
    trend: '<svg class="research-icon research-icon-trend" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m0 0-6 6m6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    file: '<svg class="research-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7V3Zm7 0v5h5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M9.5 13h5M9.5 16h5M9.5 10H12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    external: '<svg class="research-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6m0-6-9 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    code: '<svg class="research-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 17-5-5 5-5m8 0 5 5-5 5m-2-12-4 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    globe: '<svg class="research-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    huggingface: '<svg class="research-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9.5a2 2 0 1 1 4 0m3 0a2 2 0 1 1 4 0M7 14c1.4 1.5 3 2.2 5 2.2s3.6-.7 5-2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  };
  return icons[name] || '';
}

function renderPager(container, pageCount) {
  if (pageCount <= 1) {
    container.innerHTML = '';
    return;
  }

  const pages = pageWindow(state.page, pageCount);
  container.innerHTML = `
    <button type="button" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''}>Previous</button>
    ${pages.map(page => page === 'gap'
      ? '<span class="catalog-pager-gap">...</span>'
      : `<button type="button" class="${page === state.page ? 'is-active' : ''}" data-page="${page}" aria-current="${page === state.page ? 'page' : 'false'}">${page.toLocaleString()}</button>`
    ).join('')}
    <button type="button" data-page="${state.page + 1}" ${state.page === pageCount ? 'disabled' : ''}>Next</button>
  `;
}

function pageWindow(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach(page => pages.add(page));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach(page => pages.add(page));

  const ordered = [...pages].filter(page => page >= 1 && page <= total).sort((a, b) => a - b);
  const result = [];
  for (const page of ordered) {
    if (result.length && page - result[result.length - 1] > 1) result.push('gap');
    result.push(page);
  }
  return result;
}

function renderItem(cfg, row) {
  const title = row[cfg.titleField] || 'Untitled';
  const url = cfg.url(row);
  const code = cfg.codeUrl(row);
  const metric = cfg.metric(row);
  const tags = cfg.tags(row).slice(0, 5);
  const meta = cfg.meta(row);
  const description = truncate(cleanText(cfg.description(row)), 260);

  return `
    <article class="catalog-item">
      <div class="catalog-item-main">
        <h2>${url ? `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${escapeHtml(title)}</a>` : escapeHtml(title)}</h2>
        ${meta ? `<p class="catalog-meta">${escapeHtml(meta)}</p>` : ''}
        ${cfg.subtitle(row) ? `<p class="catalog-subtitle">${escapeHtml(cfg.subtitle(row))}</p>` : ''}
        ${description ? `<p class="catalog-description">${escapeHtml(description)}</p>` : ''}
        ${tags.length ? `<div class="catalog-tags">${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="catalog-actions">
        ${metric ? `<span class="catalog-metric">${escapeHtml(metric)}</span>` : ''}
        ${url ? `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">Open</a>` : ''}
        ${code && code !== url ? `<a href="${escapeAttr(code)}" target="_blank" rel="noopener">Code</a>` : ''}
      </div>
    </article>
  `;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift() || [];
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

function splitValues(value) {
  return [...new Set(String(value || '')
    .split(/[;|]/)
    .map(item => item.replace(/^[-\s]+/, '').trim())
    .filter(item => item && item.length < 44))];
}

function paperSortValue(row) {
  const year = Number(row.year) || 0;
  const citations = Number(row.citations || row.citation_count) || 0;
  if (state.sort === 'newest') return year * 100000 + citations;
  if (state.sort === 'cited') return citations * 100000 + year;
  return citations * 1000 + year * 8;
}

function paperCitationPace(row, citations) {
  const year = Number(row.year) || 0;
  if (!citations || !year) return '';
  const age = Math.max(1, new Date().getFullYear() - year + 1);
  const pace = citations / age;
  return pace >= 10 ? pace.toFixed(0) : pace.toFixed(1);
}

function paperDomains(row) {
  const values = splitValues(row.task || row.method_family || row.modality || row.matched_terms || row.tags || row.topic_query)
    .map(value => normalizeDomain(value))
    .filter(Boolean)
    .filter(value => !['unspecified', 'unknown', 'source', 'catalogue', 'arxiv'].includes(value));
  return [...new Set(values)].slice(0, 6);
}

function paperPdfUrl(row) {
  const raw = rawPaper(row);
  if (row.pdf_url) return row.pdf_url;
  if (raw.open_pdf_url) return raw.open_pdf_url;
  const arxiv = cleanArxivId(row.arxiv_id || raw.arxiv_id);
  if (arxiv) return `https://arxiv.org/pdf/${arxiv}`;
  const url = row.url || row.link || raw.url || raw.paper_url;
  if (/arxiv\.org\/abs\//i.test(url)) return url.replace('/abs/', '/pdf/');
  if (/arxiv\.org\/pdf\//i.test(url)) return url;
  return '';
}

function paperArxivUrl(row) {
  const raw = rawPaper(row);
  if (row.arxiv_url) return row.arxiv_url;
  const arxiv = cleanArxivId(row.arxiv_id || raw.arxiv_id);
  if (arxiv) return `https://arxiv.org/abs/${arxiv}`;
  const url = row.url || row.link || raw.url || raw.paper_url || '';
  if (/arxiv\.org\/abs\//i.test(url)) return url;
  if (/arxiv\.org\/pdf\//i.test(url)) return url.replace('/pdf/', '/abs/').replace(/\.pdf$/i, '');
  return '';
}

function paperCodeUrl(row) {
  const raw = rawPaper(row);
  return row.code_url || raw.code_weights_url || raw.code_url || '';
}

function paperGithubUrl(row) {
  const raw = rawPaper(row);
  const github = row.github_url || raw.github_url || '';
  if (github) return github;
  const code = paperCodeUrl(row);
  return githubRepoName(code) ? code : '';
}

function paperHuggingFaceUrl(row) {
  const raw = rawPaper(row);
  return row.huggingface_url || raw.huggingface_url || '';
}

function paperWebsiteUrl(row, primaryUrl) {
  const raw = rawPaper(row);
  const project = row.project_url || raw.project_url || raw.homepage_url || '';
  if (!project || project === primaryUrl || project === row.pdf_url || project === row.arxiv_url) return '';
  if (project === row.github_url || project === row.huggingface_url || project === row.code_url) return '';
  return project;
}

function githubRepoName(url) {
  const match = String(url || '').match(/github\.com\/([^/\s?#]+)\/([^/\s?#]+)/i);
  if (!match) return '';
  const owner = match[1];
  const repo = match[2].replace(/\.git$/i, '');
  if (!owner || !repo) return '';
  return `${owner}/${repo}`;
}

function rawPaper(row) {
  if (!row.raw_json) return {};
  try {
    return JSON.parse(row.raw_json);
  } catch {
    return {};
  }
}

function cleanArxivId(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\/arxiv\.org\/abs\//i, '')
    .replace(/^https?:\/\/arxiv\.org\/pdf\//i, '')
    .replace(/\.pdf$/i, '');
}

function normalizeDomain(value) {
  return String(value || '')
    .replace(/^category:/i, '')
    .replace(/^publication_type:/i, '')
    .replace(/^status:/i, '')
    .replace(/^conference:/i, '')
    .replace(/^task_categories:/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .toLowerCase();
}

function titleCase(value) {
  return String(value || '').replace(/\b\w/g, char => char.toUpperCase());
}

function truncateAuthors(value) {
  const authors = String(value || '').split(';').map(author => author.trim()).filter(Boolean);
  if (authors.length <= 3) return authors.join(', ');
  return `${authors.slice(0, 3).join(', ')} +${authors.length - 3} authors`;
}

function compactNumber(value) {
  const n = Number(value) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toLocaleString();
}

function includesAny(row, needles) {
  const haystack = Object.values(row).join(' ').toLowerCase();
  return needles.some(needle => haystack.includes(String(needle).toLowerCase()));
}

function joinClean(values) {
  return values.map(value => String(value || '').trim()).filter(Boolean).join(' · ');
}

function doiUrl(doi) {
  return doi ? `https://doi.org/${doi.replace(/^https?:\/\/doi.org\//, '')}` : '';
}

function numberLabel(value, noun) {
  const n = Number(value);
  if (!n) return '';
  return `${n.toLocaleString()} ${noun}${n === 1 ? '' : 's'}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.getFullYear();
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function truncate(value, limit) {
  return value.length > limit ? `${value.slice(0, limit - 1).trim()}...` : value;
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
