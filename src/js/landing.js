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
  await loadStats();
  initHeroStatsStream();
  initTerminalExplorer();
});

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

const STATS_DEFAULTS = { papers: 17409, models: 11090, datasets: 2790, companies: 4773 };
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
      if (item.statsKey && STATS[item.statsKey] != null) {
        const count = document.createElement('span');
        count.className = 'lp-terminal-row-count';
        count.textContent = `${formatStat(STATS[item.statsKey])} entries`;
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
  const el = document.querySelector('.lp-hero-stats');
  if (!el || el.dataset.streamed === 'true') return;
  el.dataset.streamed = 'true';

  const fromStats = `${formatStat(STATS.papers)} papers · ${formatStat(STATS.models)} models · ${formatStat(STATS.datasets)} datasets · ${formatStat(STATS.companies)} companies`;
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
