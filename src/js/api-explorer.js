const API_BASE = '../api/';
const RESULT_LIMIT = 100;
const state = {
  endpoints: [],
  current: '',
  rows: [],
  query: '',
};

const els = {
  endpoints: document.querySelector('[data-api-endpoints]'),
  list: document.querySelector('[data-api-list]'),
  search: document.querySelector('[data-api-search]'),
  status: document.querySelector('[data-api-status]'),
  url: document.querySelector('[data-api-url]'),
  copy: document.querySelector('[data-copy-url]'),
};

init();

async function init() {
  try {
    const index = await fetchJson('index.json');
    state.endpoints = Array.isArray(index.endpoints) ? index.endpoints : [];
    const params = new URLSearchParams(window.location.search);
    state.query = params.get('q') || '';
    state.current = params.get('endpoint') || firstEndpoint();
    els.search.value = state.query;
    renderEndpoints();
    await loadEndpoint(state.current);
  } catch (error) {
    showError('Could not load API index.');
    console.error(error);
  }

  els.search.addEventListener('input', debounce(() => {
    state.query = els.search.value.trim();
    syncUrl();
    renderRows();
  }, 120));

  els.copy.addEventListener('click', async () => {
    const value = absoluteEndpointUrl(state.current);
    try {
      await navigator.clipboard.writeText(value);
      els.copy.textContent = 'Copied';
      setTimeout(() => {
        els.copy.textContent = 'Copy';
      }, 1100);
    } catch {
      els.copy.textContent = 'Select';
    }
  });
}

function firstEndpoint() {
  return state.endpoints[0]?.name || 'index';
}

async function loadEndpoint(name) {
  if (!name) return;
  state.current = name;
  state.rows = [];
  els.list.innerHTML = '<div class="api-empty">Loading...</div>';
  updateEndpointUrl();
  renderEndpoints();
  syncUrl();

  try {
    const rows = await fetchJson(`${name}.json`);
    state.rows = Array.isArray(rows) ? rows : [];
    renderRows();
  } catch (error) {
    showError(`Could not load ${name}.json.`);
    console.error(error);
  }
}

async function fetchJson(file) {
  const response = await fetch(`${API_BASE}${file}`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Failed to load ${file}`);
  return response.json();
}

function renderEndpoints() {
  els.endpoints.innerHTML = state.endpoints.map(endpoint => {
    const active = endpoint.name === state.current ? ' is-active' : '';
    return `
      <button class="api-endpoint${active}" type="button" data-endpoint="${escapeHtml(endpoint.name)}">
        <span>${escapeHtml(endpoint.name)}</span>
        <strong>${formatCount(endpoint.count)}</strong>
      </button>
    `;
  }).join('');

  els.endpoints.querySelectorAll('[data-endpoint]').forEach(button => {
    button.addEventListener('click', () => {
      state.query = '';
      els.search.value = '';
      loadEndpoint(button.dataset.endpoint);
    });
  });
}

function renderRows() {
  const query = state.query.toLowerCase();
  const matches = [];

  for (const row of state.rows) {
    if (!query || JSON.stringify(row).toLowerCase().includes(query)) {
      matches.push(row);
    }
    if (matches.length >= RESULT_LIMIT) break;
  }

  const totalMatches = query ? countMatches(query) : state.rows.length;
  els.status.textContent = `${formatCount(totalMatches)} match${totalMatches === 1 ? '' : 'es'} / ${formatCount(state.rows.length)} records`;

  if (!matches.length) {
    els.list.innerHTML = '<div class="api-empty">No records found.</div>';
    return;
  }

  els.list.innerHTML = matches.map(renderRow).join('');
}

function countMatches(query) {
  let count = 0;
  for (const row of state.rows) {
    if (JSON.stringify(row).toLowerCase().includes(query)) count += 1;
  }
  return count;
}

function renderRow(row) {
  const title = pick(row, ['title', 'name', 'company_name', 'dataset_id', 'task_name', 'technique_name', 'metric_name', 'id']) || 'Untitled';
  const subtitle = pick(row, ['venue', 'organization', 'category', 'type', 'industry_category', 'url']) || state.current;
  const description = pick(row, ['abstract', 'description', 'short_description', 'notes', 'evidence']) || '';
  const href = pick(row, ['url', 'paper_url', 'open_pdf_url', 'website', 'github_url', 'project_url']);
  const chips = collectChips(row).slice(0, 6);

  return `
    <article class="api-card">
      <div class="api-card-main">
        <p class="api-card-kicker">${escapeHtml(String(subtitle))}</p>
        <h2>${escapeHtml(String(title))}</h2>
        ${description ? `<p>${escapeHtml(String(description)).slice(0, 420)}</p>` : ''}
        ${chips.length ? `<div class="api-card-tags">${chips.map(chip => `<span>${escapeHtml(chip)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="api-card-actions">
        ${href ? `<a href="${escapeHtml(String(href))}" target="_blank" rel="noopener">Open</a>` : ''}
        <details>
          <summary>JSON</summary>
          <pre>${escapeHtml(JSON.stringify(row, null, 2))}</pre>
        </details>
      </div>
    </article>
  `;
}

function collectChips(row) {
  const chips = [];
  for (const key of ['year', 'authors', 'tags', 'task_categories', 'status', 'source', 'product_category']) {
    const value = row[key];
    if (Array.isArray(value)) chips.push(...value.map(String));
    else if (value) chips.push(String(value));
  }
  return chips;
}

function pick(row, keys) {
  for (const key of keys) {
    if (row[key]) return row[key];
  }
  return '';
}

function updateEndpointUrl() {
  els.url.textContent = absoluteEndpointUrl(state.current);
}

function absoluteEndpointUrl(endpoint) {
  return new URL(`${API_BASE}${endpoint}.json`, window.location.href).href;
}

function syncUrl() {
  const params = new URLSearchParams();
  if (state.current) params.set('endpoint', state.current);
  if (state.query) params.set('q', state.query);
  window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
}

function showError(message) {
  els.status.textContent = message;
  els.list.innerHTML = `<div class="api-empty">${escapeHtml(message)}</div>`;
}

function formatCount(value) {
  return Number(value || 0).toLocaleString();
}

function debounce(fn, wait) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}
