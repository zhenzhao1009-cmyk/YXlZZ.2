/* The gallery's own colours gather into its exact, stationary 3D card layout. */
(function () {
  'use strict';
  var DURATION = 3900;
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  window.assembleGallery = function (options) {
    var done = options.onComplete;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 700;
    if (reduced || document.hidden || !options.items.length) { done(); return { finish: function () {}, focus: function () {} }; }
    var overlay = document.createElement('section');
    overlay.className = 'gallery-assembly';
    overlay.setAttribute('aria-label', '照片正在从粒子聚合成形');
    var canvas = document.createElement('canvas');
    canvas.className = 'gallery-assembly-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    var skip = document.createElement('button');
    skip.className = 'gallery-assembly-skip';
    skip.type = 'button'; skip.textContent = '跳过动画';
    overlay.appendChild(canvas); overlay.appendChild(skip);
    var ctx = canvas.getContext('2d');
    if (!ctx) { done(); return { finish: function () {}, focus: function () {} }; }
    var fps = clamp(Number(((window.SITE_CONFIG || {}).performance || {}).targetFps) || 120, 1, 120);
    var cards = [], dots = [], animations = [], manualFaces = [];
    var sampleCanvas = null, sampleContext = null;
    var frame = null, watchdog = null, resizeTimer = null, start = null, lastPaint = -Infinity, finished = false;
    var view, elapsed = 0, seed = 1009;
    function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
    function project(card, u, v) {
      var localX = u * view.cardWidth * card.side;
      var x = view.radius * card.sin + localX * card.cos;
      var y = card.item.y + v * view.cardHeight;
      var z = -view.radius * card.cos + localX * card.sin;
      var ty = y * view.cosTilt - z * view.sinTilt;
      var tz = y * view.sinTilt + z * view.cosTilt;
      var perspective = view.perspective / (view.distance - tz);
      return { x: view.width * .5 + x * perspective, y: view.height * view.center + ty * perspective, z: tz, perspective: perspective };
    }
    function resize() {
      if (finished) return;
      view = options.getLayout();
      view.sinTilt = Math.sin(view.tilt * Math.PI / 180);
      view.cosTilt = Math.cos(view.tilt * Math.PI / 180);
      view.dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      canvas.width = Math.round(view.width * view.dpr); canvas.height = Math.round(view.height * view.dpr);
      cards.forEach(function (card) {
        card.side = view.radius + view.distance * view.cosTilt * card.cos >= 0 ? 1 : -1;
        card.target = project(card, 0, 0);
      });
      dots.forEach(function (dot) {
        var target = project(dot.card, dot.u, dot.v);
        dot.x = target.x; dot.y = target.y; dot.z = target.z;
        dot.size = clamp(view.cardWidth * target.perspective / dot.card.cols * .22, .75, 2.6);
        dot.sx = view.width * .5 + dot.ox * view.width;
        dot.sy = view.height * .52 + dot.oy * view.height;
        dot.bend = Math.min(view.width, view.height) * dot.curve;
      });
      dots.sort(function (a, b) { return a.z - b.z; });
    }
    function colours(item, cols, rows) {
      if (!sampleCanvas) {
        sampleCanvas = document.createElement('canvas'); sampleCanvas.width = cols; sampleCanvas.height = rows;
        sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
      }
      var c = sampleContext;
      var image = item.el.querySelector('.photo');
      if (!c || !image || !image.complete || !image.naturalWidth) return null;
      try {
        var ratio = view.cardWidth / view.cardHeight;
        var w = image.naturalWidth, h = image.naturalHeight, sw = Math.min(w, h * ratio), sh = sw / ratio;
        c.drawImage(image, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, cols, rows);
        return c.getImageData(0, 0, cols, rows).data;
      } catch (error) { return null; }
    }
    function prepare() {
      var cols = mobile ? 4 : 7, rows = mobile ? 6 : 9;
      cards = options.items.map(function (item) {
        var theta = item.theta * Math.PI / 180;
        return { item: item, sin: Math.sin(theta), cos: Math.cos(theta), side: 1, cols: cols, delay: 0, fade: 0 };
      });
      resize();
      cards.sort(function (a, b) { return a.target.z - b.target.z; });
      cards.forEach(function (card, index) {
        card.delay = index / Math.max(1, cards.length - 1) * .65 + random() * .08;
        var pixels = colours(card.item, cols, rows);
        for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
          var offset = (y * cols + x) * 4;
          var colour = pixels ? [pixels[offset], pixels[offset + 1], pixels[offset + 2]] : [205 + random() * 40, 135 + random() * 65, 175 + random() * 60];
          var angle = random() * Math.PI * 2, distance = .14 + random() * .65;
          dots.push({ card: card, u: (x + .3 + random() * .4) / cols - .5, v: (y + .3 + random() * .4) / rows - .5,
            colour: 'rgb(' + colour.map(function (c) { return clamp(Math.round(c / 32) * 32, 24, 255); }).join(',') + ')',
            ox: Math.cos(angle) * distance, oy: Math.sin(angle) * distance * .7,
            curve: (random() - .5) * .26, phase: random() * Math.PI * 2,
            delay: card.delay + random() * .20 });
        }
      });
      resize();
      cards.forEach(function (card) {
        var faces = card.item.el.querySelectorAll('.card-face');
        Array.prototype.forEach.call(faces, function (face) {
          if (face.animate) {
            var animation = face.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 750, delay: 2000 + card.delay * 1000, easing: 'ease-in-out', fill: 'both' });
            animation.pause(); animations.push(animation);
          } else { face.style.opacity = '0'; manualFaces.push({ face: face, card: card }); }
        });
      });
    }
    function focus() { if (!finished) skip.focus({ preventScroll: true }); }
    function finish() {
      if (finished) return;
      finished = true;
      if (frame !== null) cancelAnimationFrame(frame);
      clearTimeout(watchdog); clearTimeout(resizeTimer);
      document.body.classList.remove('gallery-forming');
      animations.forEach(function (animation) { animation.cancel(); });
      manualFaces.forEach(function (entry) { entry.face.style.removeProperty('opacity'); });
      overlay.remove();
      sampleCanvas = null; sampleContext = null;
      skip.removeEventListener('click', finish);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      done();
    }
    function onKey(event) {
      if (event.key === 'Escape') finish();
      else if (event.key === 'Tab') { event.preventDefault(); focus(); }
    }
    function onVisibility() { if (document.hidden) finish(); }
    function onResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 180); }
    function paint(time) {
      frame = null;
      if (finished) return;
      if (start === null) {
        start = time;
        animations.forEach(function (animation) { animation.play(); animation.startTime = time; });
      }
      elapsed = time - start;
      if (elapsed >= DURATION) { finish(); return; }
      if (elapsed - lastPaint >= 1000 / fps - .5) {
        lastPaint = elapsed;
        try {
          var seconds = elapsed / 1000;
          ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.clearRect(0, 0, view.width, view.height);
          cards.forEach(function (card) { card.fade = 1 - smooth(2 + card.delay, 2.75 + card.delay, seconds); });
          manualFaces.forEach(function (entry) { entry.face.style.opacity = String(1 - entry.card.fade); });
          ctx.globalCompositeOperation = 'lighter';
          var entrance = smooth(0, .3, seconds);
          for (var i = 0; i < dots.length; i++) {
            var dot = dots[i], alpha = dot.card.fade;
            if (alpha < .004) continue;
            var t = smooth(dot.delay, dot.delay + 2.25, seconds);
            var flight = 1 - t, arc = Math.sin(t * Math.PI);
            var x = dot.x + (dot.sx - dot.x) * flight + dot.bend * arc;
            var y = dot.y + (dot.sy - dot.y) * flight + Math.sin(seconds * 2 + dot.phase) * dot.bend * .3 * arc;
            var size = dot.size * (.65 + t * .35);
            ctx.globalAlpha = entrance * alpha * (.65 + t * .30);
            ctx.fillStyle = dot.colour; ctx.fillRect(x - size / 2, y - size / 2, size, size);
          }
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        } catch (error) { finish(); return; }
      }
      frame = requestAnimationFrame(paint);
    }
    try {
      document.body.classList.add('gallery-forming');
      document.body.appendChild(overlay);
      prepare();
      skip.addEventListener('click', finish); document.addEventListener('keydown', onKey);
      document.addEventListener('visibilitychange', onVisibility); window.addEventListener('resize', onResize);
      focus(); watchdog = setTimeout(finish, DURATION + 2200); frame = requestAnimationFrame(paint);
    } catch (error) { finish(); }
    return { finish: finish, focus: focus };
  };
})();
