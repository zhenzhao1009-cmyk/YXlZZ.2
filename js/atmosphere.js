/* 从屏幕上方向下飘落的花瓣雨：与玫瑰开场同步，后台暂停。 */
(function () {
  "use strict";
  var canvas = document.getElementById("petalAtmosphere");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var settings = (window.SITE_CONFIG || {}).atmosphere || {};
  var requested = typeof settings.petals === "number" && isFinite(settings.petals) ? settings.petals : 72;
  var maxCount = Math.max(0, Math.min(120, Math.round(requested)));
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = motion.matches;
  var mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700;
  var targetFps = Math.max(30, Math.min(120, Number(((window.SITE_CONFIG || {}).performance || {}).mobileFps) || 120));
  var galleryPaused = false;
  var petals = [], width = 0, height = 0, started = false, frameId = null, last = null, time = 0;
  function random(a, b) { return a + Math.random() * (b - a); }
  function createPetal() {
    var depth = random(0.55, 1);
    return {
      x: Math.random(), y: reduced ? Math.random() : -random(0.02, 1.05), depth: depth,
      speed: random(0.075, 0.14) * depth,
      phase: random(0, Math.PI * 2), spin: random(-0.7, 0.7),
      angle: random(0, Math.PI * 2), size: random(4.0, 8.0) * depth,
      opacity: random(0.34, 0.66), light: Math.random() > 0.7
    };
  }
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var target = reduced ? Math.min(7, maxCount) : (mobile ? Math.min(18, maxCount) : maxCount);
    while (petals.length < target) petals.push(createPetal());
    petals.length = target;
    if (reduced) {
      for (var i = 0; i < petals.length; i++) petals[i].y = ((petals[i].y % 1) + 1) % 1;
    }
    if (started) paint(0);
  }
  function paint(dt) {
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.y += p.speed * dt;
      p.angle += p.spin * dt;
      if (p.y > 1.06) { p.y = -random(0.03, 0.16); p.x = Math.random(); }
      var x = p.x * width + Math.sin(time * 0.65 + p.phase) * (12 + 24 * p.depth);
      var y = p.y * height;
      var edgeFade = Math.min(1, Math.max(0, p.y / 0.06), Math.max(0, (1.04 - p.y) / 0.09));
      var nearRose = Math.abs(x - width / 2) < width * 0.18 && Math.abs(y - height * 0.50) < height * 0.23;
      var flutter = 0.38 + 0.62 * Math.abs(Math.sin(time * 0.8 + p.phase));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.angle);
      ctx.scale(flutter, 1);
      ctx.globalAlpha = p.opacity * edgeFade * (nearRose ? 0.45 : 1);
      var tint = ctx.createLinearGradient(-p.size, -p.size, p.size, p.size);
      tint.addColorStop(0, p.light ? "#ef9ab5" : "#c55680");
      tint.addColorStop(1, "#68213f");
      ctx.fillStyle = tint;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 1.25, -p.size * 0.7, p.size * 0.8, p.size * 0.8, 0, p.size * 1.2);
      ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.5, -p.size * 0.9, -p.size * 0.4, 0, -p.size);
      ctx.fill();
      ctx.restore();
    }
  }
  function frame(now) {
    frameId = null;
    if (!started || document.hidden || galleryPaused || reduced) return;
    if (mobile && last !== null && now - last < 1000 / targetFps - 0.5) {
      frameId = requestAnimationFrame(frame);
      return;
    }
    var dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    paint(dt);
    frameId = requestAnimationFrame(frame);
  }
  function resume() {
    if (started && !document.hidden && !galleryPaused && !reduced && maxCount > 0 && frameId === null) {
      last = null;
      frameId = requestAnimationFrame(frame);
    }
  }
  function stop() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    last = null;
  }
  window.addEventListener("story:entered", function () {
    if (started) return;
    started = true;
    document.body.classList.add("scene-entered");
    paint(0);
    resume();
  });
  window.addEventListener("resize", resize);
  window.addEventListener("story:gallery:pause", function () { galleryPaused = true; stop(); });
  window.addEventListener("story:gallery:resume", function () { galleryPaused = false; resume(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else resume();
  });
  function changeMotion(event) {
    reduced = event.matches;
    stop();
    resize();
    resume();
  }
  if (motion.addEventListener) motion.addEventListener("change", changeMotion);
  resize();
})();
