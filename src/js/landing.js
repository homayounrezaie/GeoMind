/* Landing page script — no ES modules, no dependencies */

function go() {
  window.location.href = 'pages/app.html';
}

window.go = go;

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

/* ── Radial infographic ───────────────────── */
function initRadial() {
  const wrap = document.getElementById('lp-radial-wrap');
  if (!wrap) return;

  const W = 800, H = 800, cx = 400, cy = 400;
  const R  = 270;
  const NR = 38;
  const N  = 13;

  const LAYERS = [
    {num:'01', name:'Earth Data',           desc:'sensors, formats, catalogs',
     detail:'Raw material for every geo model. Covers sensor types (optical, SAR, LiDAR), cloud-native formats (COG, GeoParquet, Zarr), spatial indexing (H3, S2), and embedding products like Clay and GeoCLIP.'},
    {num:'02', name:'Learning Paradigms',   desc:'supervised, self-supervised',
     detail:'How a model learns from data. Supervised needs labels; self-supervised does not. Also covers few-shot, active learning, and reinforcement learning — the most consequential design decision in any pipeline.'},
    {num:'03', name:'AI History',           desc:'1990s to today',
     detail:'The arc from classical ML through CNNs and Transformers to foundation models and agentic AI. Understanding the timeline shows why each new model is foundational or incremental.'},
    {num:'04', name:'Model Architectures',  desc:'CNNs, ViTs, foundation',
     detail:'Three paradigms: statistical (kriging, Gaussian processes), AI/ML (from random forests through ViTs and foundation models), and physics-based (radiative transfer, hydrology). Most production systems combine all three.'},
    {num:'05', name:'Techniques',           desc:'attention, quantization',
     detail:'Methods that make models work — training strategies, fine-tuning, multimodal fusion, quantization for edge deployment, and evaluation metrics specific to geospatial tasks.'},
    {num:'06', name:'Tasks / Applications', desc:'segmentation, detection',
     detail:'The full Geo AGI task spectrum: pixel-level segmentation, object detection, scene understanding, geolocalization, 3D reconstruction, temporal change detection, and generative synthesis.'},
    {num:'07', name:'Datasets',             desc:'optical, SAR, lidar',
     detail:'Training data and benchmarks the field has standardised around — EO datasets from Sentinel and Landsat, DOTA and xView for detection, change detection suites, VLM evaluation sets, and major competitions.'},
    {num:'08', name:'Tools & Stack',        desc:'compute, deployment',
     detail:'Infrastructure for running geospatial AI — compute platforms, Python and R libraries, MLOps tooling, model deployment frameworks, spatial databases, vector stores, and GIS visualisation tools.'},
    {num:'09', name:'Sensors & Satellites', desc:'optical, SAR, weather',
     detail:'Orbital infrastructure feeding geospatial AI — free open missions (Sentinel, Landsat), commercial high-res optical and SAR constellations, hyperspectral, and weather satellites.'},
    {num:'10', name:'Companies',            desc:'startups, providers',
     detail:'The geospatial AI ecosystem — satellite data providers, drone manufacturers, cloud and compute platforms, GeoAI startups, and the open source community (6,500+ organisations tracked).'},
    {num:'11', name:'Standards',            desc:'OGC, STAC, COG',
     detail:'Interoperability layer — cloud-native formats (COG, STAC, GeoParquet), OGC service protocols (WMS/WFS/OGC API), metadata schemas (ISO 19115, INSPIRE), and coordinate reference systems.'},
    {num:'12', name:'Learning Path',        desc:'courses, books, podcasts',
     detail:'A curated path from first principles to research-level mastery — structured courses and MOOCs, essential books, hands-on tutorials, competitions to test your skills, and communities where the work happens.'},
    {num:'13', name:'Job Board',            desc:'full-time, remote, research',
     detail:'Open roles across the geospatial AI industry — full-time positions, contracts, internships, and research roles at satellite companies, GeoAI startups, cloud platforms, and research institutions.'},
  ];

  /* Tech-AI palette — cool indigo/blue/cyan family, no warm tones */
  const COLORS = [
    '#6366F1','#7C6AF7','#8B5CF6','#7C3AED',
    '#5B21B6','#4F46E5','#4338CA','#3B82F6',
    '#2563EB','#0EA5E9','#06B6D4','#0891B2','#818CF8',
  ];

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  /* Defs */
  const defs = document.createElementNS(ns, 'defs');

  /* Glow filter */
  const filt = document.createElementNS(ns, 'filter');
  filt.setAttribute('id', 'glow');
  filt.setAttribute('x', '-50%'); filt.setAttribute('y', '-50%');
  filt.setAttribute('width', '200%'); filt.setAttribute('height', '200%');
  const feBlur = document.createElementNS(ns, 'feGaussianBlur');
  feBlur.setAttribute('stdDeviation', '6'); feBlur.setAttribute('result', 'blur');
  const feMerge = document.createElementNS(ns, 'feMerge');
  const feMergeNode1 = document.createElementNS(ns, 'feMergeNode');
  feMergeNode1.setAttribute('in', 'blur');
  const feMergeNode2 = document.createElementNS(ns, 'feMergeNode');
  feMergeNode2.setAttribute('in', 'SourceGraphic');
  feMerge.appendChild(feMergeNode1); feMerge.appendChild(feMergeNode2);
  filt.appendChild(feBlur); filt.appendChild(feMerge);
  defs.appendChild(filt);

  LAYERS.forEach((_, i) => {
    const col = COLORS[i];
    const rg = document.createElementNS(ns, 'radialGradient');
    rg.setAttribute('id', `ng${i}`);
    rg.setAttribute('cx', '40%'); rg.setAttribute('cy', '35%'); rg.setAttribute('r', '65%');
    const r0 = document.createElementNS(ns, 'stop');
    r0.setAttribute('offset', '0%'); r0.setAttribute('stop-color', col); r0.setAttribute('stop-opacity', '0.55');
    const r1 = document.createElementNS(ns, 'stop');
    r1.setAttribute('offset', '100%'); r1.setAttribute('stop-color', col); r1.setAttribute('stop-opacity', '0.15');
    rg.appendChild(r0); rg.appendChild(r1);
    defs.appendChild(rg);
  });
  svg.appendChild(defs);

  /* Orbit ring — base dashes, slow rotation applied in tick */
  const ring = document.createElementNS(ns, 'circle');
  ring.setAttribute('cx', cx); ring.setAttribute('cy', cy); ring.setAttribute('r', R);
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', 'rgba(255,255,255,0.07)');
  ring.setAttribute('stroke-width', '1');
  ring.setAttribute('stroke-dasharray', '3 8');
  svg.appendChild(ring);

  const C_RING = 2 * Math.PI * R;

  /* Single traveling dash on the ring — slightly inside so it clears the node circles */
  const DASH_R   = R - 14;             /* inside the node circles */
  const C_DASH   = 2 * Math.PI * DASH_R;
  const DASH_LEN = C_DASH / N * 0.45; /* short bright dash */

  const traveler = document.createElementNS(ns, 'circle');
  traveler.setAttribute('cx', cx); traveler.setAttribute('cy', cy); traveler.setAttribute('r', DASH_R);
  traveler.setAttribute('fill', 'none');
  traveler.setAttribute('stroke-width', '2.5');
  traveler.setAttribute('stroke-linecap', 'round');
  traveler.setAttribute('stroke-dasharray', `${DASH_LEN} ${C_DASH - DASH_LEN}`);
  traveler.setAttribute('stroke-dashoffset', '0');
  svg.appendChild(traveler);

  /* Center info panel */
  const infoG = document.createElementNS(ns, 'g');
  infoG.setAttribute('pointer-events', 'none');

  const infoNum = document.createElementNS(ns, 'text');
  infoNum.setAttribute('x', cx); infoNum.setAttribute('y', cy - 52);
  infoNum.setAttribute('text-anchor', 'middle');
  infoNum.setAttribute('font-size', '10'); infoNum.setAttribute('font-weight', '700');
  infoNum.setAttribute('font-family', "'SF Mono','Menlo',monospace");
  infoNum.setAttribute('letter-spacing', '0.1em');

  const infoName = document.createElementNS(ns, 'text');
  infoName.setAttribute('x', cx); infoName.setAttribute('y', cy - 30);
  infoName.setAttribute('text-anchor', 'middle');
  infoName.setAttribute('font-size', '16'); infoName.setAttribute('font-weight', '800');
  infoName.setAttribute('font-family', "-apple-system,'Segoe UI',sans-serif");
  infoName.setAttribute('fill', 'rgba(255,255,255,0.92)');

  const infoDesc = document.createElementNS(ns, 'text');
  infoDesc.setAttribute('x', cx); infoDesc.setAttribute('y', cy - 10);
  infoDesc.setAttribute('text-anchor', 'middle');
  infoDesc.setAttribute('font-size', '10'); infoDesc.setAttribute('font-weight', '500');
  infoDesc.setAttribute('font-family', "-apple-system,'Segoe UI',sans-serif");
  infoDesc.setAttribute('fill', 'rgba(255,255,255,0.4)');
  infoDesc.setAttribute('letter-spacing', '0.04em');

  /* Wrap detail text into multiple tspan lines */
  function setDetail(el, text, x, startY, maxW, lineH) {
    while (el.firstChild) el.removeChild(el.firstChild);
    const words = text.split(' ');
    let line = '', lineNum = 0;
    const dummy = document.createElementNS(ns, 'text');
    dummy.setAttribute('font-size', '10');
    dummy.style.visibility = 'hidden';
    svg.appendChild(dummy);
    words.forEach((w, wi) => {
      const test = line ? line + ' ' + w : w;
      dummy.textContent = test;
      if (dummy.getComputedTextLength && dummy.getComputedTextLength() > maxW && line) {
        const ts = document.createElementNS(ns, 'tspan');
        ts.setAttribute('x', x); ts.setAttribute('dy', lineNum === 0 ? 0 : lineH);
        ts.textContent = line;
        el.appendChild(ts);
        line = w; lineNum++;
      } else { line = test; }
      if (wi === words.length - 1) {
        const ts = document.createElementNS(ns, 'tspan');
        ts.setAttribute('x', x); ts.setAttribute('dy', lineNum === 0 ? 0 : lineH);
        ts.textContent = line;
        el.appendChild(ts);
      }
    });
    svg.removeChild(dummy);
  }

  const infoDetail = document.createElementNS(ns, 'text');
  infoDetail.setAttribute('x', cx); infoDetail.setAttribute('y', cy + 14);
  infoDetail.setAttribute('text-anchor', 'middle');
  infoDetail.setAttribute('font-size', '10');
  infoDetail.setAttribute('font-family', "-apple-system,'Segoe UI',sans-serif");
  infoDetail.setAttribute('fill', 'rgba(255,255,255,0.28)');

  infoG.appendChild(infoNum);
  infoG.appendChild(infoName);
  infoG.appendChild(infoDesc);
  infoG.appendChild(infoDetail);
  svg.appendChild(infoG);

  /* Build nodes */
  const glowCircles = [], mainCircles = [], nodeGroups = [], labelGroups = [];
  const nodeAngles = [];

  LAYERS.forEach((layer, i) => {
    const a = -Math.PI / 2 + i * (2 * Math.PI / N);
    nodeAngles.push(a);
    const ca = Math.cos(a), sa = Math.sin(a);
    const nx = cx + R * ca, ny = cy + R * sa;

    /* Glow ring (behind) */
    const gl = document.createElementNS(ns, 'circle');
    gl.setAttribute('cx', nx); gl.setAttribute('cy', ny); gl.setAttribute('r', NR);
    gl.setAttribute('fill', 'none');
    gl.setAttribute('stroke', COLORS[i]); gl.setAttribute('stroke-width', '0');
    gl.setAttribute('stroke-opacity', '0');
    gl.setAttribute('filter', 'url(#glow)');
    svg.appendChild(gl);
    glowCircles.push(gl);

    const g = document.createElementNS(ns, 'g');
    g.style.cursor = 'default';

    const circ = document.createElementNS(ns, 'circle');
    circ.setAttribute('cx', nx); circ.setAttribute('cy', ny); circ.setAttribute('r', NR);
    circ.setAttribute('fill', 'rgba(255,255,255,0.04)');
    circ.setAttribute('stroke', 'rgba(255,255,255,0.15)'); circ.setAttribute('stroke-opacity', '1'); circ.setAttribute('stroke-width', '1');
    g.appendChild(circ);
    mainCircles.push(circ);

    const num = document.createElementNS(ns, 'text');
    num.setAttribute('x', nx); num.setAttribute('y', ny - 5);
    num.setAttribute('text-anchor', 'middle'); num.setAttribute('fill', 'rgba(255,255,255,0.3)');
    num.setAttribute('font-size', '9'); num.setAttribute('font-weight', '700');
    num.setAttribute('font-family', "'SF Mono','Menlo',monospace");
    num.setAttribute('letter-spacing', '0.06em');
    num.textContent = layer.num;
    g.appendChild(num);

    const nm = document.createElementNS(ns, 'text');
    nm.setAttribute('x', nx); nm.setAttribute('y', ny + 8);
    nm.setAttribute('text-anchor', 'middle'); nm.setAttribute('fill', 'rgba(255,255,255,0.25)');
    nm.setAttribute('font-size', '8.5'); nm.setAttribute('font-weight', '600');
    nm.setAttribute('font-family', "-apple-system,'Segoe UI',sans-serif");
    nm.textContent = layer.name.split(' ')[0];
    g.appendChild(nm);

    svg.appendChild(g);
    nodeGroups.push(g);

    /* External label */
    const LABEL_GAP = NR + 14;
    const lx = nx + LABEL_GAP * ca, ly = ny + LABEL_GAP * sa;
    const anchor = ca > 0.2 ? 'start' : ca < -0.2 ? 'end' : 'middle';

    const lg = document.createElementNS(ns, 'g');
    lg.style.cursor = 'default';

    const ln = document.createElementNS(ns, 'text');
    ln.setAttribute('x', lx); ln.setAttribute('y', ly);
    ln.setAttribute('text-anchor', anchor); ln.setAttribute('fill', 'rgba(255,255,255,0.22)');
    ln.setAttribute('font-size', '11'); ln.setAttribute('font-weight', '700');
    ln.setAttribute('font-family', "-apple-system,'Segoe UI',sans-serif");
    ln.textContent = layer.name;
    lg.appendChild(ln);

    const ld = document.createElementNS(ns, 'text');
    ld.setAttribute('x', lx); ld.setAttribute('y', ly + 14);
    ld.setAttribute('text-anchor', anchor); ld.setAttribute('fill', 'rgba(255,255,255,0.1)');
    ld.setAttribute('font-size', '9'); ld.setAttribute('font-family', "-apple-system,'Segoe UI',sans-serif");
    ld.textContent = layer.desc;
    lg.appendChild(ld);

    svg.appendChild(lg);
    labelGroups.push(lg);
  });


  wrap.appendChild(svg);

  /* ── Store original text positions after DOM is attached ── */
  nodeGroups.forEach((g, i) => {
    g.querySelectorAll('text').forEach(t => {
      t._ox = parseFloat(t.getAttribute('x'));
      t._oy = parseFloat(t.getAttribute('y'));
    });
  });

  /* ── Animation state ── */
  const CYCLE = 3000;
  const GROW  = 12;
  const SHIFT = 7;
  let activeIdx  = 0;
  let animStart  = performance.now();
  let paused     = false;
  let pausedAt   = 0;
  let hoveredIdx = -1;
  let ringRot    = 0;
  let dashFrac   = 0;       /* 0..1 traveler position around ring */
  let infoOpacity = 1;
  let fadingOut = false;
  let pendingIdx = -1;

  /* ease curves */
  function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  function updateInfo(i) {
    const layer = LAYERS[i];
    const col = COLORS[i];
    infoNum.textContent = layer.num;
    infoNum.setAttribute('fill', col);
    infoName.textContent = layer.name;
    infoDesc.textContent = layer.desc.toUpperCase();
    setDetail(infoDetail, layer.detail, cx, cy + 14, 190, 15);
    infoG.setAttribute('opacity', '1');
    infoOpacity = 1;
  }

  function jumpTo(i) {
    activeIdx = i;
    dashFrac  = i / N;
    animStart = performance.now();
    updateInfo(i);
  }

  /* Hover interaction */
  nodeGroups.forEach((g, i) => {
    g.addEventListener('mouseenter', () => {
      hoveredIdx = i;
      paused = true;
      jumpTo(i);
    });
    g.addEventListener('mouseleave', () => {
      hoveredIdx = -1;
      paused = false;
      animStart = performance.now() - activeIdx * CYCLE; /* resume from current node */
    });
  });

  updateInfo(0);

  function tick(ts) {
    requestAnimationFrame(tick);

    const elapsed = paused ? pausedAt : ts - animStart;
    if (!paused) pausedAt = elapsed;
    const phase = (elapsed % CYCLE) / CYCLE;

    /* ── Orbit ring slow rotation ── */
    ringRot += 0.012;
    ring.setAttribute('transform', `rotate(${ringRot} ${cx} ${cy})`);

    /* ── Traveling dash: moves continuously, triggers active node when it arrives ── */
    if (!paused) {
      /* advance dashFrac toward next node at steady pace */
      const target = (activeIdx / N);
      let diff = target - dashFrac;
      if (diff < 0) diff += 1;
      /* if very close, snap and move on */
      dashFrac += Math.max(diff * 0.04, 0.0008);
      if (dashFrac >= 1) dashFrac -= 1;
    }

    /* which node is dashFrac closest to? */
    const nearestIdx = Math.round(dashFrac * N) % N;
    const col = COLORS[activeIdx];

    /* SVG stroke starts at 3 o'clock; nodes start at 12 o'clock (−C_DASH/4) */
    const dashPos = dashFrac * C_DASH - C_DASH / 4;
    const dashOffset = -((dashPos % C_DASH + C_DASH) % C_DASH);
    traveler.setAttribute('stroke-dashoffset', dashOffset);
    traveler.setAttribute('stroke', col);

    /* activate node when traveler arrives within one slot */
    const slotFrac = 1 / N;
    const targetFrac = activeIdx / N;
    let arrivalDiff = dashFrac - targetFrac;
    if (arrivalDiff > 0.5) arrivalDiff -= 1;
    if (arrivalDiff < -0.5) arrivalDiff += 1;
    if (Math.abs(arrivalDiff) < slotFrac * 0.15 && !paused) {
      const nextIdx = (activeIdx + 1) % N;
      if (nearestIdx === nextIdx) {
        activeIdx = nextIdx;
        updateInfo(activeIdx);
      }
    }

    /* animate each node */
    mainCircles.forEach((c, i) => {
      const a  = nodeAngles[i];
      const ca = Math.cos(a), sa = Math.sin(a);
      const nx = cx + R * ca, ny = cy + R * sa;

      const isActive = i === activeIdx;
      const col = COLORS[i];
      const p = isActive ? easeInOut(phase < 0.5 ? phase * 2 : (1 - phase) * 2) : 0;
      const grow  = GROW * p;
      const shift = SHIFT * p;
      const dx = ca * shift, dy = sa * shift;

      c.setAttribute('r', NR + grow);
      c.setAttribute('cx', nx + dx); c.setAttribute('cy', ny + dy);

      if (isActive) {
        c.setAttribute('fill', `url(#ng${i})`);
        c.setAttribute('stroke', col);
        c.setAttribute('stroke-opacity', 0.5 + 0.45 * p);
        c.setAttribute('stroke-width', 1 + 2.5 * p);
        /* number text */
        nodeGroups[i].querySelector('text').setAttribute('fill', col);
        /* name text */
        nodeGroups[i].querySelectorAll('text')[1].setAttribute('fill', 'rgba(255,255,255,0.9)');
        /* external label */
        labelGroups[i].querySelectorAll('text')[0].setAttribute('fill', 'rgba(255,255,255,0.9)');
        labelGroups[i].querySelectorAll('text')[1].setAttribute('fill', 'rgba(255,255,255,0.45)');
      } else {
        c.setAttribute('fill', 'rgba(255,255,255,0.04)');
        c.setAttribute('stroke', 'rgba(255,255,255,0.15)');
        c.setAttribute('stroke-opacity', '1');
        c.setAttribute('stroke-width', '1');
        nodeGroups[i].querySelector('text').setAttribute('fill', 'rgba(255,255,255,0.3)');
        nodeGroups[i].querySelectorAll('text')[1].setAttribute('fill', 'rgba(255,255,255,0.25)');
        labelGroups[i].querySelectorAll('text')[0].setAttribute('fill', 'rgba(255,255,255,0.22)');
        labelGroups[i].querySelectorAll('text')[1].setAttribute('fill', 'rgba(255,255,255,0.1)');
      }

      glowCircles[i].setAttribute('cx', nx + dx); glowCircles[i].setAttribute('cy', ny + dy);
      glowCircles[i].setAttribute('stroke', col);
      glowCircles[i].setAttribute('stroke-width',   isActive ? 22 * p : 0);
      glowCircles[i].setAttribute('stroke-opacity', isActive ? 0.3 * p : 0);

      /* shift text with node */
      nodeGroups[i].querySelectorAll('text').forEach(t => {
        if (t._ox !== undefined) {
          t.setAttribute('x', t._ox + dx);
          t.setAttribute('y', t._oy + dy);
        }
      });
    });
  }

  requestAnimationFrame(tick);
}

