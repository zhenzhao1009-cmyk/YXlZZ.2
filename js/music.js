(function () {
  "use strict";

  window.createBackgroundMusic = function (audio, button, options) {
    var context = null;
    var bufferPromise = null;
    var node = null;
    var offset = 0;
    var startedAt = 0;
    var usePCM = false;
    var requested = false;
    var requestId = 0;

    audio.src = options.source;
    audio.volume = options.volume;
    button.setAttribute("aria-pressed", "false");

    function updateButton(playing, loading) {
      button.classList.toggle("playing", playing);
      button.setAttribute("aria-pressed", String(playing));
      button.setAttribute("aria-busy", String(loading));
      button.setAttribute("aria-label", playing ? "暂停告白气球" : "播放告白气球");
      button.title = loading ? "正在加载告白气球，点击可取消" : "告白气球 · 播放 / 暂停";
    }

    function readPCM(bytes) {
      var data = new DataView(bytes);
      function label(position) {
        return String.fromCharCode(data.getUint8(position), data.getUint8(position + 1),
          data.getUint8(position + 2), data.getUint8(position + 3));
      }
      if (data.byteLength < 12 || label(0) !== "RIFF" || label(8) !== "WAVE") {
        throw new Error("备用音乐文件没有完整加载");
      }
      var channels = 0, sampleRate = 0, frameSize = 0;
      var samplesStart = 0, samplesLength = 0;
      for (var position = 12; position + 8 <= data.byteLength;) {
        var size = data.getUint32(position + 4, true);
        var start = position + 8;
        if (start + size > data.byteLength) throw new Error("备用音乐文件不完整");
        if (label(position) === "fmt ") {
          if (size < 16 || data.getUint16(start, true) !== 1 || data.getUint16(start + 14, true) !== 16) {
            throw new Error("备用音乐需要标准的 16 位 PCM 格式");
          }
          channels = data.getUint16(start + 2, true);
          sampleRate = data.getUint32(start + 4, true);
          frameSize = data.getUint16(start + 12, true);
        }
        if (label(position) === "data") {
          samplesStart = start;
          samplesLength = size;
        }
        position = start + size + (size % 2);
      }
      if (channels < 1 || channels > 2 || sampleRate < 8000 || sampleRate > 192000 ||
          frameSize !== channels * 2 || !samplesLength || samplesLength % frameSize) {
        throw new Error("备用音乐数据无效");
      }
      var frames = samplesLength / frameSize;
      var buffer = context.createBuffer(channels, frames, sampleRate);
      for (var channel = 0; channel < channels; channel++) {
        var output = buffer.getChannelData(channel);
        for (var frame = 0; frame < frames; frame++) {
          output[frame] = data.getInt16(samplesStart + frame * frameSize + channel * 2, true) / 32768;
        }
      }
      return buffer;
    }

    function playPCM(activeRequest) {
      audio.pause();
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return Promise.reject(new Error("当前浏览器无法启用音频，请用 Edge 或 Chrome 打开"));
      if (!context) context = new AudioContextClass();
      var resume = context.resume();
      if (!bufferPromise) {
        bufferPromise = fetch(options.pcmSource).then(function (response) {
          if (!response.ok) throw new Error("备用音乐加载失败，请检查网页的 audio 文件夹");
          return response.arrayBuffer();
        }).then(readPCM).catch(function (error) {
          bufferPromise = null;
          throw error;
        });
      }
      return Promise.all([resume, bufferPromise]).then(function (results) {
        if (activeRequest !== requestId || !requested) return;
        if (context.state !== "running") throw new Error("请再点击音乐按钮，允许浏览器播放声音");
        var buffer = results[1];
        var gain = context.createGain();
        gain.gain.value = options.volume;
        gain.connect(context.destination);
        node = context.createBufferSource();
        node.buffer = buffer;
        node.loop = true;
        node.connect(gain);
        node.onended = function () { gain.disconnect(); };
        offset %= buffer.duration;
        startedAt = context.currentTime;
        node.start(0, offset);
        updateButton(true, false);
      });
    }

    function play() {
      if (requested) return Promise.resolve();
      requested = true;
      var activeRequest = ++requestId;
      updateButton(false, true);
      var playback;
      if (usePCM || (!audio.canPlayType("audio/mpeg") && options.pcmSource)) {
        usePCM = true;
        playback = playPCM(activeRequest);
      } else {
        if (audio.error) audio.load();
        playback = audio.play().catch(function (error) {
          if (activeRequest !== requestId || !requested) return;
          var mediaError = audio.error;
          if (options.pcmSource && (error.name === "NotSupportedError" ||
              (mediaError && (mediaError.code === 3 || mediaError.code === 4)))) {
            usePCM = true;
            return playPCM(activeRequest);
          }
          throw error;
        });
      }
      return playback.catch(function (error) {
        if (activeRequest !== requestId) return;
        requested = false;
        updateButton(false, false);
        throw error;
      });
    }

    function pause() {
      requested = false;
      requestId++;
      audio.pause();
      if (node) {
        offset += context.currentTime - startedAt;
        node.stop();
        node.disconnect();
        node = null;
      }
      updateButton(false, false);
    }

    audio.addEventListener("playing", function () {
      if (requested && !usePCM) updateButton(true, false);
    });
    audio.addEventListener("pause", function () {
      if (!usePCM) {
        requested = false;
        updateButton(false, false);
      }
    });

    return { play: play, pause: pause, isActive: function () { return requested; } };
  };
})();
