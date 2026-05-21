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

function initMainCategories() {
  const deck = document.querySelector('.lp-main-categories');
  const cards = document.querySelectorAll('.lp-main-category');
  const command = document.getElementById('mainCategoryCommand');
  if (!deck || !cards.length) return;

  cards.forEach(card => {
    const accent = card.dataset.accent;
    if (accent) card.style.setProperty('--accent', accent);
  });

  function setActive(card) {
    cards.forEach(c => c.classList.toggle('active', c === card));
    if (command && card.dataset.command) command.textContent = card.dataset.command;
  }

  deck.addEventListener('mousemove', e => {
    const rect = deck.getBoundingClientRect();
    deck.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    deck.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => setActive(card));
    card.addEventListener('focus', () => setActive(card));
  });

  setActive(document.querySelector('.lp-main-category.active') || cards[0]);
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
  const DURATIONS = [5000, 5000, 0, 0, 0, 5000]; /* CLI, Ask, and Search are user/input driven */
  const started  = {};

  function scheduleNext() {
    clearTimeout(autoTimer);
    if (DURATIONS[current] === 0) return;
    autoTimer = setTimeout(() => {
      switchTo((current + 1) % rows.length);
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
      else if (idx === 1) initGraphCloud();
      else if (idx === 2) initDemoTerm(() => { switchTo(3); scheduleNext(); });
      else if (idx === 3) initAskGeoMind();
      else if (idx === 4) initSearchViz(() => { switchTo(0); scheduleNext(); });
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

function initGraphCloud() {
  const canvas = document.getElementById('lpGraphCanvas');
  if (!canvas || canvas.dataset.ready === 'true') return;
  canvas.dataset.ready = 'true';

  const ctx = canvas.getContext('2d');
  const topicEl = document.getElementById('lpGraphTopic');
  const topicMetaEl = document.getElementById('lpGraphTopicMeta');
  const words = [
    'GeoAI','SAR','Sentinel-1','Landsat','Prithvi','Clay','SAM','TerraMind','xView','DOTA',
    'change detection','building detection','segmentation','flood mapping','wildfire','LiDAR',
    'hyperspectral','STAC','COG','GeoParquet','H3','S2','transformers','ViT','CNN','U-Net',
    'YOLO','LoRA','RAG','agents','foundation models','remote sensing','weather','urban',
    'agriculture','deforestation','roads','ships','cloud mask','embeddings','reranking',
    'vector search','Kaggle','Hugging Face','papers','code','benchmarks','companies','jobs',
    'learning path','tutorials','MLOps','deployment','edge AI','spatial index','OGC','datasets',
    'labels','evaluation','Python API','notebooks','pip install','geospatial','GIS','QGIS',
    'ArcGIS','PostGIS','GeoPandas','Rasterio','Xarray','Zarr','NetCDF','GeoTIFF','GDAL',
    'PROJ','CRS','EPSG','WGS84','UTM','Web Mercator','vector tiles','Mapbox','Leaflet',
    'OpenLayers','deck.gl','Kepler.gl','Cesium','3D tiles','point clouds','LAZ','LAS',
    'DEM','DSM','DTM','slope','aspect','hillshade','watershed','hydrology','land cover',
    'land use','NDVI','EVI','NDWI','NBR','spectral bands','multispectral','thermal',
    'radar backscatter','InSAR','Sentinel-2','MODIS','PlanetScope','WorldView','NAIP',
    'Copernicus','NOAA','ECMWF','ERA5','OpenStreetMap','geocoding','routing','isochrones',
    'spatial join','buffer','overlay','tiling','quadkey','geohash','spatiotemporal',
    'object detection','scene classification','super-resolution','pan-sharpening',
    'image registration','orthorectification','cloud removal','time series','anomaly detection',
    'crop mapping','soil moisture','coastline','bathymetry','terrain','cartography',
    'spatial database','STAC catalog','earth observation','satellite imagery','aerial imagery',
    'drone imagery','geodesy','topology','spatial autocorrelation','kriging','Gaussian process'
  ];
  const topics = [
    {
      label: 'Dataset Graph',
      meta: 'training data · labels · benchmarks · evaluation',
      color: '6,182,212',
      words: ['Datasets','Sentinel-2','Landsat','xView','DOTA','NAIP','labels','benchmarks','STAC catalog','COG','GeoTIFF','Zarr','NetCDF','building detection','change detection','cloud mask','land cover','flood mapping','crop mapping','evaluation','training data','Kaggle','Hugging Face','GeoParquet'],
    },
    {
      label: 'Paper Graph',
      meta: 'papers · methods · tasks · code · citations',
      color: '129,140,248',
      words: ['Papers','methods','code','SOTA','citations','benchmarks','segmentation','object detection','super-resolution','SAR segmentation','ViT','U-Net','YOLO','LoRA','RAG','evaluation','ablation','pretraining','fine-tuning','remote sensing','CVPR','NeurIPS','ICLR','Papers with Code'],
    },
    {
      label: 'Foundation Graph',
      meta: 'foundation models · embeddings · VLMs · agents',
      color: '168,85,247',
      words: ['Foundation Models','Prithvi','Clay','SAM','TerraMind','GeoCLIP','SatMAE','SpectralGPT','RemoteCLIP','GeoChat','VLMs','LLMs','agents','embeddings','multimodal','transformers','ViT','self-supervised','masked modeling','zero-shot','few-shot','fine-tuning','vector search','reranking'],
    },
  ];

  const mouse = { x: 0, y: 0, active: false };
  const particles = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rotX = -0.18;
  let rotY = 0;
  let activeTopic = -1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(rect.width, 1);
    height = Math.max(rect.height, 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeParticle(i) {
    const isWord = i % 7 === 0;
    const theta = Math.random() * Math.PI * 2;
    const u = Math.random() * 2 - 1;
    const radius = 0.34 + Math.pow(Math.random(), 0.45) * 0.66;
    const ringNoise = 0.82 + Math.random() * 0.34;
    const shellX = Math.sqrt(1 - u * u) * Math.cos(theta) * radius * ringNoise;
    const shellY = Math.sqrt(1 - u * u) * Math.sin(theta) * radius * (0.72 + Math.random() * 0.22);
    const shellZ = u * radius * (0.88 + Math.random() * 0.2);
    return {
      x: shellX,
      y: shellY,
      z: shellZ,
      sx: 0,
      sy: 0,
      depth: 0,
      r: isWord ? 1.7 + Math.random() * 1.4 : 0.75 + Math.random() * 1.25,
      isWord,
      wordIndex: isWord ? (i / 7 | 0) : -1,
      word: isWord ? words[(i / 7 | 0) % words.length] : '',
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.72 ? 'cyan' : 'indigo',
    };
  }

  resize();
  const count = Math.min(760, Math.max(430, Math.floor((width * height) / 600)));
  for (let i = 0; i < count; i++) particles.push(makeParticle(i));

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });
  canvas.addEventListener('mouseleave', () => { mouse.active = false; });
  window.addEventListener('resize', resize);

  function tick(t) {
    ctx.clearRect(0, 0, width, height);
    const topicIndex = Math.floor(t / 2000) % topics.length;
    const topic = topics[topicIndex];
    if (topicIndex !== activeTopic) {
      activeTopic = topicIndex;
      if (topicEl) topicEl.textContent = topic.label;
      if (topicMetaEl) topicMetaEl.textContent = topic.meta;
    }

    const cx = width / 2;
    const cy = height / 2 - 6;
    const sphereR = Math.min(width * 0.38, height * 0.42);
    const perspective = 2.7;

    rotY += mouse.active ? 0.0018 : 0.00105;
    rotX += ((mouse.active ? (mouse.y / height - 0.5) * 0.55 : -0.18) - rotX) * 0.018;
    const mouseYaw = mouse.active ? (mouse.x / width - 0.5) * 0.35 : 0;

    const sinY = Math.sin(rotY + mouseYaw);
    const cosY = Math.cos(rotY + mouseYaw);
    const sinX = Math.sin(rotX);
    const cosX = Math.cos(rotX);

    particles.forEach((p, i) => {
      const wobble = 1 + Math.sin(t * 0.00035 + p.phase) * 0.035;
      const x1 = p.x * cosY - p.z * sinY;
      const z1 = p.x * sinY + p.z * cosY;
      const y1 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;
      const scale = perspective / (perspective - z2 * wobble);

      p.sx = cx + x1 * sphereR * scale;
      p.sy = cy + y1 * sphereR * scale;
      p.depth = (z2 + 1) / 2;
      p.scale = scale;
    });

    const linkDistance = Math.min(72, width * 0.13);
    const sorted = particles.slice().sort((a, b) => a.depth - b.depth);
    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i];
      for (let j = i + 1; j < Math.min(sorted.length, i + 24); j++) {
        const b = sorted[j];
        const dx = a.sx - b.sx;
        const dy = a.sy - b.sy;
        const dist = Math.hypot(dx, dy);
        if (dist < linkDistance) {
          const depthAlpha = Math.max(a.depth, b.depth);
          const alpha = (1 - dist / linkDistance) * 0.14 * depthAlpha;
          ctx.strokeStyle = `rgba(129,140,248,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      }
    }

    const topicNodes = sorted
      .filter(p => p.isWord && p.depth > 0.34)
      .slice(-18);
    for (let i = 0; i < topicNodes.length; i++) {
      const a = topicNodes[i];
      const b = topicNodes[(i + 1) % topicNodes.length];
      const c = topicNodes[(i + 5) % topicNodes.length];
      [b, c].forEach(target => {
        const alpha = 0.08 + Math.min(a.depth, target.depth) * 0.2;
        ctx.strokeStyle = `rgba(${topic.color},${alpha})`;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(target.sx, target.sy);
        ctx.stroke();
      });
    }

    sorted.forEach((p, i) => {
      const isTopicWord = p.isWord;
      const glow = isTopicWord ? topic.color : (p.hue === 'cyan' ? '6,182,212' : '129,140,248');
      const pulse = 0.55 + Math.sin(t * 0.0007 + p.phase) * 0.18;
      const alpha = 0.18 + p.depth * 0.62;
      const radius = (p.r + pulse * 0.6 + (isTopicWord ? 0.45 : 0)) * (0.6 + p.depth * 0.9);
      ctx.fillStyle = `rgba(${glow},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
      ctx.fill();

      if (p.isWord && p.depth > 0.28) {
        const label = topic.words[p.wordIndex % topic.words.length] || p.word;
        const size = (label.length > 14 ? 9.5 : 10.5) + p.depth * 1.2;
        ctx.font = `${size}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${0.22 + p.depth * 0.48})`;
        ctx.fillText(label, p.sx + radius + 5, p.sy + 4);
      }
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function initAskGeoMind() {
  const form = document.getElementById('lpAskForm');
  const input = document.getElementById('lpAskInput');
  const messages = document.getElementById('lpAskMessages');
  const submit = form?.querySelector('.lp-ask-submit');
  if (!form || !input || !messages) return;
  let userInteracted = false;
  let demoRunning = false;

  const routes = [
    {
      keys: ['paper', 'code', 'benchmark', 'method', 'implementation', 'sota'],
      title: 'Paper with Code',
      href: 'pages/paper-with-code.html',
      text: 'Start with Paper with Code. That is where methods, benchmark results, and implementation links should live.'
    },
    {
      keys: ['foundation', 'model', 'vlm', 'llm', 'agent', 'prithvi', 'clay', 'sam'],
      title: 'Foundation Models',
      href: 'pages/foundation-models.html',
      text: 'Geospatial foundation models are large pretrained models built for Earth observation and spatial data. They learn reusable patterns from satellite imagery, SAR, LiDAR, maps, and time-series data, then adapt to tasks like segmentation, change detection, land cover mapping, disaster response, and search.'
    },
    {
      keys: ['dataset', 'data', 'sentinel', 'landsat', 'change detection', 'building', 'segmentation'],
      title: 'Datasets',
      href: 'pages/datasets.html',
      text: 'Start with Datasets. Look there when your question is about training data, benchmarks, labels, or evaluation sets.'
    },
    {
      keys: ['job', 'hire', 'hiring', 'career', 'salary', 'role', 'remote', 'internship'],
      title: 'Job Market',
      href: 'pages/job-market.html',
      text: 'Start with Job Market. That page is for roles, hiring signals, required skills, and market context.'
    },
    {
      keys: ['company', 'startup', 'vendor', 'provider', 'platform', 'lab', 'business'],
      title: 'Companies',
      href: 'pages/companies.html',
      text: 'Start with Companies. Use it to explore startups, labs, platforms, satellite providers, and the ecosystem.'
    },
    {
      keys: ['learn', 'course', 'book', 'tutorial', 'beginner', 'zero', 'start', 'study'],
      title: 'Learn',
      href: 'pages/learn.html',
      text: 'Start with Learn. It is best for courses, tutorials, books, and a clean path from basics to practice.'
    },
  ];

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function appendMessage(kind, text, route) {
    const msg = document.createElement('div');
    msg.className = `lp-ask-msg lp-ask-msg-${kind}`;
    const role = kind === 'user' ? 'You' : 'GeoMind';
    msg.innerHTML = `<span class="lp-ask-role">${role}</span><p>${escapeHtml(text)}</p>`;
    if (route) {
      const a = document.createElement('a');
      a.className = 'lp-ask-link';
      a.href = route.href;
      a.textContent = `Open ${route.title} →`;
      msg.appendChild(a);
    }
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function appendStreamingBot(route, onDone, options = {}) {
    const msg = document.createElement('div');
    msg.className = 'lp-ask-msg lp-ask-msg-bot lp-ask-msg-streaming';
    msg.innerHTML = `
      <span class="lp-ask-role">GeoMind</span>
      <p class="lp-ask-thinking" aria-live="polite"><span></span><span></span><span></span></p>
    `;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;

    const p = msg.querySelector('p');
    const words = route.text.split(' ');
    let index = 0;

    window.setTimeout(() => {
      p.className = '';
      p.textContent = '';

      const timer = window.setInterval(() => {
        p.textContent += `${index === 0 ? '' : ' '}${words[index]}`;
        index += 1;
        messages.scrollTop = messages.scrollHeight;

        if (index >= words.length) {
          window.clearInterval(timer);
          const a = document.createElement('a');
          a.className = 'lp-ask-link lp-ask-link-reveal';
          a.href = route.href;
          a.textContent = `Open ${route.title} →`;
          msg.appendChild(a);
          msg.classList.remove('lp-ask-msg-streaming');
          if (!options.keepDisabled) {
            input.disabled = false;
            if (submit) submit.disabled = false;
            demoRunning = false;
          }
          if (onDone) onDone();
          if (userInteracted) input.focus();
        }
      }, 72);
    }, 620);
  }

  function pickRoute(query) {
    const q = query.toLowerCase();
    return routes.find(route => route.keys.some(key => q.includes(key))) || {
      title: 'Knowledge Map',
      href: 'pages/app.html',
      text: 'If you are not sure yet, open the full knowledge map first. It lets you scan every layer and then narrow down.'
    };
  }

  function ask(query, options = {}) {
    const clean = query.trim();
    if (!clean) return;
    if (!options.demo) userInteracted = true;
    appendMessage('user', clean);
    input.value = '';
    input.disabled = true;
    if (submit) submit.disabled = true;
    const route = pickRoute(clean);
    appendStreamingBot(route, options.onDone, { keepDisabled: options.keepDisabled });
  }

  function runDemo() {
    if (userInteracted || demoRunning || messages.querySelector('.lp-ask-msg-user')) return;
    demoRunning = true;
    input.disabled = true;
    if (submit) submit.disabled = true;

    const demoPrompts = [
      'I need satellite datasets for building detection',
      'What are geospatial foundation models?',
    ];

    function stopDemo() {
      demoRunning = false;
      input.value = '';
      input.disabled = false;
      if (submit) submit.disabled = false;
    }

    function typePrompt(prompt, onDone) {
      let index = 0;
      input.value = '';
      const timer = window.setInterval(() => {
        if (userInteracted) {
          window.clearInterval(timer);
          stopDemo();
          return;
        }

        input.value = prompt.slice(0, index + 1);
        index += 1;

        if (index >= prompt.length) {
          window.clearInterval(timer);
          window.setTimeout(onDone, 420);
        }
      }, 46);
    }

    function runStep(step) {
      if (userInteracted) {
        stopDemo();
        return;
      }

      const prompt = demoPrompts[step];
      if (!prompt) {
        input.placeholder = 'Ask what you want to find in GeoAI';
        stopDemo();
        return;
      }

      typePrompt(prompt, () => {
        ask(input.value, {
          demo: true,
          keepDisabled: true,
          onDone: () => {
            window.setTimeout(() => runStep(step + 1), step === 0 ? 900 : 0);
          },
        });
      });
    }

    runStep(0);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    ask(input.value);
  });

  input.addEventListener('focus', () => {
    if (!demoRunning) userInteracted = true;
  });
  input.addEventListener('input', () => {
    if (!demoRunning) userInteracted = true;
  });

  window.setTimeout(runDemo, 520);
}

function initInsightChart() {
  const rail = document.getElementById('insightRail');
  const periodEl = document.getElementById('insightPeriod');
  const titleEl = document.getElementById('insightTitle');
  const textEl = document.getElementById('insightText');
  const topicsEl = document.getElementById('insightTopics');
  if (!rail || !periodEl || !titleEl || !textEl || !topicsEl) return;

  const signals = [
    {
      period: '2020-2022',
      title: 'Pretraining becomes the starting point.',
      text: 'Early signals cluster around remote-sensing pretraining, generalization, multimodal learning, and vision-language work.',
      topics: ['RS pretraining', 'Generalization', 'Multimodal', 'Vision-language'],
      weight: 1,
    },
    {
      period: '2023',
      title: 'Foundation models become visible.',
      text: 'The field starts naming reusable geospatial models as a category, while climate/weather and benchmark work become easier to track.',
      topics: ['Foundation models', 'Climate/weather', 'Benchmarks', 'Multimodal'],
      weight: 2,
    },
    {
      period: '2024',
      title: 'The stack around the models matures.',
      text: 'More work connects models to evaluation, data infrastructure, task coverage, and domain-specific Earth systems.',
      topics: ['Evaluation', 'Data infrastructure', 'Task coverage', 'Earth systems'],
      weight: 3,
    },
    {
      period: '2025',
      title: 'Foundation models become the organizing layer.',
      text: 'The catalog signal moves from pretraining as a technique toward reusable models, benchmarks, and domain-specific systems.',
      topics: ['Base models', 'VLMs', 'Benchmarks', 'Adaptation'],
      weight: 4,
    },
    {
      period: '2026',
      title: 'Partial-year signal: consolidation.',
      text: 'The newest records point toward better evaluation, model specialization, and more practical workflows around foundation models.',
      topics: ['Specialization', 'Agents', 'Evaluation', 'Workflows'],
      weight: 3,
    },
  ];

  function setActive(item) {
    periodEl.textContent = item.period === '2026' ? '2026 partial' : item.period;
    titleEl.textContent = item.title;
    textEl.textContent = item.text;
    topicsEl.innerHTML = item.topics.map(label => (
      `<span class="lp-insight-topic">${label}</span>`
    )).join('');

    rail.querySelectorAll('.lp-insight-signal').forEach(btn => {
      const active = btn.dataset.period === item.period;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  rail.innerHTML = '';
  signals.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lp-insight-signal';
    button.dataset.period = item.period;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `Show ${item.period} GeoAI signal`);
    button.style.setProperty('--signal-size', String(item.weight));
    button.innerHTML = `
      <span class="lp-insight-dot"></span>
      <span class="lp-insight-period">${item.period}</span>
    `;
    button.addEventListener('click', () => setActive(item));
    rail.appendChild(button);
  });

  setActive(signals.find(item => item.period === '2025') || signals[0]);
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
        { t:'row',  cmd:'search [query]',  desc:'search across all layers' },
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

document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  initMainCategories();
  initInsightChart();
  initRadial();
  initFeatSwitcher();
});
