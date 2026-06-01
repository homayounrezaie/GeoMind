// Renders the dynamic endpoint reference page from ?endpoint=<name>.
// Code samples show the public URL; the live sample response is fetched
// relative to the site so it also works during local dev.
const DISPLAY_BASE = 'https://homayounrezaie.github.io/GeoMind/api/';
const FETCH_BASE = '../api/';

const ENDPOINTS = [
  { name: 'papers', title: 'Papers', desc: 'Research papers with citations, abstracts, venues, code links, and PDFs.' },
  { name: 'models', title: 'Models', desc: 'Foundation models and model candidates across geospatial AI.' },
  { name: 'datasets', title: 'Datasets', desc: 'Geospatial and remote-sensing datasets with tags and usage signals.' },
  { name: 'companies', title: 'Companies', desc: 'Organizations across geospatial, EO, GIS, analytics, and UAV markets.' },
  { name: 'benchmarks', title: 'Benchmarks', desc: 'Benchmark rows linking papers, tasks, datasets, metrics, and scores.' },
  { name: 'tasks', title: 'Tasks', desc: 'GeoAI task names and their categories.' },
  { name: 'metrics', title: 'Metrics', desc: 'Evaluation metrics and metric families.' },
  { name: 'techniques', title: 'Techniques', desc: 'Methods, algorithms, and learning techniques.' },
  { name: 'learn', title: 'Learn', desc: 'Guides and explainers for getting started with GeoAI.' },
  { name: 'jobs', title: 'Jobs', desc: 'Career and job-board sources across the GeoAI market.' },
];

const params = new URLSearchParams(location.search);
const requested = params.get('endpoint');
const index = ENDPOINTS.findIndex(e => e.name === requested);
const current = index === -1 ? 0 : index;
const ep = ENDPOINTS[current];

function snippet(lang, name) {
  const url = `${DISPLAY_BASE}${name}.json`;
  if (lang === 'js') {
    return `const res = await fetch('${url}');\nconst ${name} = await res.json();\n\nconsole.log(${name}.length);\nconsole.log(${name}[0]);`;
  }
  if (lang === 'py') {
    return `import requests\n\n${name} = requests.get('${url}').json()\nprint(len(${name}))\nprint(${name}[0])`;
  }
  return `curl ${url}`;
}

const setText = (sel, text) => { const el = document.querySelector(sel); if (el) el.textContent = text; };

// Header + meta
document.title = `GeoMind API · ${ep.title}`;
setText('[data-ep-title]', ep.title);
setText('[data-ep-desc]', ep.desc);
setText('[data-ep-path]', `/api/${ep.name}.json`);

// Code samples
['js', 'py', 'http'].forEach(lang => {
  setText(`[data-ep-code="${lang}"]`, snippet(lang, ep.name));
});

// Active sidebar link
document.querySelectorAll('.docs-sidebar a').forEach(link => {
  link.classList.toggle('is-active', link.getAttribute('href') === `api-endpoint.html?endpoint=${ep.name}`);
});

// Prev / next pager
const prev = ENDPOINTS[current - 1];
const next = ENDPOINTS[current + 1];
const prevLink = document.querySelector('[data-ep-prev]');
const nextLink = document.querySelector('[data-ep-next]');
if (prev) {
  prevLink.href = `api-endpoint.html?endpoint=${prev.name}`;
  setText('[data-ep-prev-label]', `← ${prev.title}`);
} else {
  prevLink.href = 'api-get-started.html';
  setText('[data-ep-prev-label]', '← Get started');
}
if (next) {
  nextLink.href = `api-endpoint.html?endpoint=${next.name}`;
  setText('[data-ep-next-label]', `${next.title} →`);
} else {
  nextLink.href = 'api.html';
  setText('[data-ep-next-label]', 'Welcome →');
}

// Filter & paginate snippets, tailored to the endpoint's actual fields.
function setFilterSnippets(record) {
  const n = ep.name;
  const url = `${DISPLAY_BASE}${n}.json`;
  const keys = Object.keys(record || {});
  const textField = ['title', 'name', 'label', 'question'].find(k => typeof record?.[k] === 'string')
    || keys.find(k => typeof record[k] === 'string') || 'title';
  const hasYear = typeof record?.year === 'number';

  const js = [
    `const ${n} = await fetch('${url}').then(r => r.json());`,
    ``,
    `// First 10 records`,
    `const page = ${n}.slice(0, 10);`,
    ...(hasYear ? [``, `// Filter by year`, `const recent = ${n}.filter(r => r.year >= 2020);`] : []),
    ``,
    `// Keyword search`,
    `const hits = ${n}.filter(r =>`,
    `  r.${textField}?.toLowerCase().includes('query'));`,
  ].join('\n');

  const py = [
    `import requests`,
    ``,
    `${n} = requests.get('${url}').json()`,
    ``,
    `# First 10 records`,
    `page = ${n}[:10]`,
    ...(hasYear ? [``, `# Filter by year`, `recent = [r for r in ${n} if r.get('year', 0) >= 2020]`] : []),
    ``,
    `# Keyword search`,
    `hits = [r for r in ${n} if 'query' in str(r.get('${textField}', '')).lower()]`,
  ].join('\n');

  const http = [
    `# First 10 records`,
    `curl -s ${url} | jq '.[:10]'`,
    ...(hasYear ? [``, `# Filter by year`, `curl -s ${url} | jq 'map(select(.year >= 2020))'`] : []),
    ``,
    `# Keyword search`,
    `curl -s ${url} | jq 'map(select(.${textField} | ascii_downcase | contains("query")))'`,
  ].join('\n');

  setText('[data-ep-filter="js"]', js);
  setText('[data-ep-filter="py"]', py);
  setText('[data-ep-filter="http"]', http);
}

// Live count + sample response
const responseEl = document.querySelector('[data-ep-response]');
const statusEl = document.querySelector('[data-ep-status]');

fetch(`${FETCH_BASE}index.json`)
  .then(r => r.json())
  .then(data => {
    const meta = data.endpoints?.find(e => e.name === ep.name);
    if (meta) setText('[data-ep-count]', `${meta.count.toLocaleString()} records`);
  })
  .catch(() => setText('[data-ep-count]', 'count unavailable'));

fetch(`${FETCH_BASE}${ep.name}.json`)
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(rows => {
    const sample = Array.isArray(rows) ? rows[0] : rows;
    responseEl.textContent = JSON.stringify(sample, null, 2);
    if (statusEl && Array.isArray(rows)) {
      statusEl.textContent = `Showing record 1 of ${rows.length.toLocaleString()}.`;
    }
    setFilterSnippets(sample);
  })
  .catch(() => {
    responseEl.textContent = `// Could not load ${ep.name}.json`;
    if (statusEl) { statusEl.textContent = 'Sample response unavailable.'; statusEl.dataset.state = 'error'; }
    setFilterSnippets(null);
  });
