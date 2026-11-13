/* Native video playback with codec and resource-loading fallback. */
(function () {
  "use strict";
  window.createMemoryVideo = function (video, onNotice) {
    var generation = 0;
    var removeErrorListener = function () {};
    var fetchController = null;
    var objectUrl = "";
    var softwarePlayback = null;

    function releaseObjectUrl() {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = "";
    }

    function stop() {
      generation++;
      if (softwarePlayback) softwarePlayback.stop();
      removeErrorListener();
      removeErrorListener = function () {};
      if (fetchController) fetchController.abort();
      fetchController = null;
      video.pause();
      if (video.getAttribute("src")) {
        video.removeAttribute("src");
        video.load();
      }
      releaseObjectUrl();
    }

    function play(media) {
      stop();
      var session = generation;
      var supportsMp4 = video.canPlayType('video/mp4; codecs="avc1.64001f, mp4a.40.2"');
      var supportsWebm = video.canPlayType('video/webm; codecs="vp8, opus"');
      if (!supportsMp4 && !supportsWebm && media.software && window.createSoftwareVideo) {
        video.hidden = true;
        softwarePlayback = softwarePlayback || window.createSoftwareVideo(onNotice);
        softwarePlayback.play(media);
        return;
      }
      var formats = supportsMp4 || !media.webm ? [media.src, media.webm] : [media.webm, media.src];
      formats = formats.filter(function (url, i) { return url && formats.indexOf(url) === i; });
      var direct = formats.map(function (url) { return { url: url, buffered: false }; });
      var buffered = formats.map(function (url) { return { url: url, buffered: true }; });
      var localPreview = window.location && !/^https?:$/.test(window.location.protocol);
      var sources = localPreview ? buffered.concat(direct) : direct.concat(buffered);
      var next = 0;
      var attempt = 0;

      function tryNext() {
        if (session !== generation) return;
        removeErrorListener();
        video.pause();
        video.removeAttribute("src");
        video.load();
        releaseObjectUrl();
        if (next >= sources.length) {
          if (media.software && window.createSoftwareVideo) {
            video.hidden = true;
            softwarePlayback = softwarePlayback || window.createSoftwareVideo(onNotice);
            softwarePlayback.play(media);
            return;
          }
          onNotice("视频加载失败，请关闭后重新打开试试");
          return;
        }
        var current = ++attempt;
        var failed = false;
        var source = sources[next++];
        function isCurrent() {
          return session === generation && current === attempt && !failed;
        }
        function fail(error) {
          if (!isCurrent()) return;
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
        function start(url) {
          if (!isCurrent()) return;
          video.preload = "auto";
          video.src = url;
          video.load();
          var pending = video.play();
          if (pending && pending.catch) pending.catch(fail);
        }
        if (!source.buffered) {
          start(source.url);
          return;
        }
        fetchController = new AbortController();
        fetch(source.url, { signal: fetchController.signal }).then(function (response) {
          if (!response.ok) throw new Error("Video HTTP " + response.status);
          return response.arrayBuffer();
        }).then(function (data) {
          if (!isCurrent()) return;
          if (!data.byteLength) throw new Error("Empty video response");
          var type = /\.webm(?:[?#]|$)/i.test(source.url) ? "video/webm" : "video/mp4";
          objectUrl = URL.createObjectURL(new Blob([data], { type: type }));
          start(objectUrl);
        }).catch(fail);
      }
      tryNext();
    }
    return { play: play, stop: stop };
  };
})();
