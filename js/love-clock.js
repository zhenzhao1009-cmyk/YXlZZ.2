/* Elapsed relationship time, aligned to wall-clock seconds in Asia/Shanghai. */
(function () {
  "use strict";
  var DEFAULT_START = "2024-12-25T00:00:00+08:00";
  var FLIP_MS = 620;
  function parseStart(value) {
    var text = String(value || DEFAULT_START);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) text += "T00:00:00+08:00";
    var timestamp = Date.parse(text);
    return Number.isFinite(timestamp) ? timestamp : Date.parse(DEFAULT_START);
  }
  function elapsedParts(now, start) {
    var total = Math.max(0, Math.floor((now - start) / 1000));
    return {total:total, days:String(Math.floor(total / 86400)).padStart(3,"0"),
      hours:String(Math.floor(total / 3600) % 24).padStart(2,"0"),
      minutes:String(Math.floor(total / 60) % 60).padStart(2,"0"),
      seconds:String(total % 60).padStart(2,"0")};
  }
  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function createDigit(value) {
    var node = element("span", "love-flip-digit");
    var faces = {};
    ["top", "bottom", "leaf-top", "leaf-bottom"].forEach(function (name) {
      var face = element("span", "love-flip-face love-flip-" + name);
      var number = element("span", "love-flip-number", value);
      face.appendChild(number);node.appendChild(face);faces[name] = number;
    });
    var current = value, pending = null, cleanup = null;
    function settle() {
      clearTimeout(cleanup);cleanup = null;
      if (pending !== null) current = pending;
      pending = null;
      Object.keys(faces).forEach(function (name) { faces[name].textContent = current; });
      node.classList.remove("is-flipping");
    }
    function set(next, animate) {
      if (next === (pending === null ? current : pending)) return;
      settle();
      if (!animate) { current = next;settle();return; }
      pending = next;
      faces.top.textContent = next;
      faces.bottom.textContent = current;
      faces["leaf-top"].textContent = current;
      faces["leaf-bottom"].textContent = next;
      node.classList.add("is-flipping");
      cleanup = setTimeout(settle, FLIP_MS + 40);
    }
    node.addEventListener("animationend", function (event) {
      if (event.animationName === "loveFlipBottom") settle();
    });
    return {node:node, set:set, settle:settle};
  }
  function init() {
    var root = document.getElementById("loveClock");
    if (!root) return;
    var display = document.getElementById("loveClockDisplay");
    var readable = document.getElementById("loveClockText");
    var date = document.getElementById("loveClockDate");
    var start = parseStart((window.SITE_CONFIG || {}).relationshipStart || root.dataset.start);
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var units = [], timer = null, lastSecond = null, stopped = false;
    var definitions = [["days","天"],["hours","时"],["minutes","分"],["seconds","秒"]];
    definitions.forEach(function (definition, index) {
      if (index > 1) display.appendChild(element("span", "love-clock-colon", ":"));
      var group = element("div", "love-clock-unit" + (index === 0 ? " love-clock-days" : ""));
      var value = element("div", "love-clock-value");
      group.appendChild(value);group.appendChild(element("span", "love-clock-unit-label", definition[1]));
      display.appendChild(group);
      units.push({key:definition[0], node:value, digits:[]});
    });
    var dateParts = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(start));
    var dateFields = {};
    dateParts.forEach(function (part) { dateFields[part.type] = part.value; });
    date.dateTime = dateFields.year + "-" + dateFields.month + "-" + dateFields.day;
    date.textContent = dateFields.year + "." + dateFields.month + "." + dateFields.day;
    function settleAll() {
      units.forEach(function (unit) { unit.digits.forEach(function (digit) { digit.settle(); }); });
    }
    function update(animate) {
      var value = elapsedParts(Date.now(), start);
      var flip = animate && !reduce.matches && lastSecond !== null && value.total - lastSecond === 1;
      units.forEach(function (unit) {
        var text = value[unit.key];
        while (unit.digits.length > text.length) {
          var removed = unit.digits.shift();removed.settle();unit.node.removeChild(removed.node);
        }
        while (unit.digits.length < text.length) {
          var digit = createDigit("0");
          unit.digits.unshift(digit);unit.node.insertBefore(digit.node, unit.node.firstChild);
        }
        unit.digits.forEach(function (digit, i) { digit.set(text[i] || "0", flip); });
      });
      readable.textContent = "我们已经在一起 " + Number(value.days) + " 天 " + Number(value.hours) + " 时 " + Number(value.minutes) + " 分 " + Number(value.seconds) + " 秒";
      lastSecond = value.total;
      root.dataset.ready = "true";
    }
    function schedule() {
      clearTimeout(timer);
      if (stopped || document.hidden) return;
      timer = setTimeout(function () { update(true);schedule(); }, 1000 - Date.now() % 1000 + 12);
    }
    function pause() { clearTimeout(timer);timer = null;settleAll(); }
    function resume() { if (!stopped && !document.hidden) { update(false);schedule(); } }
    function onVisibility() { if (document.hidden) pause();else resume(); }
    function onMotion() { settleAll();update(false); }
    function stop() {
      if (stopped) return;
      stopped = true;pause();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", pause);window.removeEventListener("pageshow", resume);
      if (reduce.removeEventListener) reduce.removeEventListener("change", onMotion);
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", pause);window.addEventListener("pageshow", resume);
    if (reduce.addEventListener) reduce.addEventListener("change", onMotion);
    window.stopLoveClock = stop;
    update(false);schedule();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
