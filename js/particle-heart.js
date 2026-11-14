(() => {
  'use strict';
  const canvas = document.getElementById('particleHeart');
  if (!canvas) return;
  const embedded = canvas.dataset?.introHeart === 'true';
  const ctx = canvas.getContext('2d', { alpha: embedded });
  if (!ctx) return;
  const pauseButton = document.getElementById('heartPause');
  const resetButton = document.getElementById('heartReset');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const targetFps = Math.max(1, Math.min(120, Number(window.SITE_CONFIG?.performance?.targetFps) || 120));
  const frameInterval = 1000 / targetFps;
  let stopped = false;
  let seed = 1009;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  // Sample the real implicit 3D heart surface, including its back and lobes.
  // x: horizontal; y: vertical; z: depth. No texture or network dependency.
  function field(x, y, z) {
    const a = x * x + 2.25 * z * z + y * y - 1;
    return a * a * a - x * x * y * y * y - .1125 * z * z * y * y * y;
  }
  const mobile = matchMedia('(max-width: 600px)').matches;
  const points = [];
  const count = embedded ? (mobile ? 3600 : 5200) : (mobile ? 6800 : 11000);
  for (let i = 0; i < count; i++) {
    const vertical = random() * 2 - 1;
    const azimuth = random() * Math.PI * 2;
    const ring = Math.sqrt(1 - vertical * vertical);
    const x = ring * Math.cos(azimuth), y = vertical, z = ring * Math.sin(azimuth);
    let low = 0, high = 2;
    for (let n = 0; n < 19; n++) {
      const r = (low + high) / 2;
      if (field(x * r, y * r, z * r) < 0) low = r;
      else high = r;
    }
    // A small inner population gives the shell an airy, luminous volume.
    const radius = (low + high) / 2 * (i % 5 === 0 ? Math.pow(random(), .32) * .94 : .99 + random() * .02);
    points.push({ x: x * radius, y: y * radius - .12, z: z * radius,
      size: .48 + Math.pow(random(), 3) * 1.2, phase: random() * Math.PI * 2,
      light: .55 + random() * .45, hue: random(),
      scatter: random() < .32 ? .09 + random() * .16 : .012 + random() * .045,
      dx: 0, dy: 0, dz: 0 });
  }
  const dust = Array.from({ length: mobile ? 100 : 180 }, () => ({
    x: (random() - .5) * 4.8, y: (random() - .5) * 3.8,
    z: random() * 2 - 1, phase: random() * Math.PI * 2, size: .3 + random() * .55,
  }));
  const sprites = [];
  for (const color of ['255,105,163', '234,124,204', '182,133,255', '255,205,226']) {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const c = sprite.getContext('2d');
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,227,243,1)');
    g.addColorStop(.18, `rgba(${color},1)`);
    g.addColorStop(.42, `rgba(${color},.38)`);
    g.addColorStop(1, `rgba(${color},0)`);
    c.fillStyle = g; c.fillRect(0, 0, 32, 32);
    sprites.push(sprite);
  }

  let width = 0, height = 0, scale = 1, pixelRatio = 1;
  let paused = motion.matches;
  let pulseAt = -100, clock = 0, lastTime = 0, lastPaint = null, frame = 0, burstCycle = -1;
  function scatterDirections() {
    for (const p of points) {
      const length = Math.hypot(p.x, p.y, p.z) || 1;
      // Each beat gives each particle a new outward path and sideways drift.
      p.dx = p.x / length * .65 + (random() - .5) * 1.5;
      p.dy = p.y / length * .65 + (random() - .5) * 1.5;
      p.dz = p.z / length * .5 + (random() - .5);
    }
  }
  function resize() {
    if (stopped) return;
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width; height = bounds.height;
    pixelRatio = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    scale = Math.min(width * (embedded ? .34 : .285), height * (embedded ? .34 : .30), 265);
    draw();
  }
  function syncPause() {
    if (!pauseButton) return;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? '继续心动' : '暂停心动');
    pauseButton.title = paused ? '继续心动' : '暂停心动';
  }
  function project(x, y, z) {
    const perspective = 5 / (5 - z);
    return { x: width / 2 + x * scale * perspective,
      y: height * .46 - y * scale * perspective, depth: z, perspective };
  }
  function draw() {
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    if (embedded) ctx.clearRect(0, 0, width, height);
    else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); }
    const cycle = Math.floor(clock / 1.12);
    if (cycle !== burstCycle) { burstCycle = cycle; scatterDirections(); }
    const age = Math.min(clock % 1.12, clock - pulseAt);
    // A short vibration releases the particles; they ease back individually.
    const release = motion.matches ? 0 : age < .13
      ? Math.sin(age / .13 * Math.PI / 2)
      : age < .94 ? Math.pow(1 - (age - .13) / .81, 2) : 0;
    const shock = motion.matches ? 0 : Math.exp(-age * 12);
    const shakeX = Math.sin(age * 91) * shock * .012;
    const shakeY = Math.sin(age * 113) * shock * .009;
    const heartbeat = motion.matches ? 0 : Math.sin(Math.min(age / .22, 1) * Math.PI) * .025;
    const glow = ctx.createRadialGradient(width / 2, height * .46, 0, width / 2, height * .46, scale * 1.9);
    glow.addColorStop(0, `rgba(66,9,39,${.19 + release * .12})`);
    glow.addColorStop(.55, 'rgba(34,7,30,.08)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of dust) {
      const drift = motion.matches ? 0 : Math.sin(clock * .24 + p.phase) * .055;
      const v = project(p.x, p.y + drift, p.z);
      const size = p.size * 4;
      ctx.globalAlpha = .12 + (Math.sin(clock * .7 + p.phase) + 1) * .12;
      ctx.drawImage(sprites[2], v.x - size / 2, v.y - size / 2, size, size);
    }
    for (const p of points) {
      const spread = release * p.scatter;
      const jitter = Math.sin(age * 96 + p.phase) * shock * .012;
      const v = project(
        p.x * (1 + heartbeat) + p.dx * spread + shakeX + jitter,
        p.y * (1 + heartbeat) + p.dy * spread + shakeY + jitter * .6,
        p.z + p.dz * spread);
      const near = Math.max(.12, Math.min(1, (v.depth + 1) / 2));
      const twinkle = motion.matches ? 1 : .83 + Math.sin(clock * 1.3 + p.phase) * .17;
      ctx.globalAlpha = Math.min(1, (.3 + near * .7) * p.light * twinkle * (1 + release * .14));
      const size = p.size * (4 + near * 1.8) * v.perspective * (embedded ? .75 : 1);
      const color = p.hue > .96 ? 3 : p.x < -.1 && p.hue > .42 ? 2 : p.hue > .62 ? 1 : 0;
      ctx.drawImage(sprites[color], v.x - size / 2, v.y - size / 2, size, size);
      if (p.hue > .994 && near > .5) {
        ctx.globalAlpha *= .28;
        ctx.fillStyle = '#ffccdf';
        ctx.fillRect(v.x - 3, v.y - .25, 6, .5);
        ctx.fillRect(v.x - .25, v.y - 3, .5, 6);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  function tick(now) {
    frame = 0;
    if (stopped) return;
    if (lastPaint !== null && now - lastPaint < frameInterval - .5) { schedule(); return; }
    lastPaint = now;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 0;
    lastTime = now;
    if (!paused && !motion.matches) clock += dt;
    draw();
    if (!paused && !motion.matches) schedule();
  }
  function schedule() { if (!stopped && !frame && !document.hidden) frame = requestAnimationFrame(tick); }
  function pulse() {
    if (motion.matches) return;
    pulseAt = clock; paused = false; lastTime = 0; lastPaint = null;
    syncPause(); schedule();
  }
  canvas.addEventListener('click', pulse);
  canvas.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pulse(); }
  });
  pauseButton?.addEventListener('click', () => { paused = !paused; lastTime = 0; lastPaint = null; syncPause(); schedule(); });
  resetButton?.addEventListener('click', () => {
    clock = .98; pulseAt = -100; burstCycle = -1; lastTime = 0; lastPaint = null;
    draw(); schedule();
  });
  motion.addEventListener('change', () => { if (stopped) return; paused = motion.matches; lastTime = 0; lastPaint = null; syncPause(); draw(); schedule(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; lastPaint = null; }
    else schedule();
  });
  window.addEventListener('resize', resize);
  if (embedded) window.stopIntroHeart = () => {
    stopped = true;
    cancelAnimationFrame(frame); frame = 0;
  };
  syncPause(); resize(); schedule();
})();
