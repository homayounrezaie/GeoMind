import { LAYERS, TERM_DESC } from './data.js';
import { openLayer, closeLayer, openTimeline } from './panels.js';

let termOpen  = false;
let termHist  = [];
let termHistI = -1;

/* ── Helpers ─────────────────────────────── */

function getOut() { return document.getElementById('term-out'); }

function scrollBottom() {
  const out = getOut();
  requestAnimationFrame(() => { out.scrollTop = out.scrollHeight; });
}

/* Append a static output line (before active prompt) */
function tp(text, cls) {
  const out = getOut();
  const d = document.createElement('div');
  d.className = 'tl' + (cls ? ' ' + cls : '');
  d.textContent = text;
  const active = document.getElementById('term-active');
  if (active) out.insertBefore(d, active);
  else out.appendChild(d);
  scrollBottom();
}

/* Append a suggestion line AFTER the active prompt row */
function tpSuggest(text) {
  const out = getOut();
  /* Remove any previous suggestion */
  out.querySelectorAll('.term-suggest').forEach(el => el.remove());
  if (!text) return;
  const d = document.createElement('div');
  d.className = 'tl dim term-suggest';
  d.textContent = text;
  const active = document.getElementById('term-active');
  if (active) active.after(d);
  else out.appendChild(d);
  scrollBottom();
}

/* ── Inline prompt row ───────────────────── */

const COMMANDS = ['ls', 'cd', 'pwd', 'search', 'clear', 'help'];

function tabComplete(input) {
  const trimmed = input.trimStart();
  const hasTrailingSpace = input.endsWith(' ');
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (!parts.length) return input;

  const cmd = parts[0].toLowerCase();
  const arg = parts[1] || '';
  const layerIds = [...new Set(LAYERS.map(l => l.id))];

  /* "cd " or "ls " with nothing after — show all layers below prompt */
  if ((cmd === 'cd' || cmd === 'ls') && parts.length === 1 && hasTrailingSpace) {
    tpSuggest(layerIds.join('  '));
    return input;
  }

  /* Complete command name */
  if (parts.length === 1 && !hasTrailingSpace) {
    const matches = COMMANDS.filter(c => c.startsWith(cmd));
    if (matches.length === 1) { tpSuggest(''); return matches[0] + ' '; }
    if (matches.length > 1) tpSuggest(matches.join('  '));
    return input;
  }

  /* Complete layer name after cd / ls */
  if (cmd === 'cd' || cmd === 'ls') {
    const matches = layerIds.filter(id => id.startsWith(arg.toLowerCase()));
    if (matches.length === 1) { tpSuggest(''); return `${cmd} ${matches[0]}`; }
    if (matches.length > 1) tpSuggest(matches.join('  '));
    else tpSuggest('no match');
    return input;
  }

  return input;
}

function getPromptText() {
  return new Promise(resolve => {
    import('./panels.js').then(m => {
      resolve(m.current ? `geomind:~/${m.current}$` : 'geomind:~$');
    });
  });
}

function createActiveRow(promptText) {
  const out = getOut();
  const row = document.createElement('div');
  row.id = 'term-active';
  row.className = 'term-active-row';

  const prompt = document.createElement('span');
  prompt.id = 'term-prompt';
  prompt.className = 'tl cmd';
  prompt.textContent = promptText;

  const inp = document.createElement('input');
  inp.id = 'term-input';
  inp.type = 'text';
  inp.autocomplete = 'off';
  inp.spellcheck = false;

  row.appendChild(prompt);
  row.appendChild(inp);
  out.appendChild(row);
  scrollBottom();

  inp.addEventListener('input', () => tpSuggest(''));

  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      tpSuggest('');
      const val = inp.value;
      row.remove();
      if (val.trim()) {
        const line = document.createElement('div');
        line.className = 'tl cmd';
        line.textContent = `${prompt.textContent} ${val}`;
        out.appendChild(line);
      }
      runCmd(val);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      inp.value = tabComplete(inp.value);
    } else if (e.key === 'Escape') {
      tpSuggest('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (termHistI < termHist.length - 1) inp.value = termHist[++termHistI];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      inp.value = termHistI > 0 ? termHist[--termHistI] : (termHistI = -1, '');
    }
  });

  return inp;
}

async function appendPrompt() {
  const text = await getPromptText();
  const inp = createActiveRow(text);
  inp.focus();
  scrollBottom();
}

/* ── Public: update prompt text ──────────── */

export function updateTermPrompt() {
  getPromptText().then(text => {
    const p = document.getElementById('term-prompt');
    if (p) p.textContent = text;
  });
}

/* ── Public: toggle ──────────────────────── */

export function toggleTerm() {
  termOpen = !termOpen;
  if (window.sidebarTab) window.sidebarTab(termOpen ? 'term' : 'tree');
  if (termOpen) document.getElementById('term-input')?.focus();
}

/* ── Command helpers ─────────────────────── */

function findLayer(arg) {
  if (!arg) return null;
  const a = arg.toLowerCase().trim();
  return LAYERS.find(l =>
    l.id === a ||
    l.label === a ||
    l.label.includes(a) ||
    l.id.startsWith(a) ||
    parseInt(a) === parseInt(l.label)
  ) || null;
}

function listSubs(id) {
  const layer = LAYERS.find(l => l.id === id);
  const subs = layer?.subs || [];
  if (!subs.length) { tp('(no sub-sections)', 'dim'); return; }
  const flat = [];
  subs.forEach(s => {
    if (typeof s === 'string') flat.push(s);
    else { flat.push(s.n + '/'); (s.kids||[]).forEach(k => flat.push('  ' + (typeof k==='string'?k:k.n))); }
  });
  flat.forEach((s, i) => tp(`${i === flat.length-1 ? '└─' : '├─'} ${s}`, ''));
}

