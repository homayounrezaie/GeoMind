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
    sortValue: row => Number(row.year) || 0,
    tags: row => splitValues(row.task || row.method_family || row.modality || row.matched_terms || row.tags),
    meta: row => joinClean([row.year, row.venue || row.conference, row.discovered_via]),
    filters: [
      { key: 'all', label: 'All' },
      { key: 'recent', label: 'Recent', test: row => Number(row.year) >= 2025 },
      { key: 'code', label: 'Code', test: row => row.code_url },
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

const PAGE_SIZE = 24;
const state = { rows: [], filtered: [], page: 1, query: '', filter: 'all' };

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
    renderStats(els, cfg);
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

  els.more.addEventListener('click', () => {
    state.page += 1;
    renderList(cfg, els);
  });
}

function getElements() {
  return {
    label: document.querySelector('[data-catalog-label]'),
    title: document.querySelector('[data-catalog-title]'),
    intro: document.querySelector('[data-catalog-intro]'),
    count: document.querySelector('[data-catalog-count]'),
    updated: document.querySelector('[data-catalog-updated]'),
    secondary: document.querySelector('[data-catalog-secondary]'),
    search: document.querySelector('[data-catalog-search]'),
    filters: document.querySelector('[data-catalog-filters]'),
    list: document.querySelector('[data-catalog-list]'),
    status: document.querySelector('[data-catalog-status]'),
    more: document.querySelector('[data-catalog-more]'),
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
    .filter(row => !query || Object.values(row).some(value => String(value).toLowerCase().includes(query)))
    .sort((a, b) => cfg.sortValue(b) - cfg.sortValue(a));
  renderList(cfg, els);
}

function renderStats(els, cfg) {
  setText(els.count, state.rows.length.toLocaleString());
  setText(els.updated, 'Local CSV');
  const linked = state.rows.filter(row => cfg.url(row)).length;
  setText(els.secondary, `${linked.toLocaleString()} linked records`);
}

function renderFilters(container, cfg) {
  container.innerHTML = cfg.filters.map((filter, index) => (
    `<button type="button" class="catalog-chip ${index === 0 ? 'is-active' : ''}" data-filter="${filter.key}">${escapeHtml(filter.label)}</button>`
  )).join('');
}

function renderList(cfg, els) {
  const visible = state.filtered.slice(0, state.page * PAGE_SIZE);
  const total = state.filtered.length;
  setText(els.status, `${total.toLocaleString()} results`);
  els.more.hidden = visible.length >= total;

  if (!visible.length) {
    els.list.innerHTML = `<div class="catalog-empty">${escapeHtml(cfg.empty)}</div>`;
    return;
  }

  els.list.innerHTML = visible.map(row => renderItem(cfg, row)).join('');
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
