/* Mobile landscape and fullscreen controls, activated only by the user's tap. */
(function () {
  "use strict";
  var bound = false;
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
        var active = Boolean(owner);
        button.setAttribute("aria-pressed", String(active));
        button.setAttribute("aria-label", active ? "恢复自动转屏" : "横屏观看");
        button.title = active ? "恢复自动转屏" : "横屏观看";
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
      if (owner) {
        var locked = owner;
        owner = null;
        try { locked.unlock(); } catch (_) {}
      }
      sync();
      if (announce) notice("已恢复自动转屏");
    }
    function onFullscreenChange() {
      var active = isFullscreen();
      if (wasFullscreen && !active) restore(false);
      wasFullscreen = active;
      sync();
    }
    function requestFullscreen() {
      var root = document.documentElement;
      var action = root.requestFullscreen || root.webkitRequestFullscreen;
      if (!action) return null;
      return action.call(root);
    }
    if (full) full.addEventListener("click", function () {
      try {
        if (isFullscreen()) {
          restore(false);
          var exit = document.exitFullscreen || document.webkitExitFullscreen;
          if (exit) Promise.resolve(exit.call(document)).catch(function () { notice("暂时无法退出全屏，请再试一次"); });
        } else {
          var root = document.documentElement;
          if (!root.requestFullscreen && !root.webkitRequestFullscreen) {
            notice("当前浏览器暂不支持网页全屏"); return;
          }
          Promise.resolve(requestFullscreen()).catch(function () { notice("暂时无法进入全屏，请再试一次"); });
        }
      } catch (_) { notice("暂时无法切换全屏，请再试一次"); }
    });
    if (button) button.addEventListener("click", async function () {
      if (pending) return;
      if (owner) { restore(true); return; }
      var orientation = window.screen && window.screen.orientation;
      if (!orientation || typeof orientation.lock !== "function" || typeof orientation.unlock !== "function") {
        notice("请旋转手机，并关闭系统竖屏锁定"); return;
      }
      pending = true;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      var current = ++attempt;
      try {
        if (!isFullscreen()) await Promise.resolve(requestFullscreen());
        if (current !== attempt) return;
        await Promise.resolve(orientation.lock("landscape"));
        if (current !== attempt) {
          try { orientation.unlock(); } catch (_) {}
          return;
        }
        owner = orientation;
        sync();
        notice("已切换横屏，再点可恢复自动转屏");
      } catch (_) {
        if (current === attempt) notice("无法自动横屏，请旋转手机");
      } finally {
        pending = false;
        button.disabled = false;
        button.removeAttribute("aria-busy");
        sync();
      }
    });
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    var orientation = window.screen && window.screen.orientation;
    if (orientation && orientation.addEventListener) orientation.addEventListener("change", function () {
      if (owner && orientation.type && orientation.type.indexOf("portrait") === 0) restore(false);
      else sync();
    });
    sync();
  };
})();
