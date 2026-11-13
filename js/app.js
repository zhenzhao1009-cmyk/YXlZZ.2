/* =========================================================
   我们的故事 · 俯视环绕照片墙
   三圈照片与第四圈视频围成一个圆筒，镜头从上方俯看。
   第一、三排顺时针转，第二、四排逆时针转；整体倾斜，远处小、近处大。
   ========================================================= */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var SCENE = CFG.scene || {};
  var LAY = CFG.layout || {};
  var INTRO = CFG.intro || {};
  var MOBILE = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700;
  var ATLAS = CFG.mobileAtlas || {};
  var atlasImage = null;
  var atlasReady = false;
  var atlasFailed = false;
  var pendingAtlasFaces = [];
  var rowAnimations = [];
  var frameId = null;
  var effectsActive = null;
  var viewCache = {};

  function num(v, d) { return typeof v === "number" && isFinite(v) ? v : d; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var MOBILE_FPS = clamp(num((CFG.performance || {}).mobileFps, 120), 30, 120);

  var OPT = {
    rows: clamp(Math.round(num(LAY.rows, 3)), 1, 6),
    perRow: clamp(Math.round(num(LAY.perRow, 28)), 16, 64),
    rowGap: clamp(num(LAY.rowGap, 1.10), 1.02, 1.5),
    cardFill: clamp(num(LAY.cardFill, 0.76), 0.6, 0.96),
    cardAspect: clamp(num(LAY.cardAspect, 1.28), 1, 1.8),

    autoRotate: SCENE.autoRotate !== false,
    autoSpeed: num(SCENE.autoSpeed, 0.075),
    tilt: clamp(num(SCENE.tilt, -23.5), -38, -12),
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    friction: num(SCENE.friction, 0.93),
    dragSpeed: num(SCENE.dragSpeed, 0.22),
    wheelSpeed: num(SCENE.wheelSpeed, 0.10),
    tiltSpeed: num(SCENE.tiltSpeed, 0.12),

    music: CFG.music || "",
    musicVolume: num(CFG.musicVolume, 0.5),
    hintText: CFG.hintText || "拖动转视角 · Shift 拖动平移 · 滚轮缩放",
    hintTouchText: CFG.hintTouchText || "单指转视角 · 双指移动 / 缩放",
    hintAutoHide: num(CFG.hintAutoHide, 6000)
  };

  /* ---------- DOM ---------- */
  var stageWrap = document.getElementById("stageWrap");
  var cylinder = document.getElementById("cylinder");
  var world = document.getElementById("world");
  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbVideo = document.getElementById("lbVideo");
  var resumeMusicAfterVideo = false;
  var videoPlayback = window.createMemoryVideo(lbVideo, toast);
  var lbCap = document.getElementById("lbCap");
  var lbMessage = document.getElementById("lbMessage");
  var toastEl = document.getElementById("toast");
  var bgm = document.getElementById("bgm");
  var music = null;
  var btnRotate = document.getElementById("btnRotate");
  var btnReset = document.getElementById("btnReset");
  var btnMusic = document.getElementById("btnMusic");
  var btnFull = document.getElementById("btnFull");
  var hintEl = document.getElementById("hint");
  var enterEl = document.getElementById("enter");
  var enterBtn = document.getElementById("enterBtn");

  var photos = (CFG.photos || []).slice();
  var videos = (CFG.videos || []).slice();
  var items = [];          // { el, theta, y, src, cap }
  var R = 600;             // 圆柱半径
  var P = 1600;            // 透视距离
  var cardW = 140, cardH = 190;
  var rowPitch = 210;
  var roseLayout = null;
  var cameraOffset = 0;    // CSS 透视眼点与圆筒中心的距离差
  var cameraDistance = 0;
  var viewTilt = OPT.tilt;
  var tiltVelocity = 0;
  var zoom = 1, targetZoom = 1;
  // 允许越过正面进入仰视；仍避免转到倒置。
  var MIN_TILT = -72, MAX_TILT = 72;
  var MIN_ZOOM = 0.40, MAX_ZOOM = 1.35;
  var roseCanvasScale = 0;
  // 以屏幕比例存储平移，缩放和窗口变化都不会改变拖动距离。
  var panX = 0, panY = 0;
  var PAN_LIMIT = 0.45;
  var resetView = null;
  var pointers = new Map();
  var gesture = null;
  var lastFrame = 0;
  var rotation = 0;        // 拖动带来的整体转角
  var autoRotation = 0;    // 各排自动旋转的独立相位
  var rowLayers = [];
  var velocity = 0;
  var autoRotate = OPT.autoRotate;
  var dragging = false;
  var dragMoved = false;
  var lastX = 0, lastY = 0, lastT = 0;
  var lbIndex = 0;
  var entered = false;

  function requestRender() {
    if (frameId === null && !document.hidden) frameId = requestAnimationFrame(tick);
  }

  function writeView(key, element, property, value) {
    if (viewCache[key] === value) return;
    viewCache[key] = value;
    if (property.indexOf("--") === 0) element.style.setProperty(property, value);
    else element.style[property] = value;
  }

  function updateActivity() {
    var visible = entered && !document.hidden && !(MOBILE && lightbox.classList.contains("open"));
    var spinning = visible && autoRotate && !OPT.reducedMotion;
    rowAnimations.forEach(function (animation) {
      if (spinning && animation.playState !== "running") animation.play();
      else if (!spinning && animation.playState !== "paused") animation.pause();
    });
    if (effectsActive === visible) return;
    effectsActive = visible;
    window.dispatchEvent(new Event(visible ? "story:gallery:resume" : "story:gallery:pause"));
    var rose = document.getElementById("centerRose");
    if (rose && rose.contentWindow) {
      rose.contentWindow.postMessage({ type: "story:rose:visibility", visible: visible }, "*");
    }
  }

  function applyAtlas(face, index) {
    face.style.backgroundImage = 'url("' + ATLAS.src + '")';
    face.style.backgroundSize = (ATLAS.columns * 100) + "% " + (ATLAS.rows * 100) + "%";
    face.style.backgroundPosition = ((index % ATLAS.columns) * 100 / (ATLAS.columns - 1)) + "% " +
      (Math.floor(index / ATLAS.columns) * 100 / (ATLAS.rows - 1)) + "%";
    face.classList.add("atlas-face");
  }

  function prepareAtlas() {
    if (!MOBILE || !ATLAS.src || atlasImage) return;
    atlasImage = new Image();
    atlasImage.decoding = "async";
    atlasImage.fetchPriority = "high";
    atlasImage.onload = function () {
      atlasReady = true;
      pendingAtlasFaces.forEach(function (entry) { applyAtlas(entry.face, entry.index); });
      pendingAtlasFaces = [];
    };
    atlasImage.onerror = function () {
      atlasFailed = true;
      pendingAtlasFaces.forEach(function (entry) { entry.image.src = entry.fallback; });
      pendingAtlasFaces = [];
    };
    atlasImage.src = ATLAS.src;
  }

  /* =========================================================
     兜底图
     ========================================================= */
  var FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#2b2637"/><stop offset="1" stop-color="#14121c"/>' +
    '</linearGradient></defs><rect width="300" height="400" fill="url(#g)"/>' +
    '<text x="150" y="218" font-size="54" fill="rgba(255,255,255,.20)" text-anchor="middle">♥</text>' +
    '</svg>'
  );

  /* 一圈固定张数；卡片尺寸由圆周弦长计算，保留清晰的黑色间隙。
     d / R 决定近远比例；固定该比例后，旋转时不会忽大忽小。 */
  function computeSize() {
    var vw = window.innerWidth || 1280;
    var vh = window.innerHeight || 800;
    var portrait = vh > vw;
    var frameWidth = Math.min(vw, vh * 1.9);
    P = frameWidth * (portrait ? 1.12 : 0.98);
    R = frameWidth * 0.75;
    cameraDistance = R * clamp(num(SCENE.cameraDistance, 1.95), 1.75, 2.5);
    cameraOffset = P - cameraDistance / zoom;

    cardW = 2 * R * Math.sin(Math.PI / OPT.perRow) * OPT.cardFill;
    cardH = cardW * OPT.cardAspect;
    rowPitch = cardH * OPT.rowGap;

    var root = document.documentElement.style;
    root.setProperty("--card-w", cardW.toFixed(2) + "px");
    root.setProperty("--card-h", cardH.toFixed(2) + "px");
    root.setProperty("--scene-width", frameWidth.toFixed(2) + "px");
    root.setProperty("--rose-facing", (-viewTilt).toFixed(2) + "deg");
    root.setProperty("--persp", P.toFixed(2) + "px");
    root.setProperty("--scene-center", portrait ? "47%" : "55%");
    roseLayout = {
      type: "story:rose:layout",
      width: frameWidth * 0.60, height: frameWidth * 0.56,
      center: portrait ? 0.47 : 0.55,
      pixelRatio: (P / cameraDistance) * Math.min(window.devicePixelRatio || 1, MOBILE ? 1 : 1.5)
    };
    updateRoseCanvas(true);
  }

  // 仅在缩放跨过档位时扩展画布，保持拉远后的粒子空间及清晰度。
  function updateRoseCanvas(force) {
    var coverage = zoom < 0.45 ? 0.40 : zoom < 0.60 ? 0.45 : zoom < 0.78 ? 0.60 : 0.78;
    if (!force && coverage === roseCanvasScale) return;
    roseCanvasScale = coverage;
    var root = document.documentElement.style;
    root.setProperty("--rose-canvas-w", (window.innerWidth * cameraDistance / P / coverage).toFixed(2) + "px");
    root.setProperty("--rose-canvas-h", (window.innerHeight * cameraDistance / P / coverage).toFixed(2) + "px");
    roseLayout.pixelRatio = (P / cameraDistance) * Math.min(window.devicePixelRatio || 1, MOBILE ? 1 : 1.5) * coverage / 0.78;
    syncCenterRoseLayout();
  }

  function transformFor(theta, y) {
    var rad = theta * Math.PI / 180;
    return "translate3d(" + (R * Math.sin(rad)).toFixed(2) + "px," +
      y.toFixed(2) + "px," + (-R * Math.cos(rad)).toFixed(2) + "px) " +
      "rotateY(" + (-theta).toFixed(3) + "deg)";
  }

  /* ---------- 三圈照片与第四圈视频 ---------- */
  function build() {
    var spinTime = rowAnimations.length ? rowAnimations[0].currentTime || 0 : 0;
    rowAnimations.forEach(function (animation) { animation.cancel(); });
    rowAnimations = [];
    world.innerHTML = "";
    pendingAtlasFaces = [];
    items = [];
    rowLayers = [];

    var n = photos.length;
    if (!n) return;

    var fragment = document.createDocumentFragment();
    for (var r = 0; r < OPT.rows; r++) {
      var rowLayer = document.createElement("div");
      rowLayer.className = "photo-row";
      rowLayer.setAttribute("data-row", String(r + 1));
      rowLayers.push(rowLayer);
      if (rowLayer.animate && !OPT.reducedMotion && Math.abs(OPT.autoSpeed) > 0) {
        var direction = r % 2 === 0 ? -1 : 1;
        var animation = rowLayer.animate([
          { transform: "rotateY(0deg)" },
          { transform: "rotateY(" + (direction * 360) + "deg)" }
        ], { duration: 360000 / (Math.abs(OPT.autoSpeed) * 60), iterations: Infinity });
        animation.currentTime = spinTime;
        rowAnimations.push(animation);
      }
      fragment.appendChild(rowLayer);
      var videoRow = videos.length > 0 && r === OPT.rows - 1;
      var count = videoRow ? videos.length : OPT.perRow;
      var stepDeg = 360 / count;
      if (videoRow) rowLayer.classList.add("video-row");
      var yBase = (r - (OPT.rows - 1) / 2) * rowPitch;
      var offset = (r % 2 === 0 ? 0.5 : 0) * stepDeg;
      for (var i = 0; i < count; i++) {
        var theta = offset + stepDeg * i;
        var p = videoRow ? videos[i] : photos[(r * OPT.perRow + i) % n];
        var el = makeCard(p, theta, yBase);
        rowLayer.appendChild(el);
        items.push({ el: el, row: r, theta: theta, y: yBase, src: p.src, cap: p.cap || "", message: p.message || "", type: videoRow ? "video" : "photo", poster: p.poster || "", webm: p.webm || "", software: p.software || "", duration: p.duration || 0 });
      }
    }
    world.appendChild(fragment);
    applyTransforms();
    applyRowRotations();
    updateActivity();
    requestRender();
  }

  function makeCard(p, theta, y) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = "card" + (p.type === "video" ? " video-card" : "");
    el.setAttribute("aria-label", (p.type === "video" ? "播放视频：" : "查看照片：") + (p.cap || "我们的瞬间"));
    el.style.transform = transformFor(theta, y);

    // 正反两面各自朝向镜头，前景的照片也能正常阅读。
    for (var side = 0; side < 2; side++) {
      var face = document.createElement("span");
      face.className = "card-face" + (side ? " card-back" : "");
      face.setAttribute("aria-hidden", "true");
      var img = document.createElement("img");
      img.className = "photo";
      img.alt = "";
      img.decoding = "async";
      img.draggable = false;
      img.onerror = function () { this.onerror = null; this.src = FALLBACK; };
      var useAtlas = MOBILE && !atlasFailed && ATLAS.src && typeof p.atlasIndex === "number";
      img.src = useAtlas ? p.preview || FALLBACK : p.poster || p.thumbnail || p.src;
      face.appendChild(img);
      if (useAtlas) {
        if (atlasReady) applyAtlas(face, p.atlasIndex);
        else pendingAtlasFaces.push({ face: face, index: p.atlasIndex, image: img, fallback: p.poster || p.thumbnail || p.src });
      }
      if (p.cap) {
        var cap = document.createElement("span");
        cap.className = "cap";
        cap.textContent = p.cap;
        face.appendChild(cap);
      }
      if (p.type === "video") {
        var play = document.createElement("span");
        play.className = "video-play";
        play.textContent = "▶";
        face.appendChild(play);
      }
      el.appendChild(face);
    }
    return el;
  }

  function applyTransforms() {
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      it.y = (it.row - (OPT.rows - 1) / 2) * rowPitch;
      it.el.style.transform = transformFor(it.theta, it.y);
    }
  }

  function applyRowRotations() {
    if (rowAnimations.length) return;
    for (var r = 0; r < rowLayers.length; r++) {
      // 从上方看：负 Y 转角为顺时针；中间一排反向。
      var direction = r % 2 === 0 ? -1 : 1;
      rowLayers[r].style.transform = "rotateY(" + (direction * autoRotation).toFixed(3) + "deg)";
    }
  }

  /* =========================================================
     渲染循环
     ========================================================= */
  function tick(time) {
    frameId = null;
    if (document.hidden) return;
    var delta = lastFrame ? clamp((time - lastFrame) / (1000 / 60), 0, 3) : 1;
    lastFrame = time;
    // 各排的自动相位独立推进，拖动、惯性、缩放、复位和大图均不打断。
    if (!rowAnimations.length && autoRotate && entered && effectsActive && !OPT.reducedMotion) {
      autoRotation += Math.abs(OPT.autoSpeed) * delta;
    }
    if (!dragging && !lightbox.classList.contains("open")) {
      if (resetView) {
        var t = clamp((time - resetView.start) / 500, 0, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        rotation = resetView.rotation * (1 - eased);
        viewTilt = resetView.tilt + (OPT.tilt - resetView.tilt) * eased;
        zoom = resetView.zoom + (1 - resetView.zoom) * eased;
        panX = resetView.panX * (1 - eased);
        panY = resetView.panY * (1 - eased);
        if (t === 1) resetView = null;
      } else {
        rotation += velocity * delta;
        viewTilt = clamp(viewTilt + tiltVelocity * delta, MIN_TILT, MAX_TILT);
        if (viewTilt === MIN_TILT || viewTilt === MAX_TILT) tiltVelocity = 0;
        velocity *= Math.pow(OPT.friction, delta);
        tiltVelocity *= Math.pow(OPT.friction, delta);
        if (Math.abs(velocity) < 0.0015) velocity = 0;
        if (Math.abs(tiltVelocity) < 0.0015) tiltVelocity = 0;
        zoom += (targetZoom - zoom) * (1 - Math.pow(0.75, delta));
        if (Math.abs(targetZoom - zoom) < 0.0001) zoom = targetZoom;
      }
    }
    autoRotation %= 360;
    applyRowRotations();
    if (!dragging && !resetView) rotation %= 360;
    cameraOffset = P - cameraDistance / zoom;
    updateRoseCanvas(false);
    writeView("panX", stageWrap, "--pan-x", (panX * window.innerWidth).toFixed(2) + "px");
    writeView("panY", stageWrap, "--pan-y", (panY * window.innerHeight).toFixed(2) + "px");
    writeView("camera", cylinder, "transform",
      "translateZ(" + cameraOffset.toFixed(2) + "px) rotateX(" + viewTilt.toFixed(3) + "deg)");
    // 玫瑰与照片共享三维圆心，抵消俯仰以始终朝向镜头。
    writeView("rose", cylinder, "--rose-facing", (-viewTilt).toFixed(3) + "deg");
    writeView("rotation", world, "transform", "rotateY(" + rotation.toFixed(3) + "deg)");
    if ((!lightbox.classList.contains("open") && (dragging || resetView || velocity || tiltVelocity || zoom !== targetZoom)) ||
        (!rowAnimations.length && autoRotate && entered && effectsActive && !OPT.reducedMotion)) requestRender();
  }

  /* =========================================================
     交互：单指 / 鼠标转动视角，双指 / 滚轮缩放
     ========================================================= */
  function beginInteraction() {
    requestRender();
    resetView = null;
    hideHint();
  }

  function rebaseGesture() {
    var points = Array.from(pointers.values());
    if (!points.length) return;
    gesture = {
      x: points[0].x, y: points[0].y,
      rotation: rotation, tilt: viewTilt, zoom: targetZoom,
      panX: panX, panY: panY, pan: pointers.size === 1 && points[0].pan,
      centerX: points.length > 1 ? (points[0].x + points[1].x) / 2 : points[0].x,
      centerY: points.length > 1 ? (points[0].y + points[1].y) / 2 : points[0].y,
      distance: points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) : 0
    };
    lastX = points[0].x;
    lastY = points[0].y;
    lastT = performance.now();
    velocity = tiltVelocity = 0;
  }

  function onDown(e) {
    if (!entered || lightbox.classList.contains("open")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (pointers.size >= 2) return;
    if (!pointers.size) {
      dragMoved = false;
      targetZoom = zoom;
    } else dragMoved = true; // 双指手势不能触发照片点击。
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pan: !!e.shiftKey });
    stageWrap.setPointerCapture(e.pointerId);
    dragging = true;
    beginInteraction();
    rebaseGesture();
    document.body.classList.add("dragging");
  }

  function onMove(e) {
    if (!pointers.has(e.pointerId)) return;
    var point = pointers.get(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pan: point.pan });
    var points = Array.from(pointers.values());
    if (points.length === 2) {
      var distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      if (gesture.distance > 0) targetZoom = clamp(gesture.zoom * distance / gesture.distance, MIN_ZOOM, MAX_ZOOM);
      panX = clamp(gesture.panX + ((points[0].x + points[1].x) / 2 - gesture.centerX) / window.innerWidth, -PAN_LIMIT, PAN_LIMIT);
      panY = clamp(gesture.panY + ((points[0].y + points[1].y) / 2 - gesture.centerY) / window.innerHeight, -PAN_LIMIT, PAN_LIMIT);
      // 双指移动平移场景，开合缩放；不会改变观察角度。
      zoom = targetZoom;
      dragMoved = true;
      return;
    }
    var dx = e.clientX - gesture.x;
    var dy = e.clientY - gesture.y;
    if (Math.hypot(dx, dy) > 6) dragMoved = true;
    if (!dragMoved) return;
    if (gesture.pan) {
      panX = clamp(gesture.panX + dx / window.innerWidth, -PAN_LIMIT, PAN_LIMIT);
      panY = clamp(gesture.panY + dy / window.innerHeight, -PAN_LIMIT, PAN_LIMIT);
      velocity = tiltVelocity = 0;
      return;
    }
    var dragDirection = e.pointerType === "touch" ? -1 : 1;
    rotation = gesture.rotation - dx * OPT.dragSpeed * dragDirection;
    viewTilt = clamp(gesture.tilt + dy * OPT.tiltSpeed * dragDirection, MIN_TILT, MAX_TILT);
    var now = performance.now();
    var dt = Math.max(1, now - lastT);
    velocity = -(e.clientX - lastX) / dt * OPT.dragSpeed * 16 * dragDirection;
    tiltVelocity = (e.clientY - lastY) / dt * OPT.tiltSpeed * 16 * dragDirection;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;
  }

  function onUp(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (stageWrap.hasPointerCapture(e.pointerId)) stageWrap.releasePointerCapture(e.pointerId);
    if (pointers.size) {
      rebaseGesture();
      return;
    }
    dragging = false;
    gesture = null;
    document.body.classList.remove("dragging");
    // 按住不动再放开、取消手势时，不使用过期的甩动速度。
    var stale = !dragMoved || performance.now() - lastT > 90 || e.type !== "pointerup";
    velocity = stale || OPT.reducedMotion ? 0 : clamp(velocity, -10, 10);
    tiltVelocity = stale || OPT.reducedMotion ? 0 : clamp(tiltVelocity, -2, 2);
  }

  function cancelDrag() {
    var ids = Array.from(pointers.keys());
    pointers.clear();
    ids.forEach(function (id) {
      if (stageWrap.hasPointerCapture(id)) stageWrap.releasePointerCapture(id);
    });
    dragging = false;
    gesture = null;
    velocity = tiltVelocity = 0;
    document.body.classList.remove("dragging");
  }

  function onWheel(e) {
    if (!entered || lightbox.classList.contains("open") || dragging) return;
    e.preventDefault();
    beginInteraction();
    velocity = tiltVelocity = 0;
    var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    var d = clamp(e.deltaY * unit, -240, 240);
    targetZoom = clamp(targetZoom * Math.exp(-d * OPT.wheelSpeed * 0.015), MIN_ZOOM, MAX_ZOOM);
    if (OPT.reducedMotion) zoom = targetZoom;
  }

  function restoreView() {
    cancelDrag();
    beginInteraction();
    var nearestRotation = ((rotation + 180) % 360 + 360) % 360 - 180;
    resetView = { start: performance.now(), rotation: nearestRotation, tilt: viewTilt, zoom: zoom, panX: panX, panY: panY };
    targetZoom = 1;
    if (OPT.reducedMotion) {
      rotation = 0;
      viewTilt = OPT.tilt;
      zoom = 1;
      panX = panY = 0;
      resetView = null;
    }
    toast("已回到初始视角");
  }

  /* =========================================================
     灯箱
     ========================================================= */
  function openLightbox(idx) {
    if (!items.length) return;
    cancelDrag();
    resetView = null;
    lbIndex = ((idx % items.length) + items.length) % items.length;
    var it = items[lbIndex];
    stopVideo();
    var isVideo = it.type === "video";
    lbImg.hidden = isVideo;
    lbVideo.hidden = !isVideo;
    if (isVideo) {
      if (music && music.isActive()) {
        resumeMusicAfterVideo = true;
        music.pause();
      }
      lbImg.removeAttribute("src");
      lbVideo.poster = it.poster;
      lbVideo.setAttribute("aria-label", it.cap || "我们的回忆视频");
      videoPlayback.play(it);
    } else {
      lbImg.src = it.src;
      lbImg.onerror = function () { lbImg.onerror = null; lbImg.src = FALLBACK; };
      resumeBackgroundMusic();
    }
    lbCap.textContent = it.cap || "";
    lbImg.alt = it.cap || "我们的两周年回忆";
    lbMessage.textContent = it.message;
    lbMessage.hidden = !it.message;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    updateActivity();
  }
  function navigateLightbox(step) {
    if (!items.length) return;
    var row = items[lbIndex].row;
    var rowIndices = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].row === row) rowIndices.push(i);
    }
    var index = rowIndices.indexOf(lbIndex);
    var next = ((index + step) % rowIndices.length + rowIndices.length) % rowIndices.length;
    openLightbox(rowIndices[next]);
  }

  function stopVideo() {
    videoPlayback.stop();
  }

  function resumeBackgroundMusic() {
    if (!resumeMusicAfterVideo) return;
    resumeMusicAfterVideo = false;
    playMusic();
  }

  function closeLightbox() {
    stopVideo();
    resumeBackgroundMusic();
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    updateActivity();
    requestRender();
  }

  function pickCard(x, y) {
    var stack = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];
    for (var i = 0; i < stack.length; i++) {
      var el = stack[i];
      if (el.classList && el.classList.contains("card")) {
        return el;
      }
    }
    return null;
  }
  function indexOfCard(el) {
    for (var i = 0; i < items.length; i++) if (items[i].el === el) return i;
    return -1;
  }

  /* =========================================================
     按钮
     ========================================================= */
  function bindUI() {
    btnReset.addEventListener("click", restoreView);
    btnRotate.addEventListener("click", function () {
      autoRotate = !autoRotate;
      updateActivity();
      requestRender();
      btnRotate.classList.toggle("off", !autoRotate);
      toast(autoRotate ? "自动旋转已开启" : "自动旋转已暂停");
    });

    btnMusic.addEventListener("click", function () {
      if (!music) return;
      if (music.isActive()) music.pause();
      else playMusic();
    });

    btnFull.addEventListener("click", function () {
      var d = document.documentElement;
      if (!document.fullscreenElement) {
        if (d.requestFullscreen) d.requestFullscreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    });

    lightbox.addEventListener("click", function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute("data-close")) closeLightbox();
    });
    document.getElementById("lbClose").addEventListener("click", closeLightbox);
    document.getElementById("lbPrev").addEventListener("click", function () { navigateLightbox(-1); });
    document.getElementById("lbNext").addEventListener("click", function () { navigateLightbox(1); });

    world.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") e.stopPropagation();
    });

    stageWrap.addEventListener("click", function (e) {
      var wasDrag = e.detail !== 0 && dragMoved;
      dragMoved = false;
      if (wasDrag) return;
      if (e.target.closest && e.target.closest(".controls,.lightbox,.topbar,.hint,.enter")) return;
      var card = e.detail === 0 && e.target.closest ? e.target.closest(".card") : pickCard(e.clientX, e.clientY);
      if (!card) return;
      var idx = indexOfCard(card);
      if (idx >= 0) openLightbox(idx);
    });

    document.addEventListener("keydown", function (e) {
      if ((e.key === " " || e.key === "Enter") && e.target.closest && e.target.closest("button")) return;
      if (lightbox.classList.contains("open")) {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") navigateLightbox(-1);
        if (e.key === "ArrowRight") navigateLightbox(1);
        return;
      }
      if (!entered) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "r", "R"].indexOf(e.key) >= 0) {
        e.preventDefault();
        beginInteraction();
        if (e.shiftKey && e.key.indexOf("Arrow") === 0) {
          velocity = tiltVelocity = 0;
          if (e.key === "ArrowLeft") panX = clamp(panX - 0.04, -PAN_LIMIT, PAN_LIMIT);
          if (e.key === "ArrowRight") panX = clamp(panX + 0.04, -PAN_LIMIT, PAN_LIMIT);
          if (e.key === "ArrowUp") panY = clamp(panY - 0.04, -PAN_LIMIT, PAN_LIMIT);
          if (e.key === "ArrowDown") panY = clamp(panY + 0.04, -PAN_LIMIT, PAN_LIMIT);
        } else {
          if (e.key === "ArrowLeft") velocity = -4;
          if (e.key === "ArrowRight") velocity = 4;
          if (e.key === "ArrowUp") viewTilt = clamp(viewTilt - 4, MIN_TILT, MAX_TILT);
          if (e.key === "ArrowDown") viewTilt = clamp(viewTilt + 4, MIN_TILT, MAX_TILT);
        }
        if (e.key === "+" || e.key === "=") targetZoom = clamp(targetZoom * 1.08, MIN_ZOOM, MAX_ZOOM);
        if (e.key === "-") targetZoom = clamp(targetZoom / 1.08, MIN_ZOOM, MAX_ZOOM);
        if (OPT.reducedMotion) zoom = targetZoom;
        if (e.key.toLowerCase() === "r") restoreView();
      }
      if (e.key === " ") { e.preventDefault(); btnRotate.click(); }
      if (e.key.toLowerCase() === "f") btnFull.click();
    });
  }

  /* =========================================================
     Toast / 提示
     ========================================================= */
  var toastTimer = null;
  function playMusic() {
    if (!music) return;
    music.play().catch(function (error) {
      toast(error.name === "NotAllowedError"
        ? "请点击音乐按钮，允许浏览器播放声音"
        : error.message || "音乐加载失败，请再点击音乐按钮重试");
    });
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }
  function hideHint() { if (hintEl) hintEl.classList.add("hide"); }

  /* =========================================================
     开场
     ========================================================= */
  function syncCenterRoseLayout() {
    var roseFrame = document.getElementById("centerRose");
    if (roseLayout && roseFrame && roseFrame.contentWindow) {
      roseFrame.contentWindow.postMessage(roseLayout, "*");
    }
  }

  function startCenterRose() {
    syncCenterRoseLayout();
    effectsActive = null;
    updateActivity();
    requestRender();
    if (entered) window.dispatchEvent(new Event("story:entered"));
    var roseFrame = document.getElementById("centerRose");
    if (entered && roseFrame && roseFrame.contentWindow) {
      roseFrame.contentWindow.postMessage("story:rose:start", "*");
    }
  }

  function bindIntro() {
    var roseFrame = document.getElementById("centerRose");
    if (roseFrame) {
      roseFrame.addEventListener("load", startCenterRose);
      window.addEventListener("message", function (event) {
        if (event.source === roseFrame.contentWindow && event.data === "story:rose:ready") startCenterRose();
      });
      roseFrame.src = "rose.html?embed=1" + (MOBILE ? "&lite=1&fps=" + MOBILE_FPS : "") + "&v=mobile120";
    }
    document.getElementById("introKicker").textContent = INTRO.kicker || "给我们的两周年";
    document.getElementById("introHeading").textContent = INTRO.heading || "两年啦，还是好喜欢你。";
    var introNote = document.getElementById("introNote");
    var introSign = document.getElementById("introSign");
    introNote.textContent = CFG.note || "";
    introSign.textContent = CFG.sign || "";
    introNote.hidden = !CFG.note;
    introSign.hidden = !CFG.sign;

    // 调试用：?enter=1 直接跳过开场
    var qs = (location.search || "").toLowerCase();
    var skip = qs.indexOf("enter=1") >= 0 || qs.indexOf("skipintro=1") >= 0;

    if (INTRO.show === false || skip) {
      enterEl.style.display = "none";
      entered = true;
      startCenterRose();
      if (OPT.hintAutoHide > 0) setTimeout(hideHint, OPT.hintAutoHide);
      return;
    }
    if (INTRO.text) document.getElementById("enterText").textContent = INTRO.text;

    enterBtn.addEventListener("click", function () {
      entered = true;
      startCenterRose();
      enterEl.classList.add("gone");
      setTimeout(function () { enterEl.style.display = "none"; }, 350);
      playMusic();
      if (OPT.hintAutoHide > 0) setTimeout(hideHint, OPT.hintAutoHide);
    });
  }

  /* =========================================================
     启动
     ========================================================= */
  function init() {
    if (CFG.tabTitle) document.title = CFG.tabTitle;

    var topbar = document.getElementById("topbar");
    if (CFG.title) {
      document.getElementById("title").textContent = CFG.title;
      topbar.classList.add("show");
    }
    if (CFG.subtitle) {
      document.getElementById("subtitle").textContent = CFG.subtitle;
      topbar.classList.add("show");
    }
    if (hintEl) {
      var txt = hintEl.querySelector(".hint-text");
      if (txt) txt.textContent = window.matchMedia("(pointer: coarse)").matches ? OPT.hintTouchText : OPT.hintText;
    }

    computeSize();
    build();
    prepareAtlas();
    if (OPT.music) {
      music = window.createBackgroundMusic(bgm, btnMusic, {
        source: OPT.music,
        pcmSource: CFG.musicFallback || "",
        volume: clamp(OPT.musicVolume, 0, 1)
      });
    }
    bindUI();
    bindIntro();

    if (OPT.music) {
      btnMusic.classList.remove("off");
    } else {
      btnMusic.classList.add("off");
    }
    if (!autoRotate) btnRotate.classList.add("off");

    stageWrap.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    stageWrap.addEventListener("lostpointercapture", onUp);
    stageWrap.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("blur", cancelDrag);

    var rt = null;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        computeSize();
        applyTransforms();
        requestRender();
      }, 160);
    });

    document.addEventListener("visibilitychange", function () {
      updateActivity();
      if (document.hidden) {
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
      } else {
        lastFrame = 0;
        requestRender();
      }
    });
    requestRender();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
