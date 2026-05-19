import { LAYERS } from './data.js';

export function buildTree() {
  const el = document.getElementById('tree');
  let h = '<button class="tree-root" onclick="goHome()" title="Back to home">📁 geomind/</button>';

  LAYERS.forEach((L, i) => {
    const last  = i === LAYERS.length - 1;
    const br    = last ? '└─' : '├─';
    const cont  = last ? '&nbsp;&nbsp;&nbsp;' : '│&nbsp;&nbsp;';
    const click = L._sidebar ? `onclick="openTimeline()"` : `onclick="openLayer('${L.id}')"`;

    h += `<div class="tl" id="tl-${L.id}" style="--col:${L.col}">`;
    h += `<button class="tb" ${click}>`;
    h += `<span class="tbr">${br}</span><span class="tdot">◉</span>`;
    h += `<span class="tnm">${L.label}</span>`;
    h += `</button>`;

    const subs = L.subs || [];
    if (subs.length) {
      h += `<div class="tsubs">`;
      subs.forEach((s, si) => {
        const isLast = si === subs.length - 1;
        const sbr    = isLast ? `${cont}└─` : `${cont}├─`;
        if (typeof s === 'string') {
          h += `<button class="tsk" data-layer="${L.id}" data-idx="${si}" onclick="goToSub('${L.id}',${si})">`;
          h += `<span class="tbr">${sbr}</span><span class="tsn">${s}</span></button>`;
        } else {
          h += `<div class="tsk-grp">`;
          h += `<button class="tsk" data-layer="${L.id}" data-idx="${s.idx}" onclick="goToSub('${L.id}',${s.idx})">`;
          h += `<span class="tbr">${sbr}</span><span class="tsn">${s.n}</span></button>`;
          if (s.kids) {
            s.kids.forEach(k => {
              const kn = typeof k === 'string' ? k : k.n;
              const ki = typeof k === 'string' ? si : k.idx;
              h += `<button class="tsk tsk-kid" data-layer="${L.id}" data-idx="${ki}" onclick="goToSub('${L.id}',${ki})">`;
              h += `<span class="tbr">${cont}&nbsp;&nbsp;&nbsp;└─</span><span class="tsn">${kn}</span></button>`;
            });
          }
          h += `</div>`;
        }
      });
      h += `</div>`;
    }
    h += `</div>`;
  });

  el.innerHTML = h;
}

export function treeActivate(id) {
  document.querySelectorAll('.tl').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tsk').forEach(t => t.classList.remove('here'));
  if (id) document.getElementById(`tl-${id}`)?.classList.add('active');
}

export function treeSetSub(layerId, idx) {
  document.querySelectorAll('.tsk').forEach(t => t.classList.remove('here'));
  const tsk = document.querySelector(`.tsk[data-layer="${layerId}"][data-idx="${idx}"]`);
  if (tsk) {
    tsk.classList.add('here');
    tsk.scrollIntoView({block:'nearest', behavior:'smooth'});
  }
}