/* ── Feature panel switcher ──────────────────── */
function initFeatSwitcher() {
  const rows   = document.querySelectorAll('.lp-feat2');
  const vizs   = document.querySelectorAll('.lp-viz');
  let current  = 0;
  let autoTimer = null;
  const DURATIONS = [5000, 0, 5000, 0]; /* CLI=1 and Search=3 drive themselves via onDone */
  const started  = {};

  function scheduleNext() {
    clearTimeout(autoTimer);
    if (DURATIONS[current] === 0) return;
    autoTimer = setTimeout(() => {
      switchTo((current + 1) % 4);
      scheduleNext();
    }, DURATIONS[current]);
  }

  function switchTo(idx) {
    rows.forEach(r  => r.classList.toggle('active', +r.dataset.feat === idx));
    vizs.forEach(v  => v.classList.toggle('active', +v.dataset.viz  === idx));
    current = idx;
    if (!started[idx]) {
      started[idx] = true;
      if (idx === 0) initMapTree();
      else if (idx === 1) initDemoTerm(() => { switchTo(2); scheduleNext(); });
      else if (idx === 2) initTimelineViz();
      else if (idx === 3) initSearchViz(() => { switchTo(0); scheduleNext(); });
    }
  }

  rows.forEach(r => {
    r.addEventListener('click', () => {
      switchTo(+r.dataset.feat);
      scheduleNext();
    });
  });

  switchTo(0);
  scheduleNext();
}