function cmdLs(arg) {
  if (arg) {
    const id = findLayer(arg)?.id;
    if (!id) { tp(`ls: no such layer: ${arg}`, 'err'); return; }
    listSubs(id);
  } else {
    import('./panels.js').then(m => {
      if (m.current) {
        listSubs(m.current);
      } else {
        LAYERS.forEach(l => tp(l.label + '/', l.id === m.current ? 'acc' : ''));
      }
    });
  }
}

function cmdCd(arg) {
  if (!arg || arg === '~') {
    import('./panels.js').then(m => { if (m.current) closeLayer(); });
    tp('~/geomind', 'dim');
    return;
  }
  if (arg === '..') {
    import('./panels.js').then(m => {
      if (m.current) { closeLayer(); tp('← ~/geomind', 'dim'); }
      else tp('already at root', 'warn');
    });
    return;
  }
  const layer = findLayer(arg);
  if (!layer) {
    tp(`cd: no such layer: ${arg}`, 'err');
    tp("run 'ls' to see available layers", 'dim');
    return;
  }
  if (layer._sidebar) {
    openTimeline();
    tp(`→ ~/geomind/timeline`, 'acc');
    return;
  }
  openLayer(layer.id);
  tp(`→ ~/geomind/${layer.id}/`, 'acc');
  tp(`  ${TERM_DESC[layer.id] || ''}`, 'dim');
}

function cmdPwd() {
  import('./panels.js').then(m => {
    tp(m.current ? `~/geomind/${m.current}` : '~/geomind', 'hi');
  });
}

function cmdSearch(arg) {
  if (!arg) {
    tp('usage: search [query]', 'dim');
    return;
  }
  const searchEl = document.getElementById('search');
  if (!searchEl) {
    tp('search is not available here', 'err');
    return;
  }
  searchEl.value = arg;
  searchEl.dispatchEvent(new Event('input', { bubbles: true }));
  searchEl.focus();
  tp(`searching: ${arg}`, 'acc');
}

function cmdHelp() {
  tp('', '');
  tp('  COMMAND          DESCRIPTION', 'dim');
  tp('  ───────────────────────────────────────────────────', 'dim');
  tp('  ls               list all layers', '');
  tp('  ls [layer]       list sub-sections of a layer', '');
  tp('  cd [layer]       navigate into a layer', '');
  tp('  cd ..            go back to root', '');
  tp('  pwd              print current location', '');
  tp('  search [query]   search across all layers', '');
  tp('  clear            clear the terminal', '');
  tp('  help             show this message', '');
  tp('', '');
  tp('  Layer names are fuzzy — try: cd data, cd 3, cd models', 'dim');
}

function runCmd(raw) {
  const input = raw.trim();
  termHistI = -1;
  if (input) termHist.unshift(input);

  const out = getOut();

  if (!input) { appendPrompt(); return; }

  import('./panels.js').then(m => {
    const [cmd, ...rest] = input.split(/\s+/);
    const arg = rest.join(' ').toLowerCase();
    switch (cmd.toLowerCase()) {
      case 'ls':    cmdLs(arg);  break;
      case 'cd':    cmdCd(arg);  break;
      case 'pwd':   cmdPwd();    break;
      case 'search': cmdSearch(arg); break;
      case 'clear':
        out.innerHTML = '';
        appendPrompt();
        return;
      case 'help':  cmdHelp();   break;
      default:
        tp(`command not found: ${cmd}`, 'err');
        tp("type 'help' for available commands", 'dim');
    }
    tp('', '');
    appendPrompt();
  });
}

/* ── Init ────────────────────────────────── */

export function initTerminal() {
  const term = document.getElementById('term');
  const out  = document.getElementById('term-out');
  if (!term || !out) return;

  termOpen = true;
  appendPrompt();

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === '`') { e.preventDefault(); toggleTerm(); }
  });

  out.addEventListener('click', () => {
    document.getElementById('term-input')?.focus();
  });

  const resizeTop = document.getElementById('term-resize-top');
  if (!resizeTop) return;
  let startY = 0, startH = 0, dragging = false;

  function maxTermH() {
    const sidebar = document.querySelector('.sidebar');
    return sidebar ? sidebar.offsetHeight : window.innerHeight * 0.95;
  }

  function startDrag(y) {
    dragging = true; startY = y; startH = term.offsetHeight;
    resizeTop.classList.add('dragging');
    document.body.classList.add('term-dragging');
  }
  function moveDrag(y) {
    if (!dragging) return;
    const delta = y - startY; /* drag down = bigger */
    const newH = Math.max(140, Math.min(maxTermH(), startH + delta));
    term.style.height = newH + 'px';
  }
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    resizeTop.classList.remove('dragging');
    document.body.classList.remove('term-dragging');
  }

  resizeTop.addEventListener('mousedown', e => { startDrag(e.clientY); e.preventDefault(); });
  document.addEventListener('mousemove', e => moveDrag(e.clientY));
  document.addEventListener('mouseup', endDrag);

  resizeTop.addEventListener('touchstart', e => { startDrag(e.touches[0].clientY); }, {passive:true});
  document.addEventListener('touchmove', e => { moveDrag(e.touches[0].clientY); }, {passive:true});
  document.addEventListener('touchend', endDrag);
}
