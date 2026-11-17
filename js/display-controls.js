/* Native landscape when available, with an interactive in-page fallback. */
(function () {
  "use strict";
  var bound = false, pageLandscape = false, viewportKey = "";
  function rotated() { return pageLandscape && window.innerHeight > window.innerWidth; }
  window.storyViewport = {
    get: function () {
      var turn = rotated();
      return { width: turn ? window.innerHeight : window.innerWidth, height: turn ? window.innerWidth : window.innerHeight, rotated: turn, virtual: pageLandscape };
    },
    point: function (x, y) { return rotated() ? { x: y, y: window.innerWidth - x } : { x: x, y: y }; }
  };
  function updateViewport(announce) {
    var view = window.storyViewport.get(), root = document.documentElement;
    var key = [view.width, view.height, view.rotated, view.virtual].join(":");
    if (key === viewportKey) return;
    viewportKey = key;
    root.style.setProperty("--story-width", view.width + "px");
    root.style.setProperty("--story-height", view.height + "px");
    root.style.setProperty("--story-physical-width", window.innerWidth + "px");
    root.classList.toggle("page-landscape", view.rotated);
    if (announce) window.dispatchEvent(new Event("story:viewportchange"));
  }
  function setPageLandscape(active) { pageLandscape = active; updateViewport(true); }
  window.bindStoryDisplayControls = function (notify, mobile) {
    if (bound) return;
    bound = true;
    var button = document.getElementById("btnLandscape");
    var label = document.getElementById("landscapeText");
    var full = document.getElementById("btnFull");
    var controls = document.querySelector(".controls");
    if (mobile && controls) controls.classList.add("mobile-controls");
    var owner = null, pending = false, attempt = 0;
    function notice(text) { if (typeof notify === "function") notify(text); }
    function isFullscreen() { return Boolean(document.fullscreenElement || document.webkitFullscreenElement); }
    var wasFullscreen = isFullscreen();
    function sync() {
      if (button) {
        var active = Boolean(owner || pageLandscape);
        button.setAttribute("aria-pressed", String(active));
        button.setAttribute("aria-label", active ? "还原屏幕方向" : "横屏观看");
        button.title = active ? "还原屏幕方向" : "横屏观看";
        button.classList.toggle("is-active", active);
        if (label) label.textContent = active ? "还原" : "横屏";
      }
      if (full) {
        var fullscreen = isFullscreen();
        full.setAttribute("aria-pressed", String(fullscreen));
        full.setAttribute("aria-label", fullscreen ? "退出全屏" : "进入全屏");
        full.title = fullscreen ? "退出全屏" : "全屏";
      }
    }
    function restore(announce) {
      attempt++;
      if (owner) { var locked = owner; owner = null; try { locked.unlock(); } catch (_) {} }
      setPageLandscape(false);
      sync();
      if (announce) notice("已还原屏幕方向");
    }
    function usePageLandscape() {
      setPageLandscape(true);
      sync();
      notice("已切换横屏，再点可还原");
    }
    function onFullscreenChange() {
      var active = isFullscreen();
      if (wasFullscreen && !active) restore(false);
      wasFullscreen = active; sync();
    }
    function requestFullscreen() {
      var root = document.documentElement;
      var action = root.requestFullscreen || root.webkitRequestFullscreen;
      return action ? action.call(root) : null;
    }
    if (full) full.addEventListener("click", function () {
      try {
        if (isFullscreen()) {
          restore(false);
          var exit = document.exitFullscreen || document.webkitExitFullscreen;
          if (exit) Promise.resolve(exit.call(document)).catch(function () { notice("暂时无法退出全屏，请再试一次"); });
        } else {
          var root = document.documentElement;
          if (!root.requestFullscreen && !root.webkitRequestFullscreen) { notice("当前浏览器暂不支持网页全屏"); return; }
          Promise.resolve(requestFullscreen()).catch(function () { notice("暂时无法进入全屏，请再试一次"); });
        }
      } catch (_) { notice("暂时无法切换全屏，请再试一次"); }
    });
    if (button) button.addEventListener("click", async function () {
      if (pending) return;
      if (owner || pageLandscape) { restore(true); return; }
      var orientation = window.screen && window.screen.orientation;
      if (!orientation || typeof orientation.lock !== "function" || typeof orientation.unlock !== "function") { usePageLandscape(); return; }
      pending = true; button.disabled = true; button.setAttribute("aria-busy", "true");
      var current = ++attempt;
      try {
        if (!isFullscreen()) await Promise.resolve(requestFullscreen());
        if (current !== attempt) return;
        await Promise.resolve(orientation.lock("landscape"));
        if (current !== attempt) { try { orientation.unlock(); } catch (_) {} return; }
        owner = orientation; sync(); notice("已切换横屏，再点可还原");
      } catch (_) {
        if (current === attempt) usePageLandscape();
      } finally {
        pending = false; button.disabled = false; button.removeAttribute("aria-busy"); sync();
      }
    });
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    window.addEventListener("resize", function () { updateViewport(true); });
    window.addEventListener("orientationchange", function () { updateViewport(true); });
    var orientation = window.screen && window.screen.orientation;
    if (orientation && orientation.addEventListener) orientation.addEventListener("change", function () {
      if (owner && orientation.type && orientation.type.indexOf("portrait") === 0) restore(false);
      else sync();
    });
    updateViewport(false); sync();
  };
})();
