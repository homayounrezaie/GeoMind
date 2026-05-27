import { initLogoAnim } from './logo-anim.js';
import { openLayer, closeLayer, goHome, goToSub, openTimeline, showOverview, exploreLayer } from './panels.js';
import { initSearch } from './search.js';
import { initTerminal, toggleTerm, updateTermPrompt } from './terminal.js';
import { buildTree } from './tree.js';
import './theme.js';

/* Expose globals for inline onclick handlers */
window.openLayer        = openLayer;
window.closeLayer       = closeLayer;
window.goHome           = goHome;
window.goToSub          = goToSub;
window.openTimeline     = openTimeline;
window.showOverview     = showOverview;
window.exploreLayer     = exploreLayer;
window.toggleTerm       = toggleTerm;
window.updateTermPrompt = updateTermPrompt;


function setNavH() {
  const h = document.querySelector('.nav')?.offsetHeight || 52;
  document.documentElement.style.setProperty('--nav-h', h + 'px');
}

function initSidebarResize() {
  const handle  = document.getElementById('sidebar-resize');
  const sidebar = handle?.closest('.sidebar');
  if (!handle || !sidebar) return;

  const MIN = 180, MAX = 480;
  const saved = parseInt(localStorage.getItem('gm-sidebar-w'));
  if (saved >= MIN && saved <= MAX) setSidebarW(saved);

  function setSidebarW(w) {
    document.documentElement.style.setProperty('--sidebar-w', w + 'px');
  }

  let startX = 0, startW = 0, dragging = false;

  handle.addEventListener('mousedown', e => {
    dragging = true;
    startX = e.clientX;
    startW = sidebar.offsetWidth;
    handle.classList.add('dragging');
    document.body.classList.add('sidebar-dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const w = Math.max(MIN, Math.min(MAX, startW + e.clientX - startX));
    setSidebarW(w);
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.classList.remove('sidebar-dragging');
    localStorage.setItem('gm-sidebar-w', sidebar.offsetWidth);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setNavH();
  window.addEventListener('resize', setNavH);
  initSearch();
  initTerminal();
  initLogoAnim();
  initSidebarResize();
  buildTree();
  window.sidebarTab(localStorage.getItem('gm-sidebar-tab') || 'term');
});
