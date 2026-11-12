/* =========================================================
   配置文件 —— 你只需要改这一个文件
   =========================================================
   效果：从上方俯看三排环绕的照片，
        第一、三排顺时针旋转，第二排逆时针旋转。

   1. 把你们的照片放进 images/ 文件夹
   2. 在下面 photos 里按顺序写上文件名和一句文案
   3. 想换文字 / 音乐 / 旋转速度，也在下面改
   ========================================================= */

window.SITE_CONFIG = {

  /* ---------- 文字 ---------- */
  title: "",            // 可选：照片墙上方标题
  subtitle: "",
  note: "第一年心动，第二年心安。\n往后的每一年，都想有你。",
  sign: "两周年快乐，下一年也要牵紧你的手。",
  tabTitle: "我们的两周年",

  /* ---------- 照片 ---------- */
  // src：照片路径；cap：回忆标题；message：放大照片时显示的两周年寄语
  photos: [
    { src: "images/photo-01.jpg", cap: "第一次见面", message: "如果再回到那一天，我还是会想走近你。" },
    { src: "images/photo-02.jpg", cap: "你笑起来的样子", message: "两年了，看到你笑，我还是会忍不住跟着笑。" },
    { src: "images/photo-03.jpg", cap: "一起吃的第一顿饭", message: "想和你吃很多很多顿饭，从今天到很久以后。" },
    { src: "images/photo-04.jpg", cap: "那天风很软", message: "后来才发现，最让我心软的，一直都是你。" },
    { src: "images/photo-05.jpg", cap: "偷拍你打瞌睡", message: "喜欢你认真生活的样子，也喜欢你迷迷糊糊的样子。" },
    { src: "images/photo-06.jpg", cap: "第一次旅行", message: "去哪里都好，身边是你，就已经很值得期待。" },
    { src: "images/photo-07.jpg", cap: "海边的傍晚", message: "想陪你看很多次日落，也想一起等每一个天亮。" },
    { src: "images/photo-08.jpg", cap: "一起看的电影", message: "故事有很多种结局，我最想要的是身边一直有你。" },
    { src: "images/photo-09.jpg", cap: "你送我的礼物", message: "你给我的小小心意，我都有好好放在心上。" },
    { src: "images/photo-10.jpg", cap: "深夜的便利店", message: "生活里那些不起眼的小事，因为有你，都变得可爱。" },
    { src: "images/photo-11.jpg", cap: "下雨那天", message: "晴天想见你，下雨天也想，把伞偏向你的那一边。" },
    { src: "images/photo-12.jpg", cap: "生日的蜡烛", message: "以后的生日愿望里，我都想悄悄留一个位置给你。" },
    { src: "images/photo-13.jpg", cap: "牵着你的手", message: "这只手，牵了两年，还想继续牵很久很久。" },
    { src: "images/photo-14.jpg", cap: "普通又珍贵的一天", message: "不一定每天都有惊喜，但每一天都想好好爱你。" },
    { src: "images/photo-15.jpg", cap: "想和你去更远的地方", message: "两年只是开头，我们还有好多地方要一起去。" },
    { src: "images/photo-16.jpg", cap: "还要一起很久很久", message: "两周年快乐。我的下一年、下下年，都想和你一起。" }
  ],

  /* ---------- 排布 ---------- */
  layout: {
    rows: 3,              // 三排环绕照片
    perRow: 28,           // 每圈张数
    rowGap: 1.10,         // 行间留白
    cardFill: 0.76,        // 每张照片占圆周格子的比例
    cardAspect: 1.28       // 竖版照片的高宽比
  },

  /* ---------- 镜头 ---------- */
  scene: {
    tilt: -23.5,            // 俯视角度
    cameraDistance: 1.95, // 眼点到圆心的距离 / 半径
    autoRotate: true,
    autoSpeed: 0.075,     // 持续旋转，按 60 帧基准每帧角度
    friction: 0.93,
    dragSpeed: 0.16,
    wheelSpeed: 0.10,    // 滚轮缩放灵敏度
    tiltSpeed: 0.12      // 上下拖动改变俯视角度
  },

  /* ---------- 氛围 ---------- */
  atmosphere: {
    petals: 72           // 从上向下的花瓣雨；手机最多 36 片，设为 0 关闭
  },

  /* ---------- 开场 ---------- */
  intro: {
    kicker: "给我们的两周年",
    heading: "两年啦，还是好喜欢你。",
    text: "给最喜欢的你",   // 开场按钮文字
    show: true          // 是否要开场按钮
  },

  /* ---------- 背景音乐 ---------- */
  // 把 mp3 放进 audio/ 文件夹，这里写路径；没有就留空 ""
  music: "audio/confession-balloon.mp3",
  musicFallback: "audio/confession-balloon-pcm.wav",
  musicVolume: 0.5,

  /* ---------- 其他 ---------- */
  hintText: "拖动转视角 · Shift 拖动平移 · 滚轮缩放",
  hintTouchText: "单指转视角 · 双指移动 / 缩放",
  hintAutoHide: 6000,   // 提示多少毫秒后自动隐藏（0 = 不隐藏）
};
