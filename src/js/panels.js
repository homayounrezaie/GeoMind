import { LAYERS, LAYER_DESC } from './data.js';
import { treeActivate, treeSetSub } from './tree.js';

export let current = null;

const loaded = new Set();
const cache = {};

const homeView  = () => document.getElementById('home-view');
const panelView = () => document.getElementById('panel-view');
const activePb  = () => document.getElementById('active-pb');
const viewTitle = () => document.getElementById('panel-view-title');

/* Fetch and cache panel HTML — never touches the DOM */
async function loadPanel(id) {
  if (loaded.has(id)) return;
  try {
    const pagesIndex = window.location.pathname.indexOf('/pages/');
    const branchBase = pagesIndex === -1 ? './' : window.location.pathname.slice(0, pagesIndex + 1);
    const base = import.meta.env?.BASE_URL || branchBase;
    const res = await fetch(`${base}src/panels/${id}.html`);
    if (!res.ok) throw new Error(`Panel ${id} returned ${res.status}`);
    cache[id] = await res.text();
  } catch {
    cache[id] = '<div class="pb-loading">failed to load</div>';
  }
  loaded.add(id);
}

function showDesc(id) {
  const layer = LAYERS.find(l => l.id === id);
  const desc  = LAYER_DESC[id] || '';
  activePb().innerHTML = `
    <p class="layer-desc">${desc}</p>
    <button class="layer-explore-btn" onclick="exploreLayer('${id}')">Explore ${layer?.label || id} →</button>
  `;
}

function renderAll(id) {
  const pb = activePb();
  pb.innerHTML = cache[id] || '';
  pb.querySelectorAll('.sg').forEach(g => {
    const n = g.querySelectorAll('.tag').length;
    const c = g.querySelector('.cnt');
    if (c) c.textContent = n;
  });
}

function showPanelView(id) {
  homeView().style.display  = 'none';
  panelView().style.display = 'block';
  const layer = LAYERS.find(l => l.id === id);
  if (viewTitle()) viewTitle().textContent = layer?.label || id;
}

export async function openLayer(id) {
  try {
    if (current === id) { closeLayer(); return; }
    current = id;
    treeActivate(id);
    showPanelView(id);
    await loadPanel(id);
    renderAll(id);
    window.updateTermPrompt?.();
  } catch(e) {
    console.error('openLayer error:', e);
  }
}

export function closeLayer() {
  if (!current) return;
  current = null;
  treeActivate(null);
  panelView().style.display = 'none';
  homeView().style.display  = 'block';
  window.updateTermPrompt?.();
}

export function goHome() { closeLayer(); }

export async function exploreLayer(id) {
  if (!loaded.has(id)) await loadPanel(id);
  renderAll(id);
}

export async function goToSub(id, idx) {
  if (current !== id) {
    current = id;
    treeActivate(id);
    showPanelView(id);
  }
  if (!loaded.has(id)) {
    showDesc(id);
    await loadPanel(id);
    window.updateTermPrompt?.();
  }
  renderAll(id);
  const pb  = activePb();
  const sgs = [...pb.querySelectorAll('.sg')];
  if (!sgs[idx]) return;
  sgs.forEach((sg, i) => sg.style.display = i === idx ? '' : 'none');
  treeSetSub(id, idx);
  if (viewTitle()) {
    const layer = LAYERS.find(l => l.id === id);
    viewTitle().textContent = layer?.label || id;
  }
}

export function showOverview(id) { /* kept for search.js compat */ }
export function ensureOverview(id) { /* kept for compat */ }

export function openTimeline() {
  document.querySelectorAll('.tl').forEach(t => t.classList.remove('active'));
  document.getElementById('tl-timeline')?.classList.add('active');
  const sr = document.querySelector('.sidebar-right');
  if (sr) {
    sr.classList.remove('flash');
    requestAnimationFrame(() => sr.classList.add('flash'));
  }
}
