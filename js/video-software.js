/* Software video decoding for preview windows without native media support. */
(function () {
  "use strict";
  window.createSoftwareVideo = function (onNotice) {
    var box = document.getElementById("lbSoftware");
    var canvas = document.getElementById("lbCanvas");
    var button = document.getElementById("lbSoftwarePlay");
    var seek = document.getElementById("lbSoftwareSeek");
    var time = document.getElementById("lbSoftwareTime");
    var status = document.getElementById("lbSoftwareStatus");
    var player = null, timer = null, generation = 0, duration = 0, ended = false;
    function format(value) {
      value = Math.max(0, Math.floor(value || 0));
      return Math.floor(value / 60) + ":" + (value % 60 < 10 ? "0" : "") + value % 60;
    }
    function update() {
      if (!player) return;
      var current = Math.min(duration, Math.max(0, player.currentTime || 0));
      seek.value = current;
      time.textContent = format(current) + " / " + format(duration);
    }
    function stop() {
      generation++;
      clearInterval(timer);
      timer = null;
      if (player) player.destroy();
      player = null;
      box.hidden = true;
      button.disabled = true;
      seek.disabled = true;
      canvas.style.backgroundImage = "";
    }
    function play(media) {
      stop();
      var session = generation;
      duration = media.duration || 0;
      ended = false;
      box.hidden = false;
      canvas.width = 480;
      canvas.height = 854;
      canvas.style.backgroundImage = 'url("' + media.poster + '")';
      button.textContent = "播放";
      status.textContent = "正在加载这段回忆…";
      seek.max = duration;
      seek.value = 0;
      time.textContent = "0:00 / " + format(duration);
      function Source(url) {
        this.streaming = false;
        this.established = false;
        this.completed = false;
        this.progress = 0;
        this.controller = new AbortController();
        this.url = url;
      }
      Source.prototype.connect = function (destination) { this.destination = destination; };
      Source.prototype.resume = function () {};
      Source.prototype.destroy = function () { this.controller.abort(); };
      Source.prototype.start = function () {
        var source = this;
        fetch(source.url, { signal: source.controller.signal }).then(function (response) {
          if (!response.ok) throw new Error("Video HTTP " + response.status);
          return response.arrayBuffer();
        }).then(function (data) {
          if (session !== generation) return;
          if (!data.byteLength) throw new Error("Empty video");
          source.destination.write(data);
          source.established = source.completed = true;
          source.progress = 1;
          if (!player.video.canPlay) throw new Error("Video decode failed");
          button.disabled = false;
          seek.disabled = false;
          status.textContent = "点播放，看看这段回忆。";
          timer = setInterval(update, 250);
        }).catch(function (error) {
          if (session !== generation || error.name === "AbortError") return;
          status.textContent = "这段回忆还没加载成功，请关闭后重试。";
          onNotice("视频加载失败，请检查网络后再试");
        });
      };
      player = new JSMpeg.Player(media.software, {
        canvas: canvas, source: Source, autoplay: false, loop: false,
        disableWebAssembly: true, disableGl: true, pauseWhenHidden: false,
        onPause: function () { if (session === generation) button.textContent = "播放"; },
        onEnded: function () {
          if (session !== generation) return;
          ended = true;
          button.textContent = "重播";
          status.textContent = "这一段回忆，想再看一遍。";
          update();
        }
      });
    }
    button.addEventListener("click", function () {
      if (!player || button.disabled) return;
      if (!player.paused) {
        player.pause();
        button.textContent = "播放";
        return;
      }
      if (ended) { player.seek(0); ended = false; }
      if (player.audioOut) {
        var audioContext = player.audioOut.context;
        if (audioContext && audioContext.resume) audioContext.resume().catch(function () {});
        player.audioOut.unlock();
      }
      player.play();
      button.textContent = "暂停";
      status.textContent = "";
    });
    seek.addEventListener("input", function () {
      if (!player || seek.disabled) return;
      player.seek(Number(seek.value));
      if (player.paused) player.video.decode();
      ended = false;
      update();
    });
    return { play: play, stop: stop };
  };
})();