/* ── Knowledge Map mini radial ───────────────── */
function initMapViz() {
  const wrap = document.getElementById('lpMapViz');
  if (!wrap) return;
  const W = 340, H = 360, cx = 170, cy = 180, R = 130, NR = 22, N = 13;
  const LAYERS = ['Earth Data','Learning','AI History','Models','Techniques',
    'Tasks','Datasets','Tools','Satellites','Companies','Standards','Learning Path','Jobs'];
  const COLORS = ['#6366F1','#7C6AF7','#8B5CF6','#7C3AED','#5B21B6','#4F46E5',
    '#4338CA','#3B82F6','#2563EB','#0EA5E9','#06B6D4','#0891B2','#818CF8'];

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);

  /* orbit ring */
  const ring = document.createElementNS(ns,'circle');
  ring.setAttribute('cx',cx);ring.setAttribute('cy',cy);ring.setAttribute('r',R);
  ring.setAttribute('fill','none');ring.setAttribute('stroke','rgba(255,255,255,0.06)');
  ring.setAttribute('stroke-width','1');ring.setAttribute('stroke-dasharray','3 5');
  svg.appendChild(ring);

  const circles = [], labels = [], angles = [];
  LAYERS.forEach((name,i) => {
    const a = -Math.PI/2 + i*(2*Math.PI/N);
    angles.push(a);
    const nx = cx+R*Math.cos(a), ny = cy+R*Math.sin(a);
    const col = COLORS[i];

    const c = document.createElementNS(ns,'circle');
    c.setAttribute('cx',nx);c.setAttribute('cy',ny);c.setAttribute('r',NR);
    c.setAttribute('fill','rgba(255,255,255,0.04)');
    c.setAttribute('stroke','rgba(255,255,255,0.15)');c.setAttribute('stroke-width','1');
    svg.appendChild(c); circles.push(c);

    const t = document.createElementNS(ns,'text');
    t.setAttribute('x',nx);t.setAttribute('y',ny+3);
    t.setAttribute('text-anchor','middle');t.setAttribute('font-size','7.5');
    t.setAttribute('fill','rgba(255,255,255,0.3)');
    t.setAttribute('font-family',"-apple-system,'Segoe UI',sans-serif");
    t.setAttribute('font-weight','600');
    t.textContent = name.split(' ')[0];
    svg.appendChild(t); labels.push(t);
  });

  wrap.appendChild(svg);

  /* animate active node cycling */
  let active = 0;
  const CYCLE_MS = 1200;
  function animMap() {
    circles.forEach((c,i) => {
      const isA = i===active;
      c.setAttribute('r', isA ? NR*1.3 : NR);
      c.setAttribute('fill', isA ? COLORS[i] : 'rgba(255,255,255,0.04)');
      c.setAttribute('stroke', isA ? COLORS[i] : 'rgba(255,255,255,0.15)');
      c.setAttribute('stroke-opacity', isA ? '0.7' : '1');
      c.setAttribute('stroke-width', isA ? '2' : '1');
      labels[i].setAttribute('fill', isA ? '#fff' : 'rgba(255,255,255,0.3)');
    });
    active = (active+1)%N;
  }
  animMap();
  setInterval(animMap, CYCLE_MS);
}

