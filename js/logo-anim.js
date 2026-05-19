/* Shared canvas animation — called for both nav logo and landing page logo */
export function initLogoAnimOnCanvas(canvas, size) {
  const ctx = canvas.getContext('2d');
  const W = size, H = size;
  const scale = size / 32;
  const nodes = [
    {x:16,y:6},{x:8,y:10},{x:24,y:10},
    {x:5,y:17},{x:16,y:14},{x:27,y:17},
    {x:10,y:23},{x:22,y:23},{x:16,y:27},
    {x:13,y:18},{x:19,y:18},
  ].map(n => ({x: n.x * scale, y: n.y * scale}));

  const state = nodes.map(() => ({
    opacity: Math.random(),
    speed: 0.008 + Math.random() * 0.018,
    dir: Math.random() > 0.5 ? 1 : -1,
    delay: Math.random() * 120,
  }));
  let frame = 0;

  function getColor() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
      ? '127,119,221' : '83,74,183';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const col = getColor();
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
      const n = nodes[i], r = 2.2 * scale;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.5);
      grd.addColorStop(0, `rgba(${col},${s.opacity * 0.35})`);
      grd.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col},${s.opacity * 0.85})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

export function initLogoAnim() {
  const canvas = document.getElementById('logoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 32, H = 32;

  // Node positions roughly matching the brain network in logo.png
  const nodes = [
    {x:16,y:6},{x:8,y:10},{x:24,y:10},
    {x:5,y:17},{x:16,y:14},{x:27,y:17},
    {x:10,y:23},{x:22,y:23},{x:16,y:27},
    {x:13,y:18},{x:19,y:18},
  ];

  // Each node has an independent opacity lifecycle
  const state = nodes.map(() => ({
    opacity: Math.random(),
    speed: 0.008 + Math.random() * 0.018,
    dir: Math.random() > 0.5 ? 1 : -1,
    delay: Math.random() * 120,
  }));

  let frame = 0;

  function getColor() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
      ? '127,119,221' : '83,74,183';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const col = getColor();
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

      const n = nodes[i];
      const r = 2.2;
      // glow
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.5);
      grd.addColorStop(0, `rgba(${col},${s.opacity * 0.35})`);
      grd.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = grd;
      ctx.fill();
      // dot
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col},${s.opacity * 0.85})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
}
