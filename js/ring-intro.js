/* Manga hands drawn as living particles; the ring uses the gallery's own photos. */
(function () {
  "use strict";
  var overlay, canvas, ctx, particles, pictures = [], prepared = false, playing = false;
  var MOBILE = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700;
  var DURATION = 8200;
  var WEAR_END = DURATION * .55;
  var SCATTER_AT = WEAR_END + 1000;
  var SCATTER_DURATION = 1600;
  var REVEAL_AT = SCATTER_AT + SCATTER_DURATION;
  var END_AT = REVEAL_AT + 350;
  var TAU = Math.PI * 2;
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function random(seed) {
    return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  }
  function makeHand(points, colour, seed) {
    var rng=random(seed), dots=[];
    points.forEach(function(p,index){
      if(MOBILE && index%2 && !(p[0]===INDEX_TIP.x&&p[1]===INDEX_TIP.y) && !(p[0]===THUMB_TIP.x&&p[1]===THUMB_TIP.y))return;
      dots.push({x:p[0],y:p[1],edge:!!p[3],strength:p[2]/100,
        phase:rng()*TAU,size:p[3]?.8+rng()*.35:.45+rng()*.35,
        indexWeight:fingerInfluence({x:p[0],y:p[1]},"index"),
        thumbWeight:fingerInfluence({x:p[0],y:p[1]},"thumb"),
        driftX:45+rng()*150,driftY:(rng()-.5)*150,delay:rng()*.1});
    });
    // A fixed-length forearm extends beyond the crop; it moves with the hand as one piece.
    if(seed===771){
      for(var i=0;i<(MOBILE?150:300);i++){
        var x=-rng()*520,edge=i%3===0,y=(edge?(i%2?303+x*.02:520-x*.01):mix(303,520,rng()))+(rng()-.5)*2;
        dots.push({x:x,y:y,edge:edge,strength:(edge?.65:.25)*Math.exp(x/190),phase:rng()*TAU,size:edge?.8:.5,
          indexWeight:0,thumbWeight:0,driftX:45+rng()*150,driftY:(rng()-.5)*150,delay:rng()*.1});
      }
    }
    return {dots:dots,colour:colour};
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
  var INDEX_TIP={x:463,y:318}, THUMB_TIP={x:400,y:427};
  var FEMALE_WRIST={x:930,y:392};
  function rotatePoint(p,pivot,angle){
    var c=Math.cos(angle),s=Math.sin(angle),x=p.x-pivot.x,y=p.y-pivot.y;
    return {x:pivot.x+x*c-y*s,y:pivot.y+x*s+y*c};
  }
  function femalePoint(p,pose){
    var q=rotatePoint(p,FEMALE_WRIST,pose.angle);
    return {x:q.x+pose.dx,y:q.y+pose.dy};
  }
  var PALM_PIVOT={x:265,y:365};
  var INDEX_CHAIN={root:{x:250,y:242},joint:{x:366,y:273},tip:INDEX_TIP,bend:-1};
  var THUMB_CHAIN={root:{x:210,y:418},joint:{x:315,y:426},tip:THUMB_TIP,bend:1};
  // Bind only the active finger surfaces; the three folded fingers keep their resting pose.
  var INDEX_AREA=[[242,205],[330,210],[390,250],[435,283],[477,304],[478,335],[441,337],[404,318],[367,306],[337,288],[300,289],[269,293],[242,290]];
  var THUMB_AREA=[[205,385],[275,384],[338,391],[385,398],[409,415],[411,445],[380,455],[330,463],[275,477],[220,487],[205,460]];
  function insidePolygon(p,polygon){
    var inside=false;for(var i=0,j=polygon.length-1;i<polygon.length;j=i++){
      var a=polygon[i],b=polygon[j];
      if((a[1]>p.y)!==(b[1]>p.y)&&p.x<(b[0]-a[0])*(p.y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    }return inside;
  }
  function fingerInfluence(p,finger){
    var area=finger==="index"?INDEX_AREA:THUMB_AREA;
    return insidePolygon(p,area)?smooth(finger==="index"?240:210,finger==="index"?290:265,p.x):0;
  }
  function maleBase(p,pose){
    var q=rotatePoint(p,PALM_PIVOT,pose.angle);
    return {x:q.x+pose.dx,y:q.y+pose.dy};
  }
  function inverseMale(p,pose){return rotatePoint({x:p.x-pose.dx,y:p.y-pose.dy},PALM_PIVOT,-pose.angle);}
  // Solve a two-joint chain using rotations only: both segment lengths are constant.
  function solveFinger(chain,target){
    var a=chain.root,b=chain.joint,c=chain.tip;
    var l1=Math.hypot(b.x-a.x,b.y-a.y),l2=Math.hypot(c.x-b.x,c.y-b.y);
    var dx=target.x-a.x,dy=target.y-a.y,distance=Math.hypot(dx,dy);
    var reach=clamp(distance,Math.abs(l1-l2)+.01,l1+l2-.01),direction=Math.atan2(dy,dx);
    var bend=Math.acos(clamp((l1*l1+reach*reach-l2*l2)/(2*l1*reach),-1,1));
    var proximal=direction+chain.bend*bend;
    var elbow={x:a.x+Math.cos(proximal)*l1,y:a.y+Math.sin(proximal)*l1};
    var end={x:a.x+Math.cos(direction)*reach,y:a.y+Math.sin(direction)*reach};
    return {chain:chain,joint:elbow,tip:end,lengths:[l1,l2],
      first:proximal-Math.atan2(b.y-a.y,b.x-a.x),
      second:Math.atan2(end.y-elbow.y,end.x-elbow.x)-Math.atan2(c.y-b.y,c.x-b.x)};
  }
  function fingerPoint(p,bone){
    var joint=bone.chain.joint;
    var blend=bone.chain===INDEX_CHAIN?45:32;
    var along=smooth(joint.x-blend,joint.x+blend,p.x);
    var angle=mix(bone.first,bone.second,along);
    var q=rotatePoint(p,joint,angle);
    return {x:q.x+bone.joint.x-joint.x,y:q.y+bone.joint.y-joint.y};
  }
  function malePoint(p,pose){
    var wi=p.indexWeight===undefined?fingerInfluence(p,"index"):p.indexWeight;
    var wt=p.thumbWeight===undefined?fingerInfluence(p,"thumb"):p.thumbWeight;
    var local={x:p.x,y:p.y};
    if(wi>0){var index=fingerPoint(p,pose.indexBone);local.x+=wi*(index.x-p.x);local.y+=wi*(index.y-p.y);}
    if(wt>0){var thumb=fingerPoint(p,pose.thumbBone);local.x+=wt*(thumb.x-p.x);local.y+=wt*(thumb.y-p.y);}
    return maleBase(local,pose);
  }
  // Upper/lower edges measured from the actual female particle silhouette.
  var FINGER_PROFILE=[
    [531,393,399],[545,391.5,411],[560,389,417],[580,388.5,418],
    [600,384,417],[620,381,414],[640,378,413.5],[660,374,412],
    [680,375,410],[700,364,406.5],[720,354.5,405],[740,353,405.5]
  ];
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
    var p=profileAt(Math.max(545,x));p.y+=(x-Math.max(545,x))*p.slope;p.x=x;return p;
  }
  function maskFinger(pose,alpha){
    ctx.save();ctx.globalAlpha=alpha;ctx.globalCompositeOperation="destination-out";ctx.fillStyle="#000";ctx.beginPath();
    var first=true;
    for(var x=531;x<=740;x+=3){var p=profileAt(x),q=femalePoint({x:x,y:p.top},pose);if(first){ctx.moveTo(q.x,q.y);first=false;}else ctx.lineTo(q.x,q.y);}
    for(var x=740;x>=531;x-=3){var p=profileAt(x),q=femalePoint({x:x,y:p.bottom},pose);ctx.lineTo(q.x,q.y);}
    ctx.closePath();ctx.fill();ctx.restore();
  }
  function choreography(t,view,seconds){
    var align=smooth(.04,.22,t),release=smooth(.59,.70,t),retreat=smooth(.65,.79,t);
    var travel=.16*smooth(.22,.31,t)+.58*smooth(.315,.46,t)+.26*smooth(.46,.55,t);
    var settle=Math.sin(smooth(.48,.59,t)*Math.PI)*.8;
    var female={angle:mix(.012,-.012,smooth(.12,.46,t))+.003*Math.sin(seconds*.8),
      dx:(1-align)*35,dy:-3*Math.sin(smooth(.17,.55,t)*Math.PI)+settle};
    var pathX=mix(507,700,travel)-(1-align)*45,spine=fingerAt(pathX);
    var onFinger=femalePoint({x:pathX,y:spine.y},female),axisAngle=Math.atan(spine.slope)+female.angle;
    var tip=femalePoint(fingerAt(535),female),base=femalePoint(fingerAt(700),female);
    var ux=Math.cos(axisAngle),uy=Math.sin(axisAngle),nx=-uy,ny=ux;
    var ringX=onFinger.x,ringY=onFinger.y;
    var radius=20.5+1.3*Math.sin(travel*Math.PI)+.8*smooth(.7,1,travel),band=24;
    var index={x:ringX+ux*(-4)-nx*(radius*.92+release*13)-ux*retreat*85,
      y:ringY+uy*(-4)-ny*(radius*.92+release*13)-uy*retreat*85-retreat*8};
    var thumb={x:ringX+ux*(-5)+nx*(radius*.92+release*18)-ux*retreat*85,
      y:ringY+uy*(-5)+ny*(radius*.92+release*18)-uy*retreat*85-retreat*8};
    var male={angle:.02*Math.sin(travel*Math.PI)-retreat*.05};
    // Place the palm around a relaxed thumb, instead of forcing the thumb into a hook.
    var root=THUMB_CHAIN.root,joint=THUMB_CHAIN.joint,tipSource=THUMB_CHAIN.tip;
    var l1=Math.hypot(joint.x-root.x,joint.y-root.y),l2=Math.hypot(tipSource.x-joint.x,tipSource.y-joint.y);
    var first=.045+release*.06,second=-.24+release*.18;
    var relaxedTip={x:root.x+Math.cos(first)*l1+Math.cos(second)*l2,
      y:root.y+Math.sin(first)*l1+Math.sin(second)*l2};
    var relaxedWorld=rotatePoint(relaxedTip,PALM_PIVOT,male.angle);
    male.dx=thumb.x-relaxedWorld.x;male.dy=thumb.y-relaxedWorld.y;
    male.indexBone=solveFinger(INDEX_CHAIN,inverseMale(index,male));
    male.thumbBone=solveFinger(THUMB_CHAIN,inverseMale(thumb,male));
    return {female:female,male:male,index:index,thumb:thumb,tip:tip,base:base,travel:travel,
      ringX:ringX,ringY:ringY,radius:radius,band:band,cx:ringX,cy:ringY,
      angle:axisAngle,pathX:pathX,turn:0,release:release,dissolve:0,zoom:0};
  }
  function hand(handData,pose,opacity,gather,scatter,time,direction,pixelScale){
    if(opacity<.005)return;
    ctx.save();ctx.fillStyle="rgb("+handData.colour+")";
    handData.dots.forEach(function(p){
      var born=smooth(p.delay,p.delay+.65,gather),dissolve=scatter*(1+p.delay),drift=(1-born)+dissolve;
      var q=direction<0?malePoint(p,pose):femalePoint(p,pose);
      var x=q.x+direction*p.driftX*drift+Math.sin(time*.8+p.phase)*.2;
      var y=q.y+p.driftY*drift+Math.cos(time*.65+p.phase)*.2;
      var twinkle=.8+Math.sin(time*1.4+p.phase)*.2;
      var alpha=opacity*born*Math.max(0,1-dissolve)*twinkle*(.48+p.strength*.52);
      var size=Math.max(p.size,.48/pixelScale);
      if(p.edge){ctx.globalAlpha=alpha*.10;ctx.beginPath();ctx.arc(x,y,size*2.4,0,TAU);ctx.fill();}
      ctx.globalAlpha=alpha*(p.edge?.92:.62);ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.fill();
    });ctx.restore();
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
      var frameId=null, failsafe=null, finished=false, revealed=false, start=null, lastPaint=-Infinity, view, scatterFrame=null;
      overlay.hidden=false;document.body.classList.add("ceremony-active");skip.focus({preventScroll:true});
      function openGallery(){if(revealed)return;revealed=true;document.body.classList.add("ceremony-reveal");reveal();}
      function finish(){
        if(finished)return;finished=true;if(frameId!==null)cancelAnimationFrame(frameId);clearTimeout(failsafe);
        openGallery();overlay.hidden=true;document.body.classList.remove("ceremony-active","ceremony-reveal");
        scatterFrame=null;
        skip.removeEventListener("click",finish);document.removeEventListener("keydown",onKey);document.removeEventListener("visibilitychange",onVisibility);window.removeEventListener("resize",resize);complete();
      }
      function onKey(e){if(e.key==="Escape")finish();else if(e.key==="Tab"){e.preventDefault();skip.focus({preventScroll:true});}}
      function onVisibility(){if(document.hidden)finish();}
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
      skip.addEventListener("click",finish);document.addEventListener("keydown",onKey);document.addEventListener("visibilitychange",onVisibility);
      if(!ctx||!particles||window.matchMedia("(prefers-reduced-motion: reduce)").matches){finish();return;}
      window.addEventListener("resize",resize);resize();overlay.classList.add("is-playing");
      // Background tabs, a lost frame callback, and a failed Canvas must never trap the visitor.
      failsafe=setTimeout(finish,END_AT+2500);frameId=requestAnimationFrame(paint);
    };
  };
})();