/* ── AI History Timeline viz ─────────────────── */
function initTimelineViz() {
  const wrap = document.getElementById('lpTimelineViz');
  if (!wrap) return;
  const eras = [
    {year:'1990s', name:'Classical ML',       sub:'SVM, RF, k-NN',                   col:'#6366F1'},
    {year:'2012',  name:'CNNs',               sub:'ResNet, U-Net, YOLO',              col:'#7C3AED'},
    {year:'2014',  name:'GANs / Autoencoders',sub:'cGAN, VAE, Siamese',               col:'#8B5CF6'},
    {year:'2016',  name:'RNN / LSTM',         sub:'Temporal, sequences',              col:'#0EA5E9'},
    {year:'2020',  name:'Transformers',        sub:'ViT, Swin, BERT',                 col:'#06B6D4'},
    {year:'2021',  name:'Diffusion Models',   sub:'DDPM, DiffusionSat',               col:'#14B8A6'},
    {year:'2022',  name:'Foundation Models',  sub:'Prithvi, Clay, SAM, SpectralGPT',  col:'#22C55E'},
    {year:'2023→', name:'VLMs / LLMs',        sub:'GeoChat, RemoteCLIP, TerraMind',   col:'#EAB308'},
    {year:'2024→', name:'Agentic AI',         sub:'GeoLLM-Squad, Earth-Agent',        col:'#F97316'},
  ];

  const cards = [];
  eras.forEach(e => {
    const d = document.createElement('div');
    d.className = 'lp-tl-card';
    d.style.setProperty('--tc', e.col);
    d.innerHTML = `<div class="lp-tl-year">${e.year}</div><div><div class="lp-tl-name">${e.name}</div><div class="lp-tl-sub">${e.sub}</div></div>`;
    wrap.appendChild(d);
    cards.push(d);
  });

  /* stagger in */
  cards.forEach((c,i) => setTimeout(() => c.classList.add('show'), i*180));

  /* auto-scroll loop */
  let dir = 1;
  setInterval(() => {
    wrap.scrollTop += dir * 2;
    if (wrap.scrollTop + wrap.clientHeight >= wrap.scrollHeight - 4) dir = -1;
    if (wrap.scrollTop <= 0) dir = 1;
  }, 40);
}

