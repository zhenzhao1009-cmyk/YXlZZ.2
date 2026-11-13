/* Video playback with format fallback and cancellation on close/switch. */
(function () {
  "use strict";
  window.createMemoryVideo = function (video, onNotice) {
    var generation = 0;
    var removeErrorListener = function () {};

    function stop() {
      generation++;
      removeErrorListener();
      removeErrorListener = function () {};
      video.pause();
      if (video.getAttribute("src")) {
        video.removeAttribute("src");
        video.load();
      }
    }

    function play(media) {
      stop();
      var session = generation;
      var mp4 = media.src;
      var webm = media.webm;
      var supportsMp4 = video.canPlayType('video/mp4; codecs="avc1.64001f, mp4a.40.2"');
      var sources = supportsMp4 || !webm ? [mp4, webm] : [webm, mp4];
      sources = sources.filter(function (url, i) { return url && sources.indexOf(url) === i; });
      var next = 0;
      var attempt = 0;

      function tryNext() {
        if (session !== generation) return;
        removeErrorListener();
        if (next >= sources.length) {
          onNotice("视频加载失败，请关闭后重新打开试试");
          return;
        }
        var current = ++attempt;
        var failed = false;
        var url = sources[next++];
        video.pause();
        video.removeAttribute("src");
        video.load();
        function fail(error) {
          if (session !== generation || current !== attempt || failed) return;
          if (error && error.name === "AbortError") return;
          if (error && error.name === "NotAllowedError") {
            onNotice("点击视频中的播放按钮，看看这段回忆");
            return;
          }
          failed = true;
          tryNext();
        }
        function onError() {
          if (video.error && video.error.code !== 1) fail(video.error);
        }
        video.addEventListener("error", onError);
        removeErrorListener = function () { video.removeEventListener("error", onError); };
        video.preload = "auto";
        video.src = url;
        video.load();
        var pending = video.play();
        if (pending && pending.catch) pending.catch(fail);
      }
      tryNext();
    }
    return { play: play, stop: stop };
  };
})();
