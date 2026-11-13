/* =========================================================
   配置文件 —— 你只需要改这一个文件
   =========================================================
   效果：从上方俯看三圈照片和一圈视频，
        第一、三排顺时针旋转，第二、四排逆时针旋转。

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
  // src：大图；thumbnail：照片墙缩略图；cap：回忆标题；message：两周年寄语
  photos: [
    {"src":"images/memories/photo-001.jpg","thumbnail":"images/memories/thumb-001.jpg","cap":"和你在一起","message":"如果再回到那一天，我还是会想走近你。"},
    {"src":"images/memories/photo-002.jpg","thumbnail":"images/memories/thumb-002.jpg","cap":"把喜欢留在这一刻","message":"两年了，看到你笑，我还是会忍不住跟着笑。"},
    {"src":"images/memories/photo-003.jpg","thumbnail":"images/memories/thumb-003.jpg","cap":"心动有迹可循","message":"想和你吃很多很多顿饭，从今天到很久以后。"},
    {"src":"images/memories/photo-004.jpg","thumbnail":"images/memories/thumb-004.jpg","cap":"镜头里的偏爱","message":"后来才发现，最让我心软的，一直都是你。"},
    {"src":"images/memories/photo-005.jpg","thumbnail":"images/memories/thumb-005.jpg","cap":"想把日常过成永远","message":"喜欢你认真生活的样子，也喜欢你迷迷糊糊的样子。"},
    {"src":"images/memories/photo-006.jpg","thumbnail":"images/memories/thumb-006.jpg","cap":"陪你慢慢走","message":"去哪里都好，身边是你，就已经很值得期待。"},
    {"src":"images/memories/photo-007.jpg","thumbnail":"images/memories/thumb-007.jpg","cap":"我们的好天气","message":"想陪你看很多次日落，也想一起等每一个天亮。"},
    {"src":"images/memories/photo-008.jpg","thumbnail":"images/memories/thumb-008.jpg","cap":"有你就很甜","message":"故事有很多种结局，我最想要的是身边一直有你。"},
    {"src":"images/memories/photo-009.jpg","thumbnail":"images/memories/thumb-009.jpg","cap":"收藏这一秒","message":"你给我的小小心意，我都有好好放在心上。"},
    {"src":"images/memories/photo-010.jpg","thumbnail":"images/memories/thumb-010.jpg","cap":"每一天都更喜欢你","message":"生活里那些不起眼的小事，因为有你，都变得可爱。"},
    {"src":"images/memories/photo-011.jpg","thumbnail":"images/memories/thumb-011.jpg","cap":"平凡日子里的光","message":"晴天想见你，下雨天也想，把伞偏向你的那一边。"},
    {"src":"images/memories/photo-012.jpg","thumbnail":"images/memories/thumb-012.jpg","cap":"一起走过的风景","message":"以后的生日愿望里，我都想悄悄留一个位置给你。"},
    {"src":"images/memories/photo-013.jpg","thumbnail":"images/memories/thumb-013.jpg","cap":"想念有了模样","message":"这只手，牵了两年，还想继续牵很久很久。"},
    {"src":"images/memories/photo-014.jpg","thumbnail":"images/memories/thumb-014.jpg","cap":"最喜欢的你","message":"不一定每天都有惊喜，但每一天都想好好爱你。"},
    {"src":"images/memories/photo-015.jpg","thumbnail":"images/memories/thumb-015.jpg","cap":"两个人的小幸福","message":"两年只是开头，我们还有好多地方要一起去。"},
    {"src":"images/memories/photo-016.jpg","thumbnail":"images/memories/thumb-016.jpg","cap":"往后的日子也是你","message":"两周年快乐。我的下一年、下下年，都想和你一起。"},
    {"src":"images/memories/photo-017.jpg","thumbnail":"images/memories/thumb-017.jpg","cap":"浪漫藏在日常里","message":"如果再回到那一天，我还是会想走近你。"},
    {"src":"images/memories/photo-018.jpg","thumbnail":"images/memories/thumb-018.jpg","cap":"和你在一起","message":"两年了，看到你笑，我还是会忍不住跟着笑。"},
    {"src":"images/memories/photo-019.jpg","thumbnail":"images/memories/thumb-019.jpg","cap":"把喜欢留在这一刻","message":"想和你吃很多很多顿饭，从今天到很久以后。"},
    {"src":"images/memories/photo-020.jpg","thumbnail":"images/memories/thumb-020.jpg","cap":"心动有迹可循","message":"后来才发现，最让我心软的，一直都是你。"},
    {"src":"images/memories/photo-021.jpg","thumbnail":"images/memories/thumb-021.jpg","cap":"镜头里的偏爱","message":"喜欢你认真生活的样子，也喜欢你迷迷糊糊的样子。"},
    {"src":"images/memories/photo-022.jpg","thumbnail":"images/memories/thumb-022.jpg","cap":"想把日常过成永远","message":"去哪里都好，身边是你，就已经很值得期待。"},
    {"src":"images/memories/photo-023.jpg","thumbnail":"images/memories/thumb-023.jpg","cap":"陪你慢慢走","message":"想陪你看很多次日落，也想一起等每一个天亮。"},
    {"src":"images/memories/photo-024.jpg","thumbnail":"images/memories/thumb-024.jpg","cap":"我们的好天气","message":"故事有很多种结局，我最想要的是身边一直有你。"},
    {"src":"images/memories/photo-025.jpg","thumbnail":"images/memories/thumb-025.jpg","cap":"有你就很甜","message":"你给我的小小心意，我都有好好放在心上。"},
    {"src":"images/memories/photo-026.jpg","thumbnail":"images/memories/thumb-026.jpg","cap":"收藏这一秒","message":"生活里那些不起眼的小事，因为有你，都变得可爱。"},
    {"src":"images/memories/photo-027.jpg","thumbnail":"images/memories/thumb-027.jpg","cap":"每一天都更喜欢你","message":"晴天想见你，下雨天也想，把伞偏向你的那一边。"},
    {"src":"images/memories/photo-028.jpg","thumbnail":"images/memories/thumb-028.jpg","cap":"平凡日子里的光","message":"以后的生日愿望里，我都想悄悄留一个位置给你。"},
    {"src":"images/memories/photo-029.jpg","thumbnail":"images/memories/thumb-029.jpg","cap":"一起走过的风景","message":"这只手，牵了两年，还想继续牵很久很久。"},
    {"src":"images/memories/photo-030.jpg","thumbnail":"images/memories/thumb-030.jpg","cap":"想念有了模样","message":"不一定每天都有惊喜，但每一天都想好好爱你。"},
    {"src":"images/memories/photo-031.jpg","thumbnail":"images/memories/thumb-031.jpg","cap":"最喜欢的你","message":"两年只是开头，我们还有好多地方要一起去。"},
    {"src":"images/memories/photo-032.jpg","thumbnail":"images/memories/thumb-032.jpg","cap":"两个人的小幸福","message":"两周年快乐。我的下一年、下下年，都想和你一起。"},
    {"src":"images/memories/photo-033.jpg","thumbnail":"images/memories/thumb-033.jpg","cap":"往后的日子也是你","message":"如果再回到那一天，我还是会想走近你。"},
    {"src":"images/memories/photo-034.jpg","thumbnail":"images/memories/thumb-034.jpg","cap":"浪漫藏在日常里","message":"两年了，看到你笑，我还是会忍不住跟着笑。"},
    {"src":"images/memories/photo-035.jpg","thumbnail":"images/memories/thumb-035.jpg","cap":"和你在一起","message":"想和你吃很多很多顿饭，从今天到很久以后。"},
    {"src":"images/memories/photo-036.jpg","thumbnail":"images/memories/thumb-036.jpg","cap":"把喜欢留在这一刻","message":"后来才发现，最让我心软的，一直都是你。"},
    {"src":"images/memories/photo-037.jpg","thumbnail":"images/memories/thumb-037.jpg","cap":"心动有迹可循","message":"喜欢你认真生活的样子，也喜欢你迷迷糊糊的样子。"},
    {"src":"images/memories/photo-038.jpg","thumbnail":"images/memories/thumb-038.jpg","cap":"镜头里的偏爱","message":"去哪里都好，身边是你，就已经很值得期待。"},
    {"src":"images/memories/photo-039.jpg","thumbnail":"images/memories/thumb-039.jpg","cap":"想把日常过成永远","message":"想陪你看很多次日落，也想一起等每一个天亮。"},
    {"src":"images/memories/photo-040.jpg","thumbnail":"images/memories/thumb-040.jpg","cap":"陪你慢慢走","message":"故事有很多种结局，我最想要的是身边一直有你。"},
    {"src":"images/memories/photo-041.jpg","thumbnail":"images/memories/thumb-041.jpg","cap":"我们的好天气","message":"你给我的小小心意，我都有好好放在心上。"},
    {"src":"images/memories/photo-042.jpg","thumbnail":"images/memories/thumb-042.jpg","cap":"有你就很甜","message":"生活里那些不起眼的小事，因为有你，都变得可爱。"},
    {"src":"images/memories/photo-043.jpg","thumbnail":"images/memories/thumb-043.jpg","cap":"收藏这一秒","message":"晴天想见你，下雨天也想，把伞偏向你的那一边。"},
    {"src":"images/memories/photo-044.jpg","thumbnail":"images/memories/thumb-044.jpg","cap":"每一天都更喜欢你","message":"以后的生日愿望里，我都想悄悄留一个位置给你。"},
    {"src":"images/memories/photo-045.jpg","thumbnail":"images/memories/thumb-045.jpg","cap":"平凡日子里的光","message":"这只手，牵了两年，还想继续牵很久很久。"},
    {"src":"images/memories/photo-046.jpg","thumbnail":"images/memories/thumb-046.jpg","cap":"一起走过的风景","message":"不一定每天都有惊喜，但每一天都想好好爱你。"},
    {"src":"images/memories/photo-047.jpg","thumbnail":"images/memories/thumb-047.jpg","cap":"想念有了模样","message":"两年只是开头，我们还有好多地方要一起去。"},
    {"src":"images/memories/photo-048.jpg","thumbnail":"images/memories/thumb-048.jpg","cap":"最喜欢的你","message":"两周年快乐。我的下一年、下下年，都想和你一起。"},
    {"src":"images/memories/photo-049.jpg","thumbnail":"images/memories/thumb-049.jpg","cap":"两个人的小幸福","message":"如果再回到那一天，我还是会想走近你。"},
    {"src":"images/memories/photo-050.jpg","thumbnail":"images/memories/thumb-050.jpg","cap":"往后的日子也是你","message":"两年了，看到你笑，我还是会忍不住跟着笑。"},
    {"src":"images/memories/photo-051.jpg","thumbnail":"images/memories/thumb-051.jpg","cap":"浪漫藏在日常里","message":"想和你吃很多很多顿饭，从今天到很久以后。"},
    {"src":"images/memories/photo-052.jpg","thumbnail":"images/memories/thumb-052.jpg","cap":"和你在一起","message":"后来才发现，最让我心软的，一直都是你。"},
    {"src":"images/memories/photo-053.jpg","thumbnail":"images/memories/thumb-053.jpg","cap":"把喜欢留在这一刻","message":"喜欢你认真生活的样子，也喜欢你迷迷糊糊的样子。"},
    {"src":"images/memories/photo-054.jpg","thumbnail":"images/memories/thumb-054.jpg","cap":"心动有迹可循","message":"去哪里都好，身边是你，就已经很值得期待。"},
    {"src":"images/memories/photo-055.jpg","thumbnail":"images/memories/thumb-055.jpg","cap":"镜头里的偏爱","message":"想陪你看很多次日落，也想一起等每一个天亮。"},
    {"src":"images/memories/photo-056.jpg","thumbnail":"images/memories/thumb-056.jpg","cap":"想把日常过成永远","message":"故事有很多种结局，我最想要的是身边一直有你。"},
    {"src":"images/memories/photo-057.jpg","thumbnail":"images/memories/thumb-057.jpg","cap":"陪你慢慢走","message":"你给我的小小心意，我都有好好放在心上。"},
    {"src":"images/memories/photo-058.jpg","thumbnail":"images/memories/thumb-058.jpg","cap":"我们的好天气","message":"生活里那些不起眼的小事，因为有你，都变得可爱。"},
    {"src":"images/memories/photo-059.jpg","thumbnail":"images/memories/thumb-059.jpg","cap":"有你就很甜","message":"晴天想见你，下雨天也想，把伞偏向你的那一边。"},
    {"src":"images/memories/photo-060.jpg","thumbnail":"images/memories/thumb-060.jpg","cap":"收藏这一秒","message":"以后的生日愿望里，我都想悄悄留一个位置给你。"},
    {"src":"images/memories/photo-061.jpg","thumbnail":"images/memories/thumb-061.jpg","cap":"每一天都更喜欢你","message":"这只手，牵了两年，还想继续牵很久很久。"},
    {"src":"images/memories/photo-062.jpg","thumbnail":"images/memories/thumb-062.jpg","cap":"平凡日子里的光","message":"不一定每天都有惊喜，但每一天都想好好爱你。"},
    {"src":"images/memories/photo-063.jpg","thumbnail":"images/memories/thumb-063.jpg","cap":"一起走过的风景","message":"两年只是开头，我们还有好多地方要一起去。"},
    {"src":"images/memories/photo-064.jpg","thumbnail":"images/memories/thumb-064.jpg","cap":"想念有了模样","message":"两周年快乐。我的下一年、下下年，都想和你一起。"},
    {"src":"images/memories/photo-065.jpg","thumbnail":"images/memories/thumb-065.jpg","cap":"最喜欢的你","message":"如果再回到那一天，我还是会想走近你。"},
    {"src":"images/memories/photo-066.jpg","thumbnail":"images/memories/thumb-066.jpg","cap":"两个人的小幸福","message":"两年了，看到你笑，我还是会忍不住跟着笑。"},
    {"src":"images/memories/photo-067.jpg","thumbnail":"images/memories/thumb-067.jpg","cap":"往后的日子也是你","message":"想和你吃很多很多顿饭，从今天到很久以后。"},
    {"src":"images/memories/photo-068.jpg","thumbnail":"images/memories/thumb-068.jpg","cap":"浪漫藏在日常里","message":"后来才发现，最让我心软的，一直都是你。"},
    {"src":"images/memories/photo-069.jpg","thumbnail":"images/memories/thumb-069.jpg","cap":"和你在一起","message":"喜欢你认真生活的样子，也喜欢你迷迷糊糊的样子。"},
    {"src":"images/memories/photo-070.jpg","thumbnail":"images/memories/thumb-070.jpg","cap":"把喜欢留在这一刻","message":"去哪里都好，身边是你，就已经很值得期待。"},
    {"src":"images/memories/photo-071.jpg","thumbnail":"images/memories/thumb-071.jpg","cap":"心动有迹可循","message":"想陪你看很多次日落，也想一起等每一个天亮。"},
    {"src":"images/memories/photo-072.jpg","thumbnail":"images/memories/thumb-072.jpg","cap":"镜头里的偏爱","message":"故事有很多种结局，我最想要的是身边一直有你。"},
    {"src":"images/memories/photo-073.jpg","thumbnail":"images/memories/thumb-073.jpg","cap":"想把日常过成永远","message":"你给我的小小心意，我都有好好放在心上。"},
    {"src":"images/memories/photo-074.jpg","thumbnail":"images/memories/thumb-074.jpg","cap":"陪你慢慢走","message":"生活里那些不起眼的小事，因为有你，都变得可爱。"},
    {"src":"images/memories/photo-075.jpg","thumbnail":"images/memories/thumb-075.jpg","cap":"我们的好天气","message":"晴天想见你，下雨天也想，把伞偏向你的那一边。"},
    {"src":"images/memories/photo-076.jpg","thumbnail":"images/memories/thumb-076.jpg","cap":"有你就很甜","message":"以后的生日愿望里，我都想悄悄留一个位置给你。"},
    {"src":"images/memories/photo-077.jpg","thumbnail":"images/memories/thumb-077.jpg","cap":"收藏这一秒","message":"这只手，牵了两年，还想继续牵很久很久。"},
    {"src":"images/memories/photo-078.jpg","thumbnail":"images/memories/thumb-078.jpg","cap":"每一天都更喜欢你","message":"不一定每天都有惊喜，但每一天都想好好爱你。"},
    {"src":"images/memories/photo-079.jpg","thumbnail":"images/memories/thumb-079.jpg","cap":"平凡日子里的光","message":"两年只是开头，我们还有好多地方要一起去。"},
    {"src":"images/memories/photo-080.jpg","thumbnail":"images/memories/thumb-080.jpg","cap":"一起走过的风景","message":"两周年快乐。我的下一年、下下年，都想和你一起。"},
    {"src":"images/memories/photo-081.jpg","thumbnail":"images/memories/thumb-081.jpg","cap":"想念有了模样","message":"如果再回到那一天，我还是会想走近你。"},
    {"src":"images/memories/photo-082.jpg","thumbnail":"images/memories/thumb-082.jpg","cap":"最喜欢的你","message":"两年了，看到你笑，我还是会忍不住跟着笑。"},
    {"src":"images/memories/photo-083.jpg","thumbnail":"images/memories/thumb-083.jpg","cap":"两个人的小幸福","message":"想和你吃很多很多顿饭，从今天到很久以后。"},
    {"src":"images/memories/photo-084.jpg","thumbnail":"images/memories/thumb-084.jpg","cap":"往后的日子也是你","message":"后来才发现，最让我心软的，一直都是你。"},
    {"src":"images/memories/photo-085.jpg","thumbnail":"images/memories/thumb-085.jpg","cap":"浪漫藏在日常里","message":"喜欢你认真生活的样子，也喜欢你迷迷糊糊的样子。"},
    {"src":"images/memories/photo-086.jpg","thumbnail":"images/memories/thumb-086.jpg","cap":"和你在一起","message":"去哪里都好，身边是你，就已经很值得期待。"},
    {"src":"images/memories/photo-087.jpg","thumbnail":"images/memories/thumb-087.jpg","cap":"把喜欢留在这一刻","message":"想陪你看很多次日落，也想一起等每一个天亮。"},
    {"src":"images/memories/photo-088.jpg","thumbnail":"images/memories/thumb-088.jpg","cap":"心动有迹可循","message":"故事有很多种结局，我最想要的是身边一直有你。"},
    {"src":"images/memories/photo-089.jpg","thumbnail":"images/memories/thumb-089.jpg","cap":"镜头里的偏爱","message":"你给我的小小心意，我都有好好放在心上。"},
    {"src":"images/memories/photo-090.jpg","thumbnail":"images/memories/thumb-090.jpg","cap":"想把日常过成永远","message":"生活里那些不起眼的小事，因为有你，都变得可爱。"},
    {"src":"images/memories/photo-091.jpg","thumbnail":"images/memories/thumb-091.jpg","cap":"陪你慢慢走","message":"晴天想见你，下雨天也想，把伞偏向你的那一边。"},
    {"src":"images/memories/photo-092.jpg","thumbnail":"images/memories/thumb-092.jpg","cap":"我们的好天气","message":"以后的生日愿望里，我都想悄悄留一个位置给你。"},
    {"src":"images/memories/photo-093.jpg","thumbnail":"images/memories/thumb-093.jpg","cap":"有你就很甜","message":"这只手，牵了两年，还想继续牵很久很久。"},
    {"src":"images/memories/photo-094.jpg","thumbnail":"images/memories/thumb-094.jpg","cap":"收藏这一秒","message":"不一定每天都有惊喜，但每一天都想好好爱你。"},
    {"src":"images/memories/photo-095.jpg","thumbnail":"images/memories/thumb-095.jpg","cap":"每一天都更喜欢你","message":"两年只是开头，我们还有好多地方要一起去。"},
    {"src":"images/memories/photo-096.jpg","thumbnail":"images/memories/thumb-096.jpg","cap":"平凡日子里的光","message":"两周年快乐。我的下一年、下下年，都想和你一起。"},
    {"src":"images/memories/photo-097.jpg","thumbnail":"images/memories/thumb-097.jpg","cap":"一起走过的风景","message":"如果再回到那一天，我还是会想走近你。"},
    {"src":"images/memories/photo-098.jpg","thumbnail":"images/memories/thumb-098.jpg","cap":"想念有了模样","message":"两年了，看到你笑，我还是会忍不住跟着笑。"},
    {"src":"images/memories/photo-099.jpg","thumbnail":"images/memories/thumb-099.jpg","cap":"最喜欢的你","message":"想和你吃很多很多顿饭，从今天到很久以后。"},
    {"src":"images/memories/photo-100.jpg","thumbnail":"images/memories/thumb-100.jpg","cap":"两个人的小幸福","message":"后来才发现，最让我心软的，一直都是你。"},
    {"src":"images/memories/photo-101.jpg","thumbnail":"images/memories/thumb-101.jpg","cap":"往后的日子也是你","message":"喜欢你认真生活的样子，也喜欢你迷迷糊糊的样子。"},
    {"src":"images/memories/photo-102.jpg","thumbnail":"images/memories/thumb-102.jpg","cap":"浪漫藏在日常里","message":"去哪里都好，身边是你，就已经很值得期待。"}
  ],

  /* ---------- 第四圈：视频回忆 ---------- */
  videos: [
    {"type":"video","src":"videos/memory-01.mp4","poster":"videos/poster-01.jpg","cap":"把这一刻留住","message":"如果再回到那一天，我还是会想走近你。"},
    {"type":"video","src":"videos/memory-02.mp4","poster":"videos/poster-02.jpg","cap":"你在镜头里发光","message":"两年了，看到你笑，我还是会忍不住跟着笑。"},
    {"type":"video","src":"videos/memory-03.mp4","poster":"videos/poster-03.jpg","cap":"会动的心动","message":"想和你吃很多很多顿饭，从今天到很久以后。"},
    {"type":"video","src":"videos/memory-04.mp4","poster":"videos/poster-04.jpg","cap":"我们的独家回忆","message":"后来才发现，最让我心软的，一直都是你。"},
    {"type":"video","src":"videos/memory-05.mp4","poster":"videos/poster-05.jpg","cap":"喜欢你每一个样子","message":"喜欢你认真生活的样子，也喜欢你迷迷糊糊的样子。"},
    {"type":"video","src":"videos/memory-06.mp4","poster":"videos/poster-06.jpg","cap":"有你的片段","message":"去哪里都好，身边是你，就已经很值得期待。"},
    {"type":"video","src":"videos/memory-07.mp4","poster":"videos/poster-07.jpg","cap":"一起慢慢长大","message":"想陪你看很多次日落，也想一起等每一个天亮。"},
    {"type":"video","src":"videos/memory-08.mp4","poster":"videos/poster-08.jpg","cap":"每一秒都值得珍藏","message":"故事有很多种结局，我最想要的是身边一直有你。"},
    {"type":"video","src":"videos/memory-09.mp4","poster":"videos/poster-09.jpg","cap":"甜蜜正在播放","message":"你给我的小小心意，我都有好好放在心上。"},
    {"type":"video","src":"videos/memory-10.mp4","poster":"videos/poster-10.jpg","cap":"把这一刻留住","message":"生活里那些不起眼的小事，因为有你，都变得可爱。"},
    {"type":"video","src":"videos/memory-11.mp4","poster":"videos/poster-11.jpg","cap":"你在镜头里发光","message":"晴天想见你，下雨天也想，把伞偏向你的那一边。"},
    {"type":"video","src":"videos/memory-12.mp4","poster":"videos/poster-12.jpg","cap":"会动的心动","message":"以后的生日愿望里，我都想悄悄留一个位置给你。"},
    {"type":"video","src":"videos/memory-13.mp4","poster":"videos/poster-13.jpg","cap":"我们的独家回忆","message":"这只手，牵了两年，还想继续牵很久很久。"},
    {"type":"video","src":"videos/memory-14.mp4","poster":"videos/poster-14.jpg","cap":"喜欢你每一个样子","message":"不一定每天都有惊喜，但每一天都想好好爱你。"},
    {"type":"video","src":"videos/memory-15.mp4","poster":"videos/poster-15.jpg","cap":"有你的片段","message":"两年只是开头，我们还有好多地方要一起去。"},
    {"type":"video","src":"videos/memory-16.mp4","poster":"videos/poster-16.jpg","cap":"一起慢慢长大","message":"两周年快乐。我的下一年、下下年，都想和你一起。"},
    {"type":"video","src":"videos/memory-17.mp4","poster":"videos/poster-17.jpg","cap":"每一秒都值得珍藏","message":"如果再回到那一天，我还是会想走近你。"},
    {"type":"video","src":"videos/memory-18.mp4","poster":"videos/poster-18.jpg","cap":"甜蜜正在播放","message":"两年了，看到你笑，我还是会忍不住跟着笑。"},
    {"type":"video","src":"videos/memory-19.mp4","poster":"videos/poster-19.jpg","cap":"把这一刻留住","message":"想和你吃很多很多顿饭，从今天到很久以后。"},
    {"type":"video","src":"videos/memory-20.mp4","poster":"videos/poster-20.jpg","cap":"你在镜头里发光","message":"后来才发现，最让我心软的，一直都是你。"},
    {"type":"video","src":"videos/memory-21.mp4","poster":"videos/poster-21.jpg","cap":"会动的心动","message":"喜欢你认真生活的样子，也喜欢你迷迷糊糊的样子。"},
    {"type":"video","src":"videos/memory-22.mp4","poster":"videos/poster-22.jpg","cap":"我们的独家回忆","message":"去哪里都好，身边是你，就已经很值得期待。"},
    {"type":"video","src":"videos/memory-23.mp4","poster":"videos/poster-23.jpg","cap":"喜欢你每一个样子","message":"想陪你看很多次日落，也想一起等每一个天亮。"},
    {"type":"video","src":"videos/memory-24.mp4","poster":"videos/poster-24.jpg","cap":"有你的片段","message":"故事有很多种结局，我最想要的是身边一直有你。"},
    {"type":"video","src":"videos/memory-25.mp4","poster":"videos/poster-25.jpg","cap":"一起慢慢长大","message":"你给我的小小心意，我都有好好放在心上。"},
    {"type":"video","src":"videos/memory-26.mp4","poster":"videos/poster-26.jpg","cap":"每一秒都值得珍藏","message":"生活里那些不起眼的小事，因为有你，都变得可爱。"},
    {"type":"video","src":"videos/memory-27.mp4","poster":"videos/poster-27.jpg","cap":"甜蜜正在播放","message":"晴天想见你，下雨天也想，把伞偏向你的那一边。"}
  ],

  /* ---------- 排布 ---------- */
  layout: {
    rows: 4,              // 三圈照片 + 一圈视频
    perRow: 34,           // 每圈张数
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
