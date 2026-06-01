/* Landing page script — no ES modules, no dependencies */

function initCanvas() {
  const canvas = document.getElementById('logoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 28, H = 28;
  const nodes = [
    {x:14,y:5.25},{x:7,y:8.75},{x:21,y:8.75},
    {x:4.375,y:14.875},{x:14,y:12.25},{x:23.625,y:14.875},
    {x:8.75,y:20.125},{x:19.25,y:20.125},{x:14,y:23.625},
    {x:11.375,y:15.75},{x:16.625,y:15.75},
  ];
  const state = nodes.map(() => ({
    opacity: Math.random(),
    speed:   0.008 + Math.random() * 0.018,
    dir:     Math.random() > 0.5 ? 1 : -1,
    delay:   Math.random() * 120,
  }));
  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame++;
    state.forEach((s, i) => {
      if (frame < s.delay) return;
      s.opacity += s.speed * s.dir;
      if (s.opacity >= 1) { s.opacity = 1; s.dir = -1; }
      if (s.opacity <= 0) {
        s.opacity = 0; s.dir = 1;
        s.delay = frame + Math.random() * 80;
        s.speed = 0.008 + Math.random() * 0.018;
      }
      const n = nodes[i], r = 1.925;
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.5);
      grd.addColorStop(0, `rgba(83,74,183,${s.opacity * 0.35})`);
      grd.addColorStop(1, `rgba(83,74,183,0)`);
      ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(83,74,183,${s.opacity * 0.85})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}


document.addEventListener('DOMContentLoaded', async () => {
  initCanvas();
  initScrollReveal();
  await loadStats();
  initHeroStatsStream();
  initTerminalExplorer();
  initDatasetQuery();
});

function initScrollReveal() {
  if (!document.documentElement.classList.contains('has-reveal')) return;
  const targets = [...document.querySelectorAll(
    '.lp-sec-title, .lp-sec-label, .lp-intro-copy, .gm-heatmap-intro'
  )];
  if (!targets.length) return;

  if (typeof IntersectionObserver !== 'function') {
    targets.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8%', threshold: 0 });

  targets.forEach(el => observer.observe(el));

  // Safety net: anything still hidden after ~3 s gets revealed regardless,
  // so unusual scroll behavior (e.g. headless screenshots) never leaves
  // content stuck invisible.
  window.setTimeout(() => {
    targets.forEach(el => el.classList.add('is-revealed'));
  }, 3000);
}

const TERMINAL_FLOW = [
  {
    cwd: '~/main',
    command: 'ls',
    comment: 'nine routes through the GeoAI landscape',
    output: [
      { name: 'learn/',             href: 'pages/learn.html' },
      { name: 'foundation-models/', href: 'pages/foundation-models.html', statsKey: 'models' },
      { name: 'techniques/',        href: 'pages/app.html#techniques',    statsKey: 'techniques' },
      { name: 'tasks/',             href: 'pages/app.html#tasks',         statsKey: 'tasks' },
      { name: 'stack/',             href: 'pages/app.html#stack' },
      { name: 'papers/',            href: 'pages/paper-with-code.html',   statsKey: 'papers' },
      { name: 'datasets/',          href: 'pages/datasets.html',          statsKey: 'datasets' },
      { name: 'companies/',         href: 'pages/companies.html',         statsKey: 'companies' },
      { name: 'jobs/',              href: 'pages/job-market.html' },
    ],
  },
  {
    cwd: '~/main',
    command: 'cd learn && ls',
    comment: 'these topics are fundamentals to go deeper in GeoAI',
    output: [
      { name: 'geospatial/' },
      { name: 'remote-sensing/' },
      { name: 'statistics/' },
      { name: 'physics/' },
      { name: 'machine-learning/' },
      { name: 'deep-learning/' },
    ],
  },
  {
    cwd: '~/main',
    command: 'cd foundation-models && ls | head -10',
    dynamicSource: 'models',
  },
  {
    cwd: '~/main',
    command: 'cd techniques && ls | head -10',
    dynamicSource: 'techniques',
  },
  {
    cwd: '~/main',
    command: 'cd tasks && ls | head -10',
    dynamicSource: 'tasks',
  },
  {
    cwd: '~/main',
    command: 'cd stack && ls',
    comment: 'the toolchain — libraries, databases, compute, deployment',
    output: [
      { name: 'pytorch/' },
      { name: 'gdal/' },
      { name: 'rasterio/' },
      { name: 'postgis/' },
      { name: 'aws/' },
      { name: 'docker/' },
      { name: 'mlops/' },
    ],
  },
  {
    cwd: '~/main',
    command: 'cd papers && ls | head -10',
    dynamicSource: 'papers',
  },
  {
    cwd: '~/main',
    command: 'cd datasets && ls | head -10',
    dynamicSource: 'datasets',
  },
  {
    cwd: '~/main',
    command: 'cd companies && ls | head -10',
    dynamicSource: 'companies',
  },
  {
    cwd: '~/main',
    command: 'cd jobs && ls',
    comment: 'roles, hiring signals, and skill maps in GeoAI',
    output: [
      { name: 'ml-engineer/' },
      { name: 'data-scientist/' },
      { name: 'gis-developer/' },
      { name: 'remote-sensing-engineer/' },
      { name: 'research-scientist/' },
      { name: 'computer-vision-engineer/' },
      { name: 'backend-engineer/' },
      { name: 'product-manager/' },
      { name: 'founding-engineer/' },
      { name: 'field-applications/' },
    ],
  },
];

const STATS_DEFAULTS = { papers: 18230, models: 11276, datasets: 4030, benchmarks: 1012, companies: 4773 };
let STATS = { ...STATS_DEFAULTS };
let STATS_PROMISE = null;

function loadStats() {
  if (STATS_PROMISE) return STATS_PROMISE;
  STATS_PROMISE = fetch('data/stats.json', { cache: 'no-cache' })
    .then(response => (response.ok ? response.json() : null))
    .then(data => {
      if (data && typeof data === 'object') {
        STATS = { ...STATS_DEFAULTS, ...data };
      }
      return STATS;
    })
    .catch(() => STATS);
  return STATS_PROMISE;
}

function formatStat(value) {
  return Number(value || 0).toLocaleString();
}

function statValue(key) {
  if (key === 'datasets_plus_benchmarks') {
    return Number(STATS.datasets || 0) + Number(STATS.benchmarks || 0);
  }
  return Number(STATS[key] || 0);
}

function initTerminalExplorer() {
  const root = document.querySelector('[data-terminal]');
  if (!root) return;

  const screen = root.querySelector('[data-terminal-screen]');
  const commandEl = root.querySelector('[data-terminal-command]');
  const outputEl = root.querySelector('[data-terminal-output]');
  const pathEl = root.querySelector('[data-terminal-path]');
  const cwdEl = root.querySelector('[data-terminal-cwd]');
  const pauseBtn = root.querySelector('[data-terminal-pause]');
  const nextBtn = root.querySelector('[data-terminal-next]');
  if (!screen || !commandEl || !outputEl) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const charDelayMin = 22;
  const charDelayMax = 48;
  const punctuationDelay = 90;
  const outputStagger = 70;
  const restAfterOutput = 3400;
  const preOutputBeat = 220;

  let stepIndex = 0;
  let advanceTimer = null;
  let typingTimers = [];
  let pausedByUser = false;
  let pausedByHover = false;

  function clearAdvanceTimer() {
    if (advanceTimer) {
      window.clearTimeout(advanceTimer);
      advanceTimer = null;
    }
  }

  function clearTypingTimers() {
    typingTimers.forEach(window.clearTimeout);
    typingTimers = [];
  }

  function isPaused() {
    return pausedByUser || pausedByHover;
  }

  function resolveStep(step) {
    let items = step.output;
    let comment = step.comment;
    if (step.dynamicSource) {
      const highlights = (STATS.highlights && STATS.highlights[step.dynamicSource]) || [];
      items = highlights.map(name => ({ name: `${name}/` }));
    }
    if (step.commentTemplate) {
      const count = step.countKey != null ? formatStat(STATS[step.countKey]) : '';
      comment = step.commentTemplate.replace('{count}', count);
    }
    return { items: items || [], comment };
  }

  function setOutput(items, comment) {
    outputEl.innerHTML = '';
    let cursor = 0;
    if (comment) {
      const note = document.createElement('span');
      note.className = 'lp-terminal-comment';
      note.textContent = `# ${comment}`;
      note.style.animationDelay = '0ms';
      outputEl.appendChild(note);
      cursor = 1;
    }
    items.forEach((item, index) => {
      const row = item.href
        ? document.createElement('a')
        : document.createElement('span');
      row.className = item.href ? 'lp-terminal-row is-link' : 'lp-terminal-row';
      if (item.href) {
        row.href = item.href;
        row.target = '_blank';
        row.rel = 'noopener';
      }
      const name = document.createElement('span');
      name.className = 'lp-terminal-row-name';
      name.textContent = item.name;
      row.appendChild(name);
      if (item.statsKey && statValue(item.statsKey) > 0) {
        const count = document.createElement('span');
        count.className = 'lp-terminal-row-count';
        count.textContent = `${formatStat(statValue(item.statsKey))} entries`;
        row.appendChild(count);
      }
      row.style.animationDelay = reduceMotion ? '0ms' : `${(index + cursor) * outputStagger}ms`;
      outputEl.appendChild(row);
    });
  }

  function typeCommand(text, onDone) {
    commandEl.textContent = '';
    if (reduceMotion) {
      commandEl.textContent = text;
      onDone();
      return;
    }

    let i = 0;
    const tick = () => {
      if (i >= text.length) {
        onDone();
        return;
      }
      const ch = text.charAt(i);
      commandEl.textContent += ch;
      i += 1;
      const base = (ch === '&' || ch === ' ' || ch === '/') ? punctuationDelay : (charDelayMin + Math.random() * (charDelayMax - charDelayMin));
      const t = window.setTimeout(tick, base);
      typingTimers.push(t);
    };
    tick();
  }

  function runStep(idx) {
    clearAdvanceTimer();
    clearTypingTimers();
    stepIndex = ((idx % TERMINAL_FLOW.length) + TERMINAL_FLOW.length) % TERMINAL_FLOW.length;
    const step = TERMINAL_FLOW[stepIndex];

    if (pathEl) pathEl.textContent = step.cwd;
    if (cwdEl) cwdEl.textContent = step.cwd;
    outputEl.innerHTML = '';
    screen.classList.add('is-typing');

    const resolved = resolveStep(step);
    typeCommand(step.command, () => {
      screen.classList.remove('is-typing');
      const t = window.setTimeout(() => {
        setOutput(resolved.items, resolved.comment);
        scheduleNext();
      }, preOutputBeat);
      typingTimers.push(t);
    });
  }

  function scheduleNext() {
    clearAdvanceTimer();
    if (isPaused()) return;
    advanceTimer = window.setTimeout(() => runStep(stepIndex + 1), restAfterOutput);
  }

  function togglePause() {
    pausedByUser = !pausedByUser;
    if (pauseBtn) {
      pauseBtn.textContent = pausedByUser ? 'Resume' : 'Pause';
      pauseBtn.setAttribute('aria-pressed', String(pausedByUser));
    }
    if (pausedByUser) {
      clearAdvanceTimer();
    } else if (!pausedByHover) {
      scheduleNext();
    }
  }

  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
  if (nextBtn) nextBtn.addEventListener('click', () => runStep(stepIndex + 1));

  root.addEventListener('mouseenter', () => {
    pausedByHover = true;
    clearAdvanceTimer();
  });
  root.addEventListener('mouseleave', () => {
    pausedByHover = false;
    if (!pausedByUser) scheduleNext();
  });

  runStep(0);
}

function initHeroStatsStream() {
  // Newer hero uses a clickable proof-grid (data-hero-stats). If present,
  // delegate to the count-up animation and skip the legacy typed line.
  const grid = document.querySelector('[data-hero-stats]');
  if (grid) {
    initHeroStatsCountUp(grid);
    return;
  }

  const el = document.querySelector('.lp-hero-stats');
  if (!el || el.dataset.streamed === 'true') return;
  el.dataset.streamed = 'true';

  const fromStats = `${formatStat(STATS.papers)} papers · ${formatStat(STATS.models)} models · ${formatStat(statValue('datasets_plus_benchmarks'))} datasets+benchmarks · ${formatStat(STATS.companies)} companies`;
  const fallback = (el.dataset.streamText || el.textContent || '').trim();
  const fullText = fromStats || fallback;
  if (!fullText) return;
  el.setAttribute('aria-label', fullText);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    el.classList.add('is-streamed');
    return;
  }

  el.textContent = '';
  el.classList.add('is-streaming');
  const caret = document.createElement('span');
  caret.className = 'lp-hero-stats-caret';
  caret.setAttribute('aria-hidden', 'true');
  el.appendChild(caret);

  let i = 0;
  const charInterval = 26;
  const punctuationPause = 110;
  const step = () => {
    if (i >= fullText.length) {
      el.classList.remove('is-streaming');
      el.classList.add('is-streamed');
      window.setTimeout(() => caret.remove(), 1400);
      return;
    }
    const char = fullText.charAt(i);
    caret.insertAdjacentText('beforebegin', char);
    i += 1;
    const delay = char === '·' || char === ',' ? punctuationPause : charInterval;
    window.setTimeout(step, delay);
  };
  window.setTimeout(step, 820);
}

const DATASET_QUERY_COMMAND = './query datasets --limit 4 --preview';
const DATASET_QUERY_COMMENT = 'fetching sample tiles + metadata from the catalog';
const DATASET_QUERY_REST = 7200;
const DATASET_PAGE_SIZE = 4;

const DATASET_SAMPLES = [
  {
    name: 'esa-worldcover',
    span: '2020 / 2021',
    href: 'pages/datasets.html#esa-worldcover',
    a: 'public/datasets/esa-worldcover-nile-a.webp',
    b: 'public/datasets/esa-worldcover-nile-b.webp',
    altA: 'Sentinel-2 RGB, Nile Delta',
    altB: 'ESA WorldCover land-cover classes, 10 m',
    meta: [
      ['source',     'Sentinel-2 L2A'],
      ['bands',      '13'],
      ['resolution', '10 m'],
      ['coverage',   'global · 11 classes'],
      ['size',       '~280 GB'],
      ['license',    'CC BY 4.0'],
    ],
  },
  {
    name: 'hls-landsat-sentinel',
    span: '2013 → now',
    href: 'pages/datasets.html#hls',
    a: 'public/datasets/hls-landsat-swir-a.webp',
    b: 'public/datasets/hls-landsat-swir-b.webp',
    altA: 'HLS Landsat true color',
    altB: 'HLS SWIR / NIR / Red false color',
    meta: [
      ['source',     'Landsat 8/9 + Sentinel-2'],
      ['bands',      '6 (HLSL30) · 11 (HLSS30)'],
      ['resolution', '30 m · revisit 2-3 d'],
      ['coverage',   'global, harmonized'],
      ['size',       '70+ TB'],
      ['license',    'Public domain (NASA)'],
    ],
  },
  {
    name: 'jrc-global-surface-water',
    span: '1984 → 2023',
    href: 'pages/datasets.html#jrc-global-surface-water',
    a: 'public/datasets/jrc-water-amazon-a.webp',
    b: 'public/datasets/jrc-water-amazon-b.webp',
    altA: 'JRC Global Surface Water occurrence',
    altB: 'JRC seasonality layer',
    meta: [
      ['source',     'Landsat 5/7/8'],
      ['bands',      '1 (occurrence)'],
      ['resolution', '30 m'],
      ['coverage',   'global · 40-year record'],
      ['size',       '~50 GB'],
      ['license',    'CC BY 4.0 (EC JRC)'],
    ],
  },
  {
    name: 'landsat-thermal',
    span: '2013 → now',
    href: 'pages/datasets.html#landsat',
    a: 'public/datasets/landsat-la-thermal-a.webp',
    b: 'public/datasets/landsat-la-thermal-b.webp',
    altA: 'Landsat 8/9 RGB, Los Angeles',
    altB: 'Landsat thermal infrared, 100 m resampled',
    meta: [
      ['source',     'Landsat 8/9 OLI/TIRS'],
      ['bands',      '11'],
      ['resolution', '30 m optical · 100 m thermal'],
      ['coverage',   'global · 16-day revisit'],
      ['size',       'multi-PB archive'],
      ['license',    'Public domain (USGS)'],
    ],
  },
  {
    name: 'modis-vegetation-indices',
    span: '2000 → now',
    href: 'pages/datasets.html#modis',
    a: 'public/datasets/modis-vi-iowa-a.webp',
    b: 'public/datasets/modis-vi-iowa-b.webp',
    altA: 'MODIS NDVI composite',
    altB: 'MODIS EVI composite',
    meta: [
      ['source',     'MODIS Terra / Aqua'],
      ['bands',      'NDVI · EVI'],
      ['resolution', '250 m · 500 m'],
      ['coverage',   'global · 16-day composites'],
      ['size',       '~3 TB / year'],
      ['license',    'Public domain (NASA)'],
    ],
  },
  {
    name: 'nasadem',
    span: '2000 mission',
    href: 'pages/datasets.html#nasadem',
    a: 'public/datasets/nasadem-grand-canyon-a.webp',
    b: 'public/datasets/nasadem-grand-canyon-b.webp',
    altA: 'NASADEM hillshade, Grand Canyon',
    altB: 'NASADEM elevation color ramp',
    meta: [
      ['source',     'SRTM, reprocessed (NASA)'],
      ['bands',      '1 (elevation)'],
      ['resolution', '30 m (1 arc-second)'],
      ['coverage',   '60° N – 56° S'],
      ['size',       '~250 GB'],
      ['license',    'Public domain (NASA)'],
    ],
  },
  {
    name: 'nrcan-land-cover',
    span: '2010 / 2015 / 2020',
    href: 'pages/datasets.html#nrcan-landcover',
    a: 'public/datasets/nrcan-landcover-calgary-a.webp',
    b: 'public/datasets/nrcan-landcover-calgary-b.webp',
    altA: 'Sentinel-2 RGB, Calgary region',
    altB: 'NRCan 19-class land-cover labels',
    meta: [
      ['source',     'Sentinel-2 + Landsat'],
      ['bands',      '1 (19-class label)'],
      ['resolution', '30 m'],
      ['coverage',   'Canada · 3 epochs'],
      ['size',       '~5 GB'],
      ['license',    'OGL Canada 2.0'],
    ],
  },
  {
    name: 'sentinel-1-sar',
    span: '2014 → now',
    href: 'pages/datasets.html#sentinel-1',
    a: 'public/datasets/sentinel1-sar-a.webp',
    b: 'public/datasets/sentinel1-sar-b.webp',
    altA: 'Sentinel-1 VV polarization, Rotterdam port',
    altB: 'Sentinel-1 VH polarization, surface texture',
    meta: [
      ['source',     'Sentinel-1 IW (C-band SAR)'],
      ['bands',      'VV · VH (dual-pol)'],
      ['resolution', '10 m · revisit 6 d'],
      ['coverage',   'global · all weather, day/night'],
      ['size',       'multi-PB archive'],
      ['license',    'CC BY-SA 3.0 IGO'],
    ],
  },
  {
    name: 'sentinel-1-delta',
    span: '2014 → now',
    href: 'pages/datasets.html#sentinel-1',
    a: 'public/datasets/sentinel1-delta-bangladesh-a.webp',
    b: 'public/datasets/sentinel1-delta-bangladesh-b.webp',
    altA: 'Sentinel-1 VV polarization, Bangladesh delta',
    altB: 'Sentinel-1 VH polarization, wetland texture',
    meta: [
      ['source',     'Sentinel-1 IW (C-band SAR)'],
      ['bands',      'VV · VH (dual-pol)'],
      ['resolution', '10 m · revisit 6 d'],
      ['coverage',   'global · floods, water bodies'],
      ['size',       'multi-PB archive'],
      ['license',    'CC BY-SA 3.0 IGO'],
    ],
  },
  {
    name: 'sentinel-2-cropland',
    span: '2015 → now',
    href: 'pages/datasets.html#sentinel-2',
    a: 'public/datasets/sentinel2-agriculture-iowa-a.webp',
    b: 'public/datasets/sentinel2-agriculture-iowa-b.webp',
    altA: 'Sentinel-2 RGB cropland, Iowa',
    altB: 'Sentinel-2 NDVI, crop vigor',
    meta: [
      ['source',     'Sentinel-2 L2A'],
      ['bands',      '13 (visible / NIR / SWIR)'],
      ['resolution', '10 m · 20 m · 60 m'],
      ['coverage',   'global · revisit 5 d'],
      ['size',       '~20 PB archive'],
      ['license',    'CC BY-SA 3.0 IGO'],
    ],
  },
  {
    name: 'sentinel-2-urban',
    span: '2015 → now',
    href: 'pages/datasets.html#sentinel-2',
    a: 'public/datasets/sentinel2-paris-urban-a.webp',
    b: 'public/datasets/sentinel2-paris-urban-b.webp',
    altA: 'Sentinel-2 RGB, Paris urban region',
    altB: 'Sentinel-2 NDVI, parks and canopy',
    meta: [
      ['source',     'Sentinel-2 L2A'],
      ['bands',      '13'],
      ['resolution', '10 m · 20 m · 60 m'],
      ['coverage',   'global · revisit 5 d'],
      ['size',       '~20 PB archive'],
      ['license',    'CC BY-SA 3.0 IGO'],
    ],
  },
  {
    name: 'sentinel-2-water',
    span: '2015 → now',
    href: 'pages/datasets.html#sentinel-2',
    a: 'public/datasets/sentinel2-water-bay-a.webp',
    b: 'public/datasets/sentinel2-water-bay-b.webp',
    altA: 'Sentinel-2 RGB, San Francisco Bay',
    altB: 'Sentinel-2 MNDWI water index',
    meta: [
      ['source',     'Sentinel-2 L2A + MNDWI derived'],
      ['bands',      '13 + computed index'],
      ['resolution', '10 m / 20 m'],
      ['coverage',   'coastal + inland waters'],
      ['size',       '~20 PB archive'],
      ['license',    'CC BY-SA 3.0 IGO'],
    ],
  },
];

function escAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function initDatasetQuery() {
  const root = document.querySelector('[data-ds-query]');
  if (!root) return;

  const screen = root.querySelector('[data-ds-screen]');
  const commandEl = root.querySelector('[data-ds-command]');
  const commentEl = root.querySelector('[data-ds-comment]');
  const resultsEl = root.querySelector('[data-ds-results]');
  const pathEl = root.querySelector('[data-ds-path]');
  const pageEl = root.querySelector('[data-ds-page]');
  if (!screen || !commandEl || !resultsEl) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const charMin = 22;
  const charMax = 46;
  const punctuationDelay = 80;
  const rowStagger = 110;

  const totalPages = Math.max(1, Math.ceil(DATASET_SAMPLES.length / DATASET_PAGE_SIZE));
  let pageIndex = 0;
  let advanceTimer = null;
  let typingTimers = [];
  let pausedByHover = false;

  function clearTimers() {
    if (advanceTimer) { window.clearTimeout(advanceTimer); advanceTimer = null; }
    typingTimers.forEach(window.clearTimeout);
    typingTimers = [];
  }

  function renderRow(item, idx, pageSize) {
    const head = `<div class="lp-ds-row-head">
      <span class="lp-ds-row-idx">[${idx + 1}/${pageSize}]</span>
      <a class="lp-ds-row-name" href="${escAttr(item.href || '#')}">${escHtml(item.name)}/</a>
      <span class="lp-ds-row-span">${escHtml(item.span)}</span>
    </div>`;
    const thumbs = `<div class="lp-ds-row-thumbs">
      <figure>
        <img src="${escAttr(item.a)}" alt="${escAttr(item.altA || item.name)}" loading="lazy" decoding="async">
        <figcaption>${escHtml(item.altA || '')}</figcaption>
      </figure>
      <figure>
        <img src="${escAttr(item.b)}" alt="${escAttr(item.altB || item.name)}" loading="lazy" decoding="async">
        <figcaption>${escHtml(item.altB || '')}</figcaption>
      </figure>
    </div>`;
    const meta = `<dl class="lp-ds-row-meta">${item.meta.map(([k, v]) => `
      <div><dt>${escHtml(k)}</dt><dd>${escHtml(v)}</dd></div>
    `).join('')}</dl>`;
    return `<article class="lp-ds-row" style="animation-delay:${reduceMotion ? 0 : idx * rowStagger}ms">
      ${head}
      <div class="lp-ds-row-body">${thumbs}${meta}</div>
    </article>`;
  }

  function renderPage(index) {
    const start = (index * DATASET_PAGE_SIZE) % DATASET_SAMPLES.length;
    const slice = [];
    for (let i = 0; i < DATASET_PAGE_SIZE; i += 1) {
      slice.push(DATASET_SAMPLES[(start + i) % DATASET_SAMPLES.length]);
    }
    if (pageEl) pageEl.textContent = `page ${index + 1}/${totalPages}`;
    resultsEl.innerHTML = slice.map((item, i) => renderRow(item, i, slice.length)).join('');
  }

  function typeOnce(text, target, onDone) {
    target.textContent = '';
    if (reduceMotion) { target.textContent = text; onDone(); return; }
    let i = 0;
    const tick = () => {
      if (i >= text.length) { onDone(); return; }
      const ch = text.charAt(i);
      target.textContent += ch;
      i += 1;
      const base = (ch === ' ' || ch === '-' || ch === '/' || ch === '.') ? punctuationDelay : (charMin + Math.random() * (charMax - charMin));
      typingTimers.push(window.setTimeout(tick, base));
    };
    tick();
  }

  function startCycle() {
    clearTimers();
    screen.classList.add('is-typing');
    typeOnce(DATASET_QUERY_COMMAND, commandEl, () => {
      screen.classList.remove('is-typing');
      if (commentEl) {
        commentEl.hidden = false;
        commentEl.textContent = `# ${DATASET_QUERY_COMMENT}`;
      }
      renderPage(pageIndex);
      scheduleNext();
    });
  }

  function scheduleNext() {
    if (advanceTimer) window.clearTimeout(advanceTimer);
    if (pausedByHover) return;
    advanceTimer = window.setTimeout(() => {
      pageIndex = (pageIndex + 1) % totalPages;
      renderPage(pageIndex);
      scheduleNext();
    }, DATASET_QUERY_REST);
  }

  root.addEventListener('mouseenter', () => {
    pausedByHover = true;
    if (advanceTimer) { window.clearTimeout(advanceTimer); advanceTimer = null; }
  });
  root.addEventListener('mouseleave', () => {
    pausedByHover = false;
    scheduleNext();
  });

  startCycle();
}

function initHeroStatsCountUp(root) {
  if (!root || root.dataset.counted === 'true') return;
  root.dataset.counted = 'true';
  const items = [...root.querySelectorAll('.lp-hero-stat')];
  if (!items.length) return;

  // Resolve final values: prefer live STATS, fall back to data-stat-default.
  items.forEach(item => {
    const key = item.dataset.statKey;
    const fallback = Number(item.dataset.statDefault) || 0;
    const live = statValue(key);
    item.dataset.statTarget = String(live || fallback);
    const label = item.querySelector('span')?.textContent || key;
    item.setAttribute('aria-label', `${Number(item.dataset.statTarget).toLocaleString()} ${label}`);
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    items.forEach(item => {
      const target = Number(item.dataset.statTarget);
      item.querySelector('[data-stat-value]').textContent = target.toLocaleString();
    });
    return;
  }

  const duration = 1500;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    items.forEach(item => {
      const target = Number(item.dataset.statTarget);
      const value = Math.round(target * eased);
      item.querySelector('[data-stat-value]').textContent = value.toLocaleString();
    });
    if (t < 1) requestAnimationFrame(step);
  }
  window.setTimeout(() => requestAnimationFrame(step), 500);
}
