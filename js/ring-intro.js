/* Manga hands drawn as living particles; the ring uses the gallery's own photos. */
(function () {
  "use strict";
  var overlay, canvas, ctx, particles, maleDepthMask=null, pictures = [], prepared = false, playing = false;
  var MOBILE = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700;
  var DURATION = 8200;
  var WEAR_END = DURATION * .55;
  var SCATTER_AT = WEAR_END + 1000;
  var SCATTER_DURATION = 1600;
  var REVEAL_AT = SCATTER_AT + SCATTER_DURATION - 300;
  var END_AT = SCATTER_AT + SCATTER_DURATION + 350;
  var TAU = Math.PI * 2;
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function random(seed) {
    return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  }
  function polishHandParticles(dots,isMale){
    var unique=new Map(),other=[];
    function finger(dot){return isMale?(dot.x>260&&dot.y>205&&dot.y<470):(dot.x<880&&dot.y>210&&dot.y<510);}
    dots.forEach(function(dot){
      if(!finger(dot)){other.push(dot);return;}
      var key=dot.x+","+dot.y,existing=unique.get(key);
      if(!existing||dot.strength>existing.strength)unique.set(key,dot);
    });
    var fingers=Array.from(unique.values()),grid=new Map(),cell=4;
    fingers.forEach(function(dot){var key=Math.floor(dot.x/cell)+","+Math.floor(dot.y/cell);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(dot);});
    fingers.forEach(function(dot){
      var gx=Math.floor(dot.x/cell),gy=Math.floor(dot.y/cell),neighbours=0;
      for(var x=gx-1;x<=gx+1;x++)for(var y=gy-1;y<=gy+1;y++){
        var nearby=grid.get(x+","+y)||[];
        nearby.forEach(function(p){var dx=p.x-dot.x,dy=p.y-dot.y;if(p!==dot&&dx*dx+dy*dy<10.24)neighbours++;});
      }
      var density=clamp(Math.sqrt(5/(neighbours+1)),.64,1);
      if(neighbours<2&&dot.strength<.6)density*=.45;
      dot.fingerDetail={alpha:density,size:dot.edge?.62+(dot.phase/TAU)*.15:.42+(dot.phase/TAU)*.14};
    });
    return other.concat(fingers);
  }
  function makeHand(points, colour, seed) {
    var rng=random(seed), dots=[];
    points.forEach(function(p,index){
      if(MOBILE && index%2 && !(p[0]===INDEX_TIP.x&&p[1]===INDEX_TIP.y) && !(p[0]===THUMB_TIP.x&&p[1]===THUMB_TIP.y))return;
      dots.push({x:p[0],y:p[1],edge:!!p[3],strength:p[2]/100,
        phase:rng()*TAU,size:p[3]?.8+rng()*.35:.45+rng()*.35,
        driftX:45+rng()*150,driftY:(rng()-.5)*150,delay:rng()*.1});
    });
    return {dots:polishHandParticles(dots,seed===771),colour:colour};
  }
  function prepare(photos) {
    if (prepared) return;
    prepared = true;
    overlay = document.createElement("section");
    overlay.className = "ring-ceremony";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "粒子双手，将回忆戴在你的无名指上");
    overlay.innerHTML = '<div class="ceremony-halo" aria-hidden="true"></div><div class="ceremony-copy"><p class="ceremony-kicker">给我们的两周年</p><h2>把我们的每一天，<br>戴在你的无名指上。</h2><p class="ceremony-caption" role="status">从心动，到相守。</p></div><canvas class="ceremony-canvas" aria-hidden="true"></canvas><button class="ceremony-skip" type="button">跳过动画 <span aria-hidden="true">↗</span></button><p class="ceremony-foot" aria-hidden="true">往后的每一年，都想牵着你的手。</p>';
    document.body.appendChild(overlay);
    canvas = overlay.querySelector("canvas");
    try { ctx = canvas.getContext("2d", {alpha:true}); } catch (_) { ctx = null; }
    var models=window.RING_HAND_POINTS;
    if (!ctx || !models || !models.male || !models.female) return;
    if(typeof Path2D!=="undefined"){
      var depthCanvas=document.createElement("canvas");depthCanvas.width=768;depthCanvas.height=512;
      var depthContext=depthCanvas.getContext("2d");
      if(depthContext){depthContext.scale(.5,.5);depthContext.fillStyle="#000";depthContext.fill(new Path2D("M0 677 C300 621 500 445 715 274 C780 164 820 171 890 176 C970 171 1039 103 1080 107 C1123 108 1177 202 1216 227 C1290 282 1295 324 1346 376 C1374 396 1345 410 1328 396 C1282 387 1242 322 1217 288 C1161 297 1109 280 1085 242 C1045 286 977 299 945 282 C1006 295 1066 310 1097 347 C1127 390 1127 481 1133 495 C1196 480 1266 449 1322 461 C1359 466 1369 511 1322 538 C1204 620 1054 729 905 790 C743 886 638 878 510 852 C308 885 146 978 0 1024 Z"));maleDepthMask=depthCanvas;}
    }
    particles = {
      male:makeHand(models.male,"205,215,250",771),
      female:makeHand(models.female,"255,205,228",452)
    };
    var source = (photos || []).filter(function (p) { return p.thumbnail || p.preview || p.src; });
    for (var i = 0; i < Math.min(source.length, 72); i++) {
      var image = new Image();
      image.decoding = "async";
      image.src = source[i].preview || source[i].thumbnail || source[i].src;
      // Existing inline previews keep the little ring visible even on a slow connection.
      (function (im, fallback) { im.onerror = function () { im.onerror = null; if (fallback) im.src = fallback; }; })(image, source[i].thumbnail || source[i].src);
      pictures.push(image);
    }
  }
  var MALE_GRIP={x:500,y:390};
  var INDEX_TIP={x:489,y:368.5}, THUMB_TIP={x:483.96,y:389.92};
  var FEMALE_WRIST={x:1008.2,y:441};
  function rotatePoint(p,pivot,angle){
    var c=Math.cos(angle),s=Math.sin(angle),x=p.x-pivot.x,y=p.y-pivot.y;
    return {x:pivot.x+x*c-y*s,y:pivot.y+x*s+y*c};
  }
  function femalePoint(p,pose){
    var q=rotatePoint(p,FEMALE_WRIST,pose.angle);
    return {x:q.x+pose.dx,y:q.y+pose.dy};
  }
  // Move the anatomically correct hand as one piece; finger proportions never warp.
  function maleBase(p,pose){
    var q=rotatePoint(p,MALE_GRIP,pose.angle);
    return {x:q.x+pose.dx,y:q.y+pose.dy};
  }
  function malePoint(p,pose){return maleBase(p,pose);}
  // Upper/lower edges measured from the actual female particle silhouette.
  var FINGER_PROFILE=[[560,403.92,406.08],[569,396.36,415.8],[590.6,393.48,418.68],[619.4,393.12,417.96],[648.2,391.32,418.68],[677,388.8,421.2],[705.8,390.96,423],[727.4,389.16,423.72],[738.2,384.84,426.6]];
  function profileAt(x){
    var i=0;while(i<FINGER_PROFILE.length-2&&x>FINGER_PROFILE[i+1][0])i++;
    var a=FINGER_PROFILE[i],b=FINGER_PROFILE[i+1],prev=FINGER_PROFILE[Math.max(0,i-1)],next=FINGER_PROFILE[Math.min(FINGER_PROFILE.length-1,i+2)];
    var span=b[0]-a[0],t=clamp((x-a[0])/span,0,1),t2=t*t,t3=t2*t;
    function edge(field){
      var m0=(b[field]-prev[field])/(b[0]-prev[0]),m1=(next[field]-a[field])/(next[0]-a[0]);
      return {y:(2*t3-3*t2+1)*a[field]+(t3-2*t2+t)*span*m0+(-2*t3+3*t2)*b[field]+(t3-t2)*span*m1,
        slope:((6*t2-6*t)*a[field]+(3*t2-4*t+1)*span*m0+(-6*t2+6*t)*b[field]+(3*t2-2*t)*span*m1)/span};
    }
    var upper=edge(1),lower=edge(2);return {x:x,y:(upper.y+lower.y)/2,top:upper.y,bottom:lower.y,slope:(upper.slope+lower.slope)/2};
  }
  function fingerAt(x){
    var start=FINGER_PROFILE[2][0],p=profileAt(Math.max(start,x));p.y+=(x-Math.max(start,x))*p.slope;p.x=x;return p;
  }
  function maskFinger(pose,alpha){
    ctx.save();ctx.globalAlpha=alpha;ctx.globalCompositeOperation="destination-out";ctx.fillStyle="#000";ctx.beginPath();
    var first=true,min=FINGER_PROFILE[0][0],max=FINGER_PROFILE[FINGER_PROFILE.length-1][0];
    for(var x=min;x<=max;x+=3){var p=profileAt(x),q=femalePoint({x:x,y:p.top},pose);if(first){ctx.moveTo(q.x,q.y);first=false;}else ctx.lineTo(q.x,q.y);}
    for(var x=max;x>=min;x-=3){var p=profileAt(x),q=femalePoint({x:x,y:p.bottom},pose);ctx.lineTo(q.x,q.y);}
    ctx.closePath();ctx.fill();ctx.restore();
  }
  function maskMaleHand(pose,alpha){
    if(!maleDepthMask)return;
    ctx.save();ctx.globalAlpha=alpha;ctx.globalCompositeOperation="destination-out";
    ctx.translate(pose.dx,pose.dy);ctx.translate(MALE_GRIP.x,MALE_GRIP.y);ctx.rotate(pose.angle);ctx.translate(-MALE_GRIP.x,-MALE_GRIP.y);
    ctx.translate(-70.86,200.08);ctx.scale(.42,.42);ctx.fillStyle="#000";ctx.drawImage(maleDepthMask,0,0,1536,1024);ctx.restore();
  }
  function choreography(t,view,seconds){
    var align=smooth(.04,.22,t);
    var travel=.16*smooth(.22,.31,t)+.58*smooth(.315,.46,t)+.26*smooth(.46,.55,t);
    var settle=Math.sin(smooth(.48,.59,t)*Math.PI)*.8;
    var female={angle:mix(.012,-.012,smooth(.12,.46,t))+.003*Math.sin(seconds*.8),
      dx:(1-align)*35,dy:-3*Math.sin(smooth(.17,.55,t)*Math.PI)+settle};
    var startX=FINGER_PROFILE[0][0]-24,wearX=FINGER_PROFILE[FINGER_PROFILE.length-1][0]-14;
    var pathX=mix(startX,wearX,travel)-(1-align)*45,spine=fingerAt(pathX);
    var onFinger=femalePoint({x:pathX,y:spine.y},female),axisAngle=Math.atan(spine.slope)+female.angle;
    var tip=femalePoint(fingerAt(FINGER_PROFILE[0][0]),female),base=femalePoint(fingerAt(wearX),female);
    var ux=Math.cos(axisAngle),uy=Math.sin(axisAngle),nx=-uy,ny=ux;
    var ringX=onFinger.x,ringY=onFinger.y;
    var radius=21.5,band=24;
    var male={angle:axisAngle,dx:ringX-MALE_GRIP.x,dy:ringY-MALE_GRIP.y};
    var index=malePoint(INDEX_TIP,male),thumb=malePoint(THUMB_TIP,male);
    return {female:female,male:male,index:index,thumb:thumb,tip:tip,base:base,travel:travel,
      ringX:ringX,ringY:ringY,radius:radius,band:band,cx:ringX,cy:ringY,
      angle:axisAngle,pathX:pathX,turn:0,release:0,dissolve:0,zoom:0};
  }
  function hand(handData,pose,opacity,gather,scatter,time,direction,pixelScale){
    if(opacity<.005)return;
    ctx.save();ctx.fillStyle="rgb("+handData.colour+")";
    handData.dots.forEach(function(p){
      var born=smooth(p.delay,p.delay+.65,gather),dissolve=scatter*(1+p.delay),drift=(1-born)+dissolve;
      var q=direction<0?malePoint(p,pose):femalePoint(p,pose);
      var detail=p.fingerDetail,jitter=detail?.12:.2;
      var x=q.x+direction*p.driftX*drift+Math.sin(time*.8+p.phase)*jitter;
      var y=q.y+p.driftY*drift+Math.cos(time*.65+p.phase)*jitter;
      var twinkle=detail?.9+Math.sin(time+p.phase)*.1:.8+Math.sin(time*1.4+p.phase)*.2;
      var alpha=opacity*born*Math.max(0,1-dissolve)*twinkle*(.48+p.strength*.52);
      if(detail)alpha*=detail.alpha;
      var size=Math.max(detail?detail.size:p.size,(detail?.42:.48)/pixelScale);
      if(p.edge){ctx.globalAlpha=alpha*(detail?.045:.10);ctx.beginPath();ctx.arc(x,y,size*(detail?1.85:2.4),0,TAU);ctx.fill();}
      ctx.globalAlpha=alpha*(p.edge?.92:.62);ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.fill();
    });
    ctx.restore();
  }
  function texture(image, p) {
    var w = image.naturalWidth, h = image.naturalHeight;
    if (!w || !h) return;
    function triangle(a, b, c, first) {
      ctx.save(); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(c.x,c.y); ctx.closePath(); ctx.clip();
      if (first) ctx.transform((p[1].x-p[0].x)/w,(p[1].y-p[0].y)/w,(p[2].x-p[1].x)/h,(p[2].y-p[1].y)/h,p[0].x,p[0].y);
      else ctx.transform((p[2].x-p[3].x)/w,(p[2].y-p[3].y)/w,(p[3].x-p[0].x)/h,(p[3].y-p[0].y)/h,p[0].x,p[0].y);
      ctx.drawImage(image,0,0); ctx.restore();
    }
    triangle(p[0],p[1],p[2],true); triangle(p[0],p[2],p[3],false);
  }
  function ringCards(cx, cy, radius, band, turn, phase, alpha, axisAngle) {
    var cards = [], zAngle = -Math.PI / 2 * (1 - turn), tilt = -23.5 * Math.PI / 180 * turn;
    var cz = Math.cos(zAngle), sz = Math.sin(zAngle), ct = Math.cos(tilt), st = Math.sin(tilt);
    var angle=axisAngle*(1-turn),ca=Math.cos(angle),sa=Math.sin(angle);
    function point(theta, axial) {
      var x = radius*Math.sin(theta), y = axial, z = -radius*Math.cos(theta);
      var rx = x*cz-y*sz, ry = x*sz+y*cz;
      var fy = ry*ct-z*st, fz = ry*st+z*ct;
      var px=rx+fz*.26*(1-turn);
      return {x:cx+px*ca-fy*sa,y:cy+px*sa+fy*ca,z:fz};
    }
    for (var row = 0; row < 3; row++) {
      for (var i = 0; i < 24; i++) {
        var theta = TAU*i/24 + phase*(row%2 ? -1 : 1), gap = .055 + .14*turn;
        var a = theta+gap/2, b = theta+TAU/24-gap/2;
        var low = band*(row/3-.5), high = band*((row+1)/3-.5)-mix(.8,band*.025,turn);
        var p = [point(a,low),point(b,low),point(b,high),point(a,high)];
        cards.push({p:p,z:(p[0].z+p[2].z)/2,image:pictures.length ? pictures[(row*24+i)%pictures.length] : null,alpha:alpha});
      }
    }
    cards.sort(function (a,b) {return a.z-b.z;});
    cards.opening={x:cx-band/2*ca,y:cy-band/2*sa,rx:radius*.26,ry:radius,rotation:angle,amount:1-smooth(0,.28,turn)};
    return cards;
  }
  function drawCards(cards, front) {
    ctx.save();
    var opening=cards.opening;
    if(opening && opening.amount>.01){
      ctx.beginPath();ctx.rect(-12000,-12000,24000,24000);
      ctx.ellipse(opening.x,opening.y,opening.rx*opening.amount,opening.ry*opening.amount,opening.rotation,0,TAU);
      ctx.clip("evenodd");
    }
    cards.forEach(function (card) {
      if ((card.z >= 0) !== front) return;
      var p = card.p;
      ctx.save(); ctx.globalAlpha = card.alpha * .9;
      ctx.beginPath(); ctx.moveTo(p[0].x,p[0].y); for (var j=1;j<4;j++) ctx.lineTo(p[j].x,p[j].y); ctx.closePath();
      ctx.fillStyle = "#442b3b";ctx.fill();
      if (card.image && card.image.complete && card.image.naturalWidth) texture(card.image,p);
      ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);for(var k=1;k<4;k++)ctx.lineTo(p[k].x,p[k].y);ctx.closePath();
      ctx.globalAlpha = card.alpha;
      ctx.fillStyle = "rgba(244,183,205,.08)";ctx.fill();
      ctx.strokeStyle = "rgba(245,207,188,.62)";ctx.lineWidth = .6;ctx.stroke();ctx.restore();
    });
    ctx.restore();
    if(front && opening && opening.amount>.01 && cards.length){
      ctx.save();ctx.globalAlpha=cards[0].alpha*opening.amount;ctx.strokeStyle="rgba(249,208,216,.7)";ctx.lineWidth=.8;
      ctx.beginPath();ctx.ellipse(opening.x,opening.y,opening.rx*opening.amount,opening.ry*opening.amount,opening.rotation,0,TAU);ctx.stroke();ctx.restore();
    }
  }
  function sparkle(x, y, amount, time) {
    if (amount <= 0) return;
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=amount;
    var glow=ctx.createRadialGradient(0,0,0,0,0,19);glow.addColorStop(0,"rgba(255,230,214,.6)");glow.addColorStop(1,"rgba(255,230,214,0)");
    ctx.fillStyle=glow;ctx.fillRect(-19,-19,38,38);ctx.strokeStyle="#ffe4d6";ctx.lineWidth=.9;
    ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.moveTo(0,-11);ctx.lineTo(0,11);ctx.stroke();
    ctx.fillStyle="#ffe4d6";for(var i=0;i<8;i++){var a=i/8*TAU+time*.1;ctx.globalAlpha=amount*(1-i/10);ctx.beginPath();ctx.arc(Math.cos(a)*(15+i*2),Math.sin(a)*(15+i*2),.7,0,TAU);ctx.fill();}ctx.restore();
  }
  function sceneScatter(view, pose, cards) {
    var snapshot = document.createElement("canvas"), scale = Math.min(1, 1000 / Math.max(view.w, view.h));
    snapshot.width = Math.ceil(view.w * scale);
    snapshot.height = Math.ceil(view.h * scale);
    var sample = snapshot.getContext("2d"), points = [], rng = random(6207), snapshotReady = false;
    try {
      sample.setTransform(scale, 0, 0, scale, 0, 0);
      sample.drawImage(canvas, 0, 0, view.w, view.h);
      [".ceremony-kicker", ".ceremony-copy h2", ".ceremony-caption", ".ceremony-foot"].forEach(function (selector) {
        var element = overlay.querySelector(selector), style = window.getComputedStyle(element);
        var bounds = element.getBoundingClientRect(), lines = (element.innerText || element.textContent).trim().split(/\n+/);
        var fontSize = parseFloat(style.fontSize), lineHeight = parseFloat(style.lineHeight) || fontSize * 1.6;
        sample.font = style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
        sample.fillStyle = style.color;
        sample.textAlign = "center";
        sample.textBaseline = "middle";
        if ("letterSpacing" in sample) sample.letterSpacing = style.letterSpacing;
        sample.globalAlpha = Number(style.opacity) || 1;
        lines.forEach(function (line, index) {
          sample.fillText(line, bounds.left + bounds.width / 2,
            bounds.top + (bounds.height - lineHeight * lines.length) / 2 + (index + .5) * lineHeight);
        });
      });
      var pixels = sample.getImageData(0, 0, snapshot.width, snapshot.height).data;
      snapshotReady = true;
      for (var y = 0; y < snapshot.height; y += 2) {
        for (var x = 0; x < snapshot.width; x += 2) {
          var offset = (y * snapshot.width + x) * 4;
          if (pixels[offset + 3] < 18) continue;
          points.push({x:x / scale, y:y / scale, alpha:pixels[offset + 3] / 255,
            colour:[pixels[offset], pixels[offset + 1], pixels[offset + 2]].map(function (value) {
              return Math.floor(value / 32) * 32 + 16;
            }).join(",")});
        }
      }
    } catch (error) {
      [particles.male, particles.female].forEach(function (handData, index) {
        handData.dots.forEach(function (dot) {
          var point = index === 0 ? malePoint(dot, pose.male) : femalePoint(dot, pose.female);
          points.push({x:view.ox + point.x * view.scale, y:view.oy + point.y * view.scale,
            alpha:.65, colour:handData.colour});
        });
      });
      cards.forEach(function (card) {
        card.p.forEach(function (point) {
          points.push({x:view.ox + point.x * view.scale, y:view.oy + point.y * view.scale,
            alpha:.8, colour:"245,207,188"});
        });
      });
    }
    var maximum = MOBILE ? 1600 : 2600, stride = Math.max(1, points.length / maximum), groups = {};
    for (var index = 0; index < points.length; index += stride) {
      var point = points[Math.floor(index)];
      point.alpha = Math.max(.45, point.alpha);
      var angle = Math.atan2(point.y - view.h * .54, point.x - view.w / 2) + (rng() - .5) * 1.4;
      var distance = (100 + rng() * 200) * Math.min(view.w, view.h) / 700;
      point.dx = Math.cos(angle) * distance;
      point.dy = Math.sin(angle) * distance - 30 * view.h / 800;
      point.size = .65 + rng() * 1.2;
      point.delay = rng() * .08;
      if (!groups[point.colour]) groups[point.colour] = [];
      groups[point.colour].push(point);
    }
    return {groups:Object.keys(groups).map(function (colour) { return {colour:colour, points:groups[colour]}; }),
      snapshot:snapshotReady ? snapshot : null, width:view.w, height:view.h};
  }

  function drawScatter(frame, progress) {
    if (frame.snapshot && progress < .22) {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1 - smooth(0, .22, progress);
      ctx.drawImage(frame.snapshot, 0, 0, frame.width, frame.height);
    }
    var dustAlpha = frame.snapshot ? smooth(0, .16, progress) : 1;
    ctx.globalCompositeOperation = "lighter";
    frame.groups.forEach(function (group) {
      ctx.fillStyle = "rgb(" + group.colour + ")";
      group.points.forEach(function (point) {
        var local = clamp((progress - point.delay) / (1 - point.delay), 0, 1);
        var distance = smooth(0, 1, local);
        ctx.globalAlpha = dustAlpha * point.alpha * (1 - smooth(.22, 1, local));
        var size = point.size * (1 - local * .35);
        ctx.fillRect(point.x + point.dx * distance, point.y + point.dy * distance, size, size);
      });
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  window.createRingCeremony = function (photos) {
    prepare(photos);
    return function (reveal, complete) {
      if (playing) return;
      playing = true;
      var skip=overlay.querySelector(".ceremony-skip"), caption=overlay.querySelector(".ceremony-caption");
      var frameId=null, failsafe=null, finished=false, revealed=false, skipped=false, start=null, lastPaint=-Infinity, view, scatterFrame=null;
      overlay.hidden=false;document.body.classList.add("ceremony-active");skip.focus({preventScroll:true});
      function openGallery(){if(revealed)return;revealed=true;document.body.classList.add("ceremony-reveal");reveal({skip:skipped});}
      function finish(){
        if(finished)return;finished=true;if(frameId!==null)cancelAnimationFrame(frameId);clearTimeout(failsafe);
        openGallery();overlay.hidden=true;document.body.classList.remove("ceremony-active","ceremony-reveal");
        scatterFrame=null;
        skip.removeEventListener("click",skipAnimation);document.removeEventListener("keydown",onKey);document.removeEventListener("visibilitychange",onVisibility);window.removeEventListener("resize",resize);complete({skip:skipped});
      }
      function skipAnimation(){skipped=true;finish();}
      function onKey(e){if(e.key==="Escape")skipAnimation();else if(e.key==="Tab"){e.preventDefault();skip.focus({preventScroll:true});}}
      function onVisibility(){if(document.hidden)skipAnimation();}
      function resize(){
        var w=window.innerWidth,h=window.innerHeight,dpr=Math.min(window.devicePixelRatio||1,MOBILE?1.5:2);
        canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
        var scale=w<700 ? w*1.35/1000 : Math.min(w/1000,h*.9/600);
        var portrait=h>w,ox=(w-1000*scale)/2,oy=h*(portrait?.56:.55)-399*scale;
        var scene=(window.SITE_CONFIG||{}).scene||{},distance=clamp(typeof scene.cameraDistance==="number"?scene.cameraDistance:2.12,1.75,2.5);
        var projected=Math.min(w,h*1.9)*(portrait?1.12:.98)/distance;
        view={w:w,h:h,dpr:dpr,scale:scale,ox:ox,oy:oy,targetX:500,targetY:(h*(portrait?.47:.55)-oy)/scale,radius:projected/scale};
      }
      function paint(time){
        if(finished)return;if(start===null)start=time;
        var elapsed=time-start,t=Math.min(.55,clamp(elapsed/DURATION,0,1));
        var targetFps=Math.max(1,Math.min(120,Number(((window.SITE_CONFIG||{}).performance||{}).targetFps)||120));
        if(elapsed-lastPaint>=1000/targetFps-.5||elapsed>=END_AT){
          lastPaint=elapsed;
          ctx.setTransform(view.dpr,0,0,view.dpr,0,0);ctx.clearRect(0,0,view.w,view.h);
          if(scatterFrame){
            drawScatter(scatterFrame,clamp((elapsed-SCATTER_AT)/SCATTER_DURATION,0,1));
          }else{
          ctx.translate(view.ox,view.oy);ctx.scale(view.scale,view.scale);
          var gather=smooth(0,.19,t),seconds=elapsed/1000,pose=choreography(t,view,seconds);
          var ringAlpha=gather;
          var cards=ringCards(pose.cx,pose.cy,pose.radius,pose.band,0,0,ringAlpha,pose.angle);
          drawCards(cards,false);
          var handAlpha=gather*(1-pose.dissolve);
          maskFinger(pose.female,handAlpha*gather);
          hand(particles.female,pose.female,handAlpha,gather,pose.dissolve,seconds,1,view.scale);
          drawCards(cards,true);
          maskMaleHand(pose.male,handAlpha*gather);
          hand(particles.male,pose.male,handAlpha,gather,pose.dissolve,seconds,-1,view.scale);
          var glint=smooth(WEAR_END,WEAR_END+180,elapsed)*(1-smooth(WEAR_END+280,WEAR_END+600,elapsed));
          sparkle(pose.ringX-pose.radius*.14,pose.ringY-pose.radius,glint,seconds);
          overlay.style.setProperty("--ceremony-copy-opacity",String(smooth(0,.13,t)));
          overlay.style.setProperty("--ceremony-foot-opacity",String(gather));
          if(elapsed>=WEAR_END)caption.textContent="往后的每一天，都有你。";
          if(elapsed>=SCATTER_AT){
            scatterFrame=sceneScatter(view,pose,cards);
            overlay.style.setProperty("--ceremony-copy-opacity","0");
            overlay.style.setProperty("--ceremony-foot-opacity","0");
            ctx.setTransform(view.dpr,0,0,view.dpr,0,0);ctx.clearRect(0,0,view.w,view.h);
            drawScatter(scatterFrame,0);
          }
          }
        }
        if(elapsed>=REVEAL_AT)openGallery();
        if(elapsed>=END_AT){finish();return;}
        frameId=requestAnimationFrame(paint);
      }
      skip.addEventListener("click",skipAnimation);document.addEventListener("keydown",onKey);document.addEventListener("visibilitychange",onVisibility);
      if(!ctx||!particles||window.matchMedia("(prefers-reduced-motion: reduce)").matches){skipAnimation();return;}
      window.addEventListener("resize",resize);resize();overlay.classList.add("is-playing");
      // Background tabs, a lost frame callback, and a failed Canvas must never trap the visitor.
      failsafe=setTimeout(skipAnimation,END_AT+2500);frameId=requestAnimationFrame(paint);
    };
  };
})();
