(function () {
  "use strict";

  var gate = document.getElementById("passwordEntry");
  var content = document.getElementById("storyContent");
  var form = document.getElementById("passwordForm");
  var input = document.getElementById("storyPassword");
  var error = document.getElementById("passwordError");
  var submit = document.getElementById("passwordSubmit");
  var full = document.getElementById("passwordFullscreen");
  var fullStatus = document.getElementById("passwordFullscreenStatus");
  var options = (window.SITE_CONFIG || {}).passwordEntry || {};
  var password = String(options.password || "20241225");
  var unlocked = false;
  var fullscreenAttempted = false;

  input.inputMode = /^\d+$/.test(password) ? "numeric" : "text";
  input.addEventListener("input", function () {
    input.removeAttribute("aria-invalid");
    error.textContent = "";
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (unlocked) return;
    // Keyboard submission also supplies the browser's required user gesture.
    enterFullscreenOnce();
    if (input.value.trim() !== password) {
      input.setAttribute("aria-invalid", "true");
      error.textContent = input.value.trim() ? "暗号还不对哦，再想想我们的特别日子。" : "先输入我们的暗号吧。";
      input.focus();
      input.select();
      return;
    }
    unlocked = true;
    submit.disabled = true;
    input.value = "";
    error.textContent = "";
    document.body.classList.remove("password-locked");
    content.inert = false;
    content.removeAttribute("aria-hidden");
    gate.classList.add("is-unlocked");
    gate.inert = true;
    window.dispatchEvent(new Event("story:unlocked"));
    var enterButton = document.getElementById("enterBtn");
    var next = enterButton && enterButton.getClientRects().length ? enterButton : document.getElementById("btnRotate");
    if (next) next.focus({ preventScroll: true });
    gate.setAttribute("aria-hidden", "true");
    setTimeout(function () { gate.hidden = true; }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420);
  });

  function isFullscreen() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  }
  function updateFullscreen() {
    var active = isFullscreen();
    full.setAttribute("aria-pressed", String(active));
    full.setAttribute("aria-label", active ? "退出全屏" : "进入全屏");
    full.title = active ? "退出全屏" : "全屏";
  }
  function setFullscreen(active) {
    var target = active ? document.documentElement : document;
    var action = active ? (target.requestFullscreen || target.webkitRequestFullscreen) : (document.exitFullscreen || document.webkitExitFullscreen);
    fullStatus.textContent = "";
    if (!action) {
      fullStatus.textContent = "当前浏览器暂不支持网页全屏。";
      return;
    }
    try {
      Promise.resolve(action.call(target)).then(updateFullscreen).catch(function () {
        fullStatus.textContent = "暂时无法切换全屏，请再试一次。";
      });
    } catch (_) {
      fullStatus.textContent = "暂时无法切换全屏，请再试一次。";
    }
  }
  function enterFullscreenOnce() {
    if (fullscreenAttempted) return;
    fullscreenAttempted = true;
    // Fullscreen the document root so switching scenes keeps fullscreen active.
    if (!isFullscreen()) setFullscreen(true);
  }
  gate.addEventListener("click", function (event) {
    if (unlocked || full.contains(event.target)) return;
    enterFullscreenOnce();
  }, { capture: true });
  full.addEventListener("click", function () {
    // Keep an explicit exit (or Esc) from being undone by the next click.
    fullscreenAttempted = true;
    setFullscreen(!isFullscreen());
  });
  document.addEventListener("fullscreenchange", updateFullscreen);
  document.addEventListener("webkitfullscreenchange", updateFullscreen);
  updateFullscreen();
})();