/* ── Instant Search viz ──────────────────────── */
function initSearchViz(onDone) {
  const inputEl   = document.getElementById('lpSvInput');
  const resultsEl = document.getElementById('lpSvResults');
  if (!inputEl || !resultsEl) return;

  const QUERIES = [
    {
      q: 'ViT',
      results:[
        {layer:'Model Architectures', match:'<mark>ViT</mark> (Vision Transformer)', desc:'Transformer applied to image patches — dominant backbone for geo foundation models.'},
        {layer:'Techniques',          match:'<mark>ViT</mark> fine-tuning with LoRA', desc:'Adapting pretrained ViTs to new sensors with parameter-efficient methods.'},
        {layer:'Tools & Stack',       match:'timm — <mark>ViT</mark> weights hub',    desc:'PyTorch Image Models, go-to library for ViT variants.'},
      ]
    },
    {
      q: 'SAR segmentation',
      results:[
        {layer:'Tasks / Applications',match:'<mark>SAR</mark> <mark>segmentation</mark>', desc:'Pixel-level labeling of synthetic aperture radar imagery.'},
        {layer:'Datasets',            match:'Sen1Floods11 — <mark>SAR</mark> flood',       desc:'Benchmark for flood mapping with Sentinel-1 SAR data.'},
        {layer:'Sensors & Satellites',match:'Sentinel-1 <mark>SAR</mark>',                 desc:'C-band SAR constellation, free open access.'},
      ]
    },
    {
      q: 'STAC',
      results:[
        {layer:'Standards',           match:'<mark>STAC</mark> — SpatioTemporal Asset Catalog', desc:'Unified metadata spec for geospatial data — catalog API for cloud-native search.'},
        {layer:'Earth Data',          match:'<mark>STAC</mark> catalogs',                        desc:'Discover and stream COG/Zarr assets via STAC endpoints.'},
        {layer:'Tools & Stack',       match:'pystac / stac-fastapi',                             desc:'Python clients and server implementations for <mark>STAC</mark>.'},
      ]
    },
    {
      q: 'foundation model',
      results:[
        {layer:'Model Architectures', match:'<mark>Foundation</mark> <mark>model</mark>s', desc:'Large pretrained models — Prithvi, Clay, SpectralGPT, SatMAE — adapted for EO.'},
        {layer:'Datasets',            match:'SSL4EO-S12 pretraining data',                  desc:'Large unlabelled Sentinel dataset used to train geo <mark>foundation model</mark>s.'},
        {layer:'Companies',           match:'IBM / NASA — Prithvi',                         desc:'Open-source geospatial <mark>foundation model</mark> for land-use and disaster tasks.'},
      ]
    },
    {
      q: 'change detection',
      results:[
        {layer:'Tasks / Applications',match:'<mark>Change</mark> <mark>detection</mark>',  desc:'Identifying differences between multi-temporal images — deforestation, floods, urban growth.'},
        {layer:'Datasets',            match:'LEVIR-CD / S2Looking',                         desc:'Benchmark datasets for bitemporal <mark>change detection</mark> with high-res imagery.'},
        {layer:'Techniques',          match:'Siamese networks for <mark>change</mark>',     desc:'Twin encoders process image pairs and compare feature maps for pixel-level difference.'},
      ]
    },
  ];

  let qIdx = 0;

  function runQuery() {
    const q = QUERIES[qIdx]; qIdx++;
    inputEl.textContent = '';
    resultsEl.innerHTML = '';

    let i = 0;
    function typeChar() {
      if (i >= q.q.length) { showResults(); return; }
      inputEl.textContent += q.q[i++];
      setTimeout(typeChar, 80 + Math.random()*60);
    }

    function showResults() {
      setTimeout(() => {
        q.results.forEach((r,ri) => {
          const d = document.createElement('div');
          d.className = 'lp-sv-result';
          d.innerHTML = `<div class="lp-sv-rlayer">${r.layer}</div><div class="lp-sv-rmatch">${r.match}</div><div class="lp-sv-rdesc">${r.desc}</div>`;
          resultsEl.appendChild(d);
          setTimeout(() => d.classList.add('show'), ri*120);
        });
        const count = document.createElement('div');
        count.className='lp-sv-count';
        count.textContent=`${q.results.length} results across ${q.results.length} layers`;
        resultsEl.appendChild(count);
        setTimeout(() => count.style.opacity='1', q.results.length*120+100);

        setTimeout(() => {
          resultsEl.querySelectorAll('.lp-sv-result,.lp-sv-count').forEach(el => el.classList.remove('show'));
          setTimeout(() => {
            resultsEl.innerHTML = '';
            if (qIdx >= QUERIES.length) {
              /* all 5 searches done — hand off to next tab */
              qIdx = 0;
              onDone && onDone();
            } else {
              runQuery();
            }
          }, 600);
        }, 3500);
      }, 300);
    }
    setTimeout(typeChar, 400);
  }

  runQuery();
}

