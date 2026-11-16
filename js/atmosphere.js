/* 清晰的粉金花瓣雨：缓存花瓣纹理，按远近分层，随故事暂停。 */
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
  var targetFps = Math.max(1, Math.min(120, Number(((window.SITE_CONFIG || {}).performance || {}).targetFps) || 120));
  var galleryPaused = false;
  var petals = [], width = 0, height = 0, started = false, frameId = null, last = null, time = 0;
  var nextPaintAt = null;
  var palettes = [
    { top: "#ffe3ef", mid: "#f37db4", base: "#db3e82", shade: "#98254f", rim: "#ffd7e9", glow: "255,105,174" },
    { top: "#fff0ed", mid: "#ffa8b9", base: "#ef6b98", shade: "#b63c65", rim: "#ffe7dc", glow: "255,157,186" },
    { top: "#fff8df", mid: "#f6d59e", base: "#dfa464", shade: "#a8663e", rim: "#fff0c6", glow: "255,205,135" },
    { top: "#f5eaff", mid: "#d3a7ed", base: "#ae74cf", shade: "#764a98", rim: "#f4dfff", glow: "211,153,255" }
  ];
  function random(a, b) { return a + Math.random() * (b - a); }
  function petalPath(c) {
    c.beginPath();
    c.moveTo(0, -26);
    c.bezierCurveTo(19, -31, 34, -9, 13, 18);
    c.bezierCurveTo(8, 25, 3, 30, -1, 32);
    c.bezierCurveTo(-21, 24, -31, 7, -25, -9);
    c.bezierCurveTo(-20, -22, -8, -28, 0, -26);
    c.closePath();
  }
  // 颜色、卷边与叶脉只绘制一次，每帧复用清晰的小纹理。
  var sprites = palettes.map(function (palette) {
    var sprite = document.createElement("canvas");
    sprite.width = 96; sprite.height = 112;
    var c = sprite.getContext("2d");
    c.translate(48, 54);
    var halo = c.createRadialGradient(0, 0, 6, 0, 0, 43);
    halo.addColorStop(0, "rgba(" + palette.glow + ",0.20)");
    halo.addColorStop(0.55, "rgba(" + palette.glow + ",0.09)");
    halo.addColorStop(1, "rgba(" + palette.glow + ",0)");
    c.fillStyle = halo; c.fillRect(-48, -54, 96, 112);
    var tint = c.createLinearGradient(-22, -27, 20, 30);
    tint.addColorStop(0, palette.top); tint.addColorStop(0.28, palette.mid);
    tint.addColorStop(0.70, palette.base); tint.addColorStop(1, palette.shade);
    petalPath(c); c.fillStyle = tint; c.fill();
    c.lineWidth = 1.3; c.strokeStyle = palette.rim; c.globalAlpha = 0.78; c.stroke();
    c.beginPath(); c.moveTo(0, -26);
    c.bezierCurveTo(20, -27, 30, -8, 13, 18);
    c.bezierCurveTo(20, 1, 11, -19, 0, -26);
    c.fillStyle = palette.top; c.globalAlpha = 0.48; c.fill();
    c.beginPath(); c.moveTo(-11, -14); c.bezierCurveTo(0, -5, 5, 10, -1, 27);
    c.strokeStyle = palette.top; c.lineWidth = 0.9; c.globalAlpha = 0.36; c.stroke();
    return sprite;
  });
  var sparkle = document.createElement("canvas");
  sparkle.width = sparkle.height = 32;
  var sparkleContext = sparkle.getContext("2d");
  var sparkleLight = sparkleContext.createRadialGradient(16, 16, 0, 16, 16, 16);
  sparkleLight.addColorStop(0, "rgba(255,246,226,0.95)");
  sparkleLight.addColorStop(0.16, "rgba(255,215,189,0.72)");
  sparkleLight.addColorStop(0.5, "rgba(255,154,192,0.18)");
  sparkleLight.addColorStop(1, "rgba(255,154,192,0)");
  sparkleContext.fillStyle = sparkleLight; sparkleContext.fillRect(0, 0, 32, 32);
  sparkleContext.strokeStyle = "rgba(255,245,226,0.9)"; sparkleContext.lineWidth = 0.8;
  sparkleContext.beginPath(); sparkleContext.moveTo(16, 8); sparkleContext.lineTo(16, 24);
  sparkleContext.moveTo(8, 16); sparkleContext.lineTo(24, 16); sparkleContext.stroke();

  function createPetal() {
    var depth = random(0.48, 1.05), tone = Math.random();
    return {
      x: Math.random(), y: random(-0.12, 1.02), depth: depth,
      speed: random(0.046, 0.095) * depth,
      phase: random(0, Math.PI * 2), spin: random(-0.55, 0.55),
      angle: random(0, Math.PI * 2), size: random(mobile ? 9 : 12, mobile ? 16 : 23) * depth,
      opacity: random(0.76, 0.96) * (0.72 + depth * 0.26),
      tone: tone < 0.58 ? 0 : tone < 0.78 ? 1 : tone < 0.92 ? 2 : 3,
      glimmer: depth > 0.76 && Math.random() > 0.55
    };
  }
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var target = reduced ? Math.min(7, maxCount) : (mobile ? Math.min(26, maxCount) : maxCount);
    while (petals.length < target) petals.push(createPetal());
    petals.length = target;
    petals.sort(function (a, b) { return a.depth - b.depth; });
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
      if (p.y > 1.08) { p.y = -random(0.04, 0.15); p.x = Math.random(); }
      var x = p.x * width + Math.sin(time * 0.55 + p.phase) * (14 + 30 * p.depth);
      var y = p.y * height;
      var edgeFade = Math.min(1, Math.max(0, (p.y + 0.02) / 0.06), Math.max(0, (1.05 - p.y) / 0.08));
      var nearRose = Math.abs(x - width / 2) < width * 0.18 && Math.abs(y - height * 0.50) < height * 0.23;
      var flutter = 0.58 + 0.42 * Math.abs(Math.sin(time * 0.85 + p.phase));
      var opacity = p.opacity * edgeFade * (nearRose ? 0.72 : 1);
      ctx.save(); ctx.translate(x, y); ctx.rotate(p.angle); ctx.scale(flutter, 1);
      ctx.globalAlpha = opacity;
      ctx.drawImage(sprites[p.tone], -p.size * 0.9, -p.size * 1.1, p.size * 1.8, p.size * 2.2);
      if (p.glimmer && !reduced) {
        var twinkle = Math.pow(0.5 + 0.5 * Math.sin(time * 2.1 + p.phase), 6);
        if (twinkle > 0.06) {
          var glintSize = p.size * 0.65;
          ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = opacity * twinkle * 0.72;
          ctx.drawImage(sparkle, -p.size * 0.48, -p.size * 0.98, glintSize, glintSize);
        }
      }
      ctx.restore();
    }
  }
  function frame(now) {
    frameId = null;
    if (!started || document.hidden || galleryPaused || reduced) return;
    var interval = 1000 / targetFps;
    if (nextPaintAt !== null && now + 0.5 < nextPaintAt) {
      frameId = requestAnimationFrame(frame);
      return;
    }
    nextPaintAt = nextPaintAt === null || now - nextPaintAt > interval * 2 ? now + interval : nextPaintAt + interval;
    var dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now; time += dt; paint(dt);
    frameId = requestAnimationFrame(frame);
  }
  function resume() {
    if (started && !document.hidden && !galleryPaused && !reduced && maxCount > 0 && frameId === null) {
      last = null; nextPaintAt = null; frameId = requestAnimationFrame(frame);
    }
  }
  function stop() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null; last = null; nextPaintAt = null;
  }
  window.addEventListener("story:entered", function () {
    if (started) return;
    started = true; document.body.classList.add("scene-entered"); paint(0); resume();
  });
  window.addEventListener("resize", resize);
  window.addEventListener("story:gallery:pause", function () { galleryPaused = true; stop(); });
  window.addEventListener("story:gallery:resume", function () { galleryPaused = false; resume(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else resume();
  });
  function changeMotion(event) { reduced = event.matches; stop(); resize(); resume(); }
  if (motion.addEventListener) motion.addEventListener("change", changeMotion);
  resize();
})();