/* ── Knowledge Map tree terminal ─────────────── */
function initMapTree() {
  const body = document.getElementById('lpMapTreeBody');
  if (!body) return;

  const PROMPT = '<span class="lp-demo-prompt">geomind:~$</span> ';
  const CURSOR = '<span class="lp-demo-cursor"></span>';
  const TREE_LINES = [
    { text:'GeoMind/',               depth:0, kind:'root' },
    { text:'01  earth data',         depth:1, kind:'item',   branch:'├─' },
    { text:'02  learning paradigms', depth:1, kind:'item',   branch:'├─' },
    { text:'03  ai history',         depth:1, kind:'item',   branch:'├─' },
    { text:'04  model architectures',depth:1, kind:'active', branch:'├─' },
    { text:'stat / ai / physics',    depth:2, kind:'child',  branch:'└─' },
    { text:'05  techniques',         depth:1, kind:'item',   branch:'├─' },
    { text:'06  tasks / applications',depth:1,kind:'item',   branch:'├─' },
    { text:'07  datasets',           depth:1, kind:'item',   branch:'├─' },
    { text:'08  tools & stack',      depth:1, kind:'item',   branch:'├─' },
    { text:'09  sensors & satellites',depth:1,kind:'item',   branch:'├─' },
    { text:'10  companies',          depth:1, kind:'item',   branch:'├─' },
    { text:'11  standards',          depth:1, kind:'item',   branch:'├─' },
    { text:'12  learning path',      depth:1, kind:'item',   branch:'├─' },
    { text:'13  job board',          depth:1, kind:'item',   branch:'└─' },
  ];

  let stopped = false;

  function addLine(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function typeCmd(text, cb) {
    const line = addLine(PROMPT + CURSOR);
    let i = 0;
    function next() {
      if (stopped) return;
      if (i >= text.length) {
        line.innerHTML = PROMPT + `<span class="lp-demo-cmd">${text}</span>`;
        setTimeout(cb, 180);
        return;
      }
      line.innerHTML = PROMPT + `<span class="lp-demo-cmd">${text.slice(0, ++i)}</span>` + CURSOR;
      setTimeout(next, 60 + Math.random() * 40);
    }
    setTimeout(next, 400);
  }

  function renderTree(cb) {
    let i = 0;
    function nextLine() {
      if (stopped || i >= TREE_LINES.length) { cb && cb(); return; }
      const l = TREE_LINES[i++];
      const indent = '  '.repeat(l.depth);
      const branch = l.depth > 0 ? `<span class="lp-demo-tree-branch">${l.branch} </span>` : '';
      let cls = 'lp-demo-tree-item';
      if (l.kind === 'root')   cls += ' lp-demo-tree-root';
      if (l.kind === 'active') cls += ' lp-demo-tree-active';
      if (l.kind === 'child')  cls += ' lp-demo-tree-child';
      addLine(`<div class="${cls}">${indent}${branch}<span>${l.text}</span></div>`);
      setTimeout(nextLine, l.depth === 0 ? 0 : 60);
    }
    nextLine();
  }

  function run() {
    if (stopped) return;
    body.innerHTML = '';
    typeCmd('ls', () => {
      const blank = document.createElement('div');
      body.appendChild(blank);
      renderTree(() => {
        const b2 = document.createElement('div');
        body.appendChild(b2);
        addLine(PROMPT + CURSOR);
        /* loop after 4s */
        setTimeout(() => { if (!stopped) run(); }, 4000);
      });
    });
  }

  run();
}

/* ── Demo terminal animation ─────────────────── */
function initDemoTerm(onDone) {
  const body = document.getElementById('lpDemoBody');
  if (!body) return;

  const PROMPT = '<span class="lp-demo-prompt">geomind:~$</span> ';
  const CURSOR = '<span class="lp-demo-cursor"></span>';

  const SEQUENCES = [
    {
      cmd: 'help',
      delay: 800,
      output: [
        { t:'sep',  text:'  COMMAND          DESCRIPTION' },
        { t:'sep',  text:'  ─────────────────────────────────────────' },
        { t:'row',  cmd:'ls',              desc:'list all layers' },
        { t:'row',  cmd:'ls [layer]',      desc:'list sub-sections' },
        { t:'row',  cmd:'cd [layer]',      desc:'navigate into a layer' },
        { t:'row',  cmd:'cd ..',           desc:'go back to root' },
        { t:'row',  cmd:'pwd',             desc:'print current location' },
        { t:'row',  cmd:'clear',           desc:'clear the terminal' },
        { t:'row',  cmd:'help',            desc:'show this message' },
        { t:'blank' },
        { t:'note', text:'  Layer names are fuzzy — try: cd earth data or cd 1' },
      ]
    },
    {
      cmd: 'ls',
      delay: 1400,
      output: [
        { t:'tree', lines:[
          { text:'GeoMind/',             depth:0, kind:'root' },
          { text:'01  earth data',       depth:1, kind:'item', branch:'├─' },
          { text:'02  learning paradigms',depth:1,kind:'item', branch:'├─' },
          { text:'03  model architectures',depth:1,kind:'active',branch:'├─' },
          { text:'stat',                 depth:2, kind:'child', branch:'├─' },
          { text:'ai',                   depth:2, kind:'child', branch:'├─' },
          { text:'classical ml',         depth:3, kind:'leaf',  branch:'├─' },
          { text:'deep learning',        depth:3, kind:'leaf',  branch:'├─' },
          { text:'foundation models',    depth:3, kind:'leaf',  branch:'├─' },
          { text:'vlms & llms',          depth:3, kind:'leaf',  branch:'├─' },
          { text:'agentic',              depth:3, kind:'leaf',  branch:'└─' },
          { text:'physics',              depth:2, kind:'child', branch:'├─' },
          { text:'by function',          depth:2, kind:'child', branch:'└─' },
          { text:'04  techniques',       depth:1, kind:'item',  branch:'├─' },
          { text:'05  tasks / applications',depth:1,kind:'item',branch:'├─' },
          { text:'06  datasets',         depth:1, kind:'item',  branch:'├─' },
          { text:'07  tools & stack',    depth:1, kind:'item',  branch:'├─' },
          { text:'08  sensors & satellites',depth:1,kind:'item',branch:'├─' },
          { text:'09  companies',        depth:1, kind:'item',  branch:'├─' },
          { text:'10  standards',        depth:1, kind:'item',  branch:'├─' },
          { text:'11  learning path',    depth:1, kind:'item',  branch:'├─' },
          { text:'12  job board',        depth:1, kind:'item',  branch:'└─' },
        ]}
      ]
    },
    {
      cmd: 'cd data',
      delay: 1000,
      output: [
        { t:'out', text:'→ earth data' },
        { t:'blank' },
        { t:'out', text:'  sensors & platforms   representations      formats — raster' },
        { t:'out', text:'  formats — vector       formats — point clouds  spatial indexing' },
        { t:'out', text:'  embedding types        embedding products   search & retrieval' },
        { t:'blank' },
        { t:'note', text:'  9 sub-sections  ·  use ls data to list them' },
      ]
    },
    {
      cmd: 'cd timeline',
      delay: 800,
      output: [
        { t:'out', text:'→ ai history  ·  showing 9 eras' },
        { t:'blank' },
        { t:'cards', items:[
          { year:'1990s', label:'Classical ML',      sub:'SVM, RF, k-NN',                  col:'#6366F1' },
          { year:'2012',  label:'CNNs',              sub:'ResNet, U-Net, YOLO',             col:'#7C3AED' },
          { year:'2014',  label:'GANs / Autoencoders',sub:'cGAN, VAE, Siamese',             col:'#8B5CF6' },
          { year:'2016',  label:'RNN / LSTM',        sub:'Temporal, sequences',             col:'#0EA5E9' },
          { year:'2020',  label:'Transformers',      sub:'ViT, Swin, BERT',                 col:'#06B6D4' },
          { year:'2021',  label:'Diffusion models',  sub:'DDPM, DiffusionSat',              col:'#14B8A6' },
          { year:'2022',  label:'Foundation models', sub:'Prithvi, Clay, SAM, SpectralGPT', col:'#22C55E' },
          { year:'2023→', label:'VLMs / LLMs',       sub:'GeoChat, RemoteCLIP, TerraMind',  col:'#EAB308' },
          { year:'2024→', label:'Agentic AI',        sub:'GeoLLM-Squad, Earth-Agent',       col:'#F97316' },
        ]},
      ]
    },
    {
      cmd: 'search ViT',
      delay: 1200,
      output: [
        { t:'note', text:'  searching across all 13 layers…' },
        { t:'blank' },
        { t:'search-result', layer:'04  model architectures', match:'ViT (Vision Transformer)', context:'Transformer applied to image patches — dominant backbone for geo foundation models.' },
        { t:'search-result', layer:'05  techniques',          match:'ViT fine-tuning',           context:'Adapting pretrained ViTs to remote sensing with LoRA or full fine-tune.' },
        { t:'search-result', layer:'07  datasets',            match:'ImageNet-pretrained ViT',   context:'Common initialisation for satellite image classifiers.' },
        { t:'search-result', layer:'08  tools & stack',       match:'timm (ViT weights)',         context:'PyTorch Image Models — go-to library for ViT variants.' },
        { t:'blank' },
        { t:'note', text:'  4 results  ·  ⌘K to search anything' },
      ]
    },
  ];

  let lines = []; /* rendered line elements */
  let seqIdx = 0;
  let stopped = false;

  function addLine(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function addBlank() { addLine('<div class="lp-demo-blank"></div>'); }

  function renderCards(cards, cb) {
    const wrap = document.createElement('div');
    wrap.className = 'lp-demo-cards';
    body.appendChild(wrap);

    let i = 0;
    function nextCard() {
      if (stopped || i >= cards.length) { cb && cb(); return; }
      const c = cards[i++];
      const el = document.createElement('div');
      el.className = 'lp-demo-card lp-demo-card-enter';
      el.style.setProperty('--cc', c.col);
      el.innerHTML = `<span class="lp-demo-card-year">${c.year}</span><span class="lp-demo-card-label">${c.label}</span><span class="lp-demo-card-sub">${c.sub}</span>`;
      wrap.appendChild(el);
      body.scrollTop = body.scrollHeight;
      /* trigger enter animation */
      requestAnimationFrame(() => el.classList.add('lp-demo-card-visible'));
      setTimeout(nextCard, 500);
    }
    nextCard();
  }

  function renderOutput(items, cb) {
    let i = 0;
    function next() {
      if (stopped || i >= items.length) { cb && cb(); return; }
      const item = items[i++];
      if (item.t === 'blank') {
        addBlank();
        setTimeout(next, 120);
      } else if (item.t === 'cards') {
        renderCards(item.items, cb); /* cards handle their own timing, skip next() */
        return;
      } else if (item.t === 'sep') {
        addLine(`<span class="lp-demo-sep">${item.text}</span>`);
        setTimeout(next, 100);
      } else if (item.t === 'row') {
        const pad = item.cmd.padEnd(18, ' ');
        addLine(`<span class="lp-demo-out-dim">  </span><span class="lp-demo-out-hi">${pad}</span><span class="lp-demo-out">${item.desc}</span>`);
        setTimeout(next, 150);
      } else if (item.t === 'note') {
        addLine(`<span class="lp-demo-out-dim">${item.text}</span>`);
        setTimeout(next, 100);
      } else if (item.t === 'layer') {
        addLine(`<span class="lp-demo-out-dim">  ${item.num}  </span><span class="lp-demo-layer">${item.name.padEnd(24,' ')}</span><span class="lp-demo-out-dim">${item.desc}</span>`);
        setTimeout(next, 180);
      } else if (item.t === 'out') {
        addLine(`<span class="lp-demo-out">${item.text}</span>`);
        setTimeout(next, 120);
      } else if (item.t === 'tree') {
        renderTree(item.lines, cb);
        return;
      } else if (item.t === 'search-result') {
        const layerSpan = `<span class="lp-demo-sr-layer">${item.layer}</span>`;
        const matchSpan = `<span class="lp-demo-sr-match">${item.match}</span>`;
        const ctx = `<span class="lp-demo-sr-ctx">${item.context}</span>`;
        addLine(`<div class="lp-demo-sr">${layerSpan}<br>${matchSpan}<br>${ctx}</div>`);
        setTimeout(next, 300);
      }
    }
    next();
  }

  function renderTree(treeLines, cb) {
    let i = 0;
    function nextLine() {
      if (stopped || i >= treeLines.length) { cb && cb(); return; }
      const l = treeLines[i++];
      const indent = '  '.repeat(l.depth);
      const branch = l.depth > 0 ? `<span class="lp-demo-tree-branch">${l.branch} </span>` : '';
      let cls = 'lp-demo-tree-item';
      if (l.kind === 'root')   cls += ' lp-demo-tree-root';
      if (l.kind === 'active') cls += ' lp-demo-tree-active';
      if (l.kind === 'child' || l.kind === 'leaf') cls += ' lp-demo-tree-child';
      addLine(`<div class="${cls}">${indent}${branch}<span>${l.text}</span></div>`);
      setTimeout(nextLine, l.depth === 0 ? 0 : 120);
    }
    nextLine();
  }

  function typeCmd(text, cb) {
    const line = addLine(PROMPT + CURSOR);
    const cursor = line.querySelector('.lp-demo-cursor');
    let typed = '';
    let i = 0;
    function next() {
      if (stopped) return;
      if (i >= text.length) {
        line.innerHTML = PROMPT + `<span class="lp-demo-cmd">${text}</span>`;
        setTimeout(cb, 400);
        return;
      }
      typed += text[i++];
      line.innerHTML = PROMPT + `<span class="lp-demo-cmd">${typed}</span>` + CURSOR;
      setTimeout(next, 100 + Math.random() * 80);
    }
    setTimeout(next, 600);
  }

  function runSeq() {
    if (stopped) return;
    const seq = SEQUENCES[seqIdx % SEQUENCES.length];
    seqIdx++;

    typeCmd(seq.cmd, () => {
      addBlank();
      renderOutput(seq.output, () => {
        addBlank();
        const idle = addLine(PROMPT + CURSOR);
        const wait = seq.output.some(o => o.t === 'cards')
          ? seq.output.find(o => o.t === 'cards').items.length * 500 + seq.delay
          : seq.delay;
        setTimeout(() => {
          if (stopped) return;
          idle.remove();
          if (seqIdx >= SEQUENCES.length) {
            /* all 5 prompts done — hand off to next tab, reset for next visit */
            seqIdx = 0;
            onDone && onDone();
          } else {
            runSeq();
          }
        }, wait);
      });
    });
  }

  runSeq();
}

/* ── Audience cycler ─────────────────────────── */
function initAudience() {
  const slides = document.querySelectorAll('.lp-aud-slide');
  const tabs   = document.querySelectorAll('.lp-aud-tab');
  const bar    = document.getElementById('audProgressBar');
  if (!slides.length || !bar) return;

  const DURATION = 4000;
  let current = 0;
  let startTs = null;
  let paused  = false;
  let rafId   = null;

  const COLORS = ['#06B6D4','#6366F1','#A855F7'];

  function show(idx) {
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    tabs.forEach((t, i)   => t.classList.toggle('active', i === idx));
    bar.style.background = COLORS[idx];
    current = idx;
    startTs = null; /* reset timer */
  }

  function tick(ts) {
    if (!paused) {
      if (!startTs) startTs = ts;
      const pct = Math.min((ts - startTs) / DURATION * 100, 100);
      bar.style.width = pct + '%';
      if (pct >= 100) show((current + 1) % slides.length);
    }
    rafId = requestAnimationFrame(tick);
  }

  /* tab clicks */
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      show(parseInt(tab.dataset.idx));
      paused = false;
    });
  });

  /* pause on hover */
  document.querySelector('.lp-aud-stage').addEventListener('mouseenter', () => { paused = true; });
  document.querySelector('.lp-aud-stage').addEventListener('mouseleave', () => {
    paused = false;
    startTs = null;
  });

  show(0);
  rafId = requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', () => { initCanvas(); initRadial(); initAudience(); initFeatSwitcher(); });
