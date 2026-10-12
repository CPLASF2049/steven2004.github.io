/* ================================================================
 * 站点动效（挑了几个 AnZhiYu 主题上比较有代表性的效果）
 *
 *   1. 卡片跟随光晕 + 轻微 3D 倾斜   —— .index-card / .list-group-item
 *   2. 鼠标点击爱心                  —— 点击处冒出一颗心
 *   3. 滚动进入视口淡入上滑          —— .index-card / .list-group-item
 *   4. 标签卖萌                      —— 切走标签页时换标题
 *   5. 控制台问候 + 站点运行时间      —— 控制台与页脚
 *   6. 导航栏滚动阴影
 *   7. 液态玻璃的 SVG 滤镜（供 custom.css 里的液态玻璃引用）
 *
 * 1~3 依赖鼠标与动画，触屏设备或系统开启「减少动态效果」时自动不启用；
 * 4~6 是纯文字/状态类效果，任何环境都保留。
 * 想调强度：下面的 TILT_MAX、HEART_COUNT，以及 CSS 里的动画时长。
 * ================================================================ */
(function () {
  'use strict';

  var mq = function (query) {
    return window.matchMedia ? window.matchMedia(query).matches : false;
  };
  // 系统要求减少动态效果时，动作类特效全部跳过
  var reduceMotion = mq('(prefers-reduced-motion: reduce)');
  var finePointer = mq('(hover: hover) and (pointer: fine)');

  var TILT_MAX = 3.5;                                  // 卡片最大倾斜角度（度）
  var TILT_SELECTOR = '.index-card';
  var GLOW_SELECTOR = '.index-card, .list-group-item';
  var REVEAL_SELECTOR = '.index-card, .list-group-item';
  var HEART_COUNT = 3;                                 // 每次点击冒出几颗心

  // 站点上线时间，用于页脚与控制台的运行时间统计，改成你自己的
  var LAUNCH = new Date('2026-02-25T00:00:00+08:00');

  var lastEvent = null;
  var frameId = 0;
  var currentGlow = null;

  /* ================================================================
   * 1. 卡片跟随光晕 + 轻微 3D 倾斜
   * 只算坐标写进 CSS 变量，视觉全交给样式表
   * ================================================================ */
  function clearCardVars(el) {
    if (!el) return;
    el.style.removeProperty('--mx');
    el.style.removeProperty('--my');
    el.style.removeProperty('--rx');
    el.style.removeProperty('--ry');
  }

  function paintCard() {
    frameId = 0;
    var e = lastEvent;
    if (!e) return;

    var target = e.target && e.target.closest ? e.target.closest(GLOW_SELECTOR) : null;
    if (target !== currentGlow) {
      clearCardVars(currentGlow);
      currentGlow = target;
    }
    if (!target) return;

    var rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    target.style.setProperty('--mx', (x / rect.width * 100).toFixed(2) + '%');
    target.style.setProperty('--my', (y / rect.height * 100).toFixed(2) + '%');

    if (target.matches(TILT_SELECTOR)) {
      var ry = (x / rect.width - 0.5) * 2 * TILT_MAX;
      var rx = (0.5 - y / rect.height) * 2 * TILT_MAX;
      target.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      target.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    }
  }

  function onMove(e) {
    lastEvent = e;
    if (!frameId) frameId = window.requestAnimationFrame(paintCard);
  }

  function resetCard() {
    lastEvent = null;
    clearCardVars(currentGlow);
    currentGlow = null;
  }

  function initCardEffect() {
    // 事件委托，主题刷新局部内容后不用重新绑定
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', resetCard);
    window.addEventListener('blur', resetCard);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) resetCard();
    });
  }

  /* ================================================================
   * 2. 鼠标点击爱心
   * ================================================================ */
  var HEART_COLORS = ['#ff6b8a', '#ff9db4', '#37c6c0', '#ffd166'];

  function spawnHearts(x, y) {
    for (var i = 0; i < HEART_COUNT; i++) {
      var heart = document.createElement('span');
      heart.className = 'fx-heart';
      heart.textContent = '♥';
      heart.setAttribute('aria-hidden', 'true');
      heart.style.left = x + 'px';
      heart.style.top = y + 'px';
      heart.style.color = HEART_COLORS[i % HEART_COLORS.length];
      heart.style.fontSize = (12 + Math.random() * 10).toFixed(1) + 'px';
      heart.style.setProperty('--heart-x', ((Math.random() - 0.5) * 70).toFixed(0) + 'px');
      heart.style.setProperty('--heart-rotate', ((Math.random() - 0.5) * 70).toFixed(0) + 'deg');
      heart.style.animationDelay = (i * 60) + 'ms';
      document.body.appendChild(heart);
      // 动画结束就移除，避免 DOM 里越堆越多
      heart.addEventListener('animationend', function () {
        this.remove();
      });
    }
  }

  function initClickHearts() {
    document.addEventListener('click', function (e) {
      // 点在输入框里就不冒心了
      var tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;
      spawnHearts(e.clientX, e.clientY);
    });
  }

  /* ================================================================
   * 3. 滚动进入视口：播一次淡入上滑
   *
   * 关键设计：元素默认就是可见的，只是「进入视口时补一段入场动画」。
   * 所以无论观察机制是否触发，都不会出现内容被藏住的情况。
   * ================================================================ */
  function playReveal(el) {
    if (el.classList.contains('fx-reveal-play')) return;
    var order = parseInt(el.getAttribute('data-fx-order'), 10) || 0;
    el.style.setProperty('--reveal-delay', Math.min(order, 6) * 70 + 'ms');
    el.classList.add('fx-reveal-play');
  }

  function initScrollReveal() {
    var items = document.querySelectorAll(REVEAL_SELECTOR);
    if (!items.length) return;

    var vh = window.innerHeight || document.documentElement.clientHeight;
    var belowFold = [];

    Array.prototype.forEach.call(items, function (el, i) {
      el.setAttribute('data-fx-order', i);
      // 首屏里已经能看到的元素不做入场动画，省得闪一下
      if (el.getBoundingClientRect().top < vh) return;
      belowFold.push(el);
    });
    if (!belowFold.length) return;

    // 没有 IntersectionObserver 就直接全部播一遍
    if (!('IntersectionObserver' in window)) {
      belowFold.forEach(playReveal);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        playReveal(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    belowFold.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ================================================================
   * 4. 标签卖萌：切走标签页时把标题换掉
   * ================================================================ */
  function initDynamicTitle() {
    var original = document.title;
    var LEAVE = 'w(ﾟДﾟ)w 不要走！再看看嘛！';
    var BACK = '♪(^∇^*)欢迎肥来！';
    var timer = 0;

    document.addEventListener('visibilitychange', function () {
      window.clearTimeout(timer);
      if (document.hidden) {
        document.title = LEAVE;
      } else {
        document.title = BACK;
        timer = window.setTimeout(function () {
          document.title = original;
        }, 1600);
      }
    });
  }

  /* ================================================================
   * 5. 控制台问候 + 站点运行时间
   * ================================================================ */
  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function runtimeText() {
    var ms = Date.now() - LAUNCH.getTime();
    if (ms < 0) ms = 0;
    var total = Math.floor(ms / 1000);
    var d = Math.floor(total / 86400);
    var h = Math.floor((total % 86400) / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    return d + ' 天 ' + h + ' 时 ' + m + ' 分 ' + s + ' 秒';
  }

  function clockText() {
    var now = new Date();
    return pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
  }

  function initRuntime() {
    // 页脚追加一行运行时间，每秒刷新
    var anchor = document.querySelector('.footer-inner');
    if (anchor) {
      var box = document.createElement('div');
      box.className = 'site-runtime';
      box.innerHTML = '本站已运行 <span class="site-runtime-text">' + runtimeText() + '</span>';
      anchor.appendChild(box);

      var label = box.querySelector('.site-runtime-text');
      window.setInterval(function () {
        label.textContent = runtimeText();
      }, 1000);
    }

    // 控制台问候，按 F12 能看到
    try {
      console.log('%cSteven\'s Blog', 'color:#37c6c0;font-size:20px;font-weight:bold;');
      console.log('%c记录计算机学习日常', 'color:#37c6c0;font-size:13px;');
      console.log('%c本站已运行 ' + runtimeText(), 'color:#718096;font-size:12px;');
      console.log('%c现在是 ' + clockText(), 'color:#718096;font-size:12px;');
    } catch (err) {
      /* 控制台被禁用时忽略 */
    }
  }

  /* ================================================================
   * 6. 导航栏滚动阴影
   * ================================================================ */
  function initNavbarShadow() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;

    var ticking = false;
    function update() {
      ticking = false;
      navbar.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ================================================================
   * 7. 液态玻璃的 SVG 滤镜
   *
   * 原理：.liquid-glass 元素的 ::before 用 backdrop-filter 抓到身后的画面，
   * 再用这个滤镜里的位移贴图把画面「折射」一下，于是玻璃边缘会有水波般的形变。
   * 滤镜必须先在 DOM 里存在，CSS 的 filter: url(#liquid-glass) 才能引用到。
   * ================================================================ */
  function initLiquidGlassFilter() {
    if (document.getElementById('liquid-glass-filter')) return;

    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.pointerEvents = 'none';

    var filter = document.createElementNS(ns, 'filter');
    filter.setAttribute('id', 'liquid-glass-filter');
    // 滤镜区域放大一些，免得位移之后边缘被裁掉
    filter.setAttribute('x', '-30%');
    filter.setAttribute('y', '-30%');
    filter.setAttribute('width', '160%');
    filter.setAttribute('height', '160%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    // 1) 生成一层平滑噪声作为位移贴图
    var turbulence = document.createElementNS(ns, 'feTurbulence');
    turbulence.setAttribute('type', 'fractalNoise');
    turbulence.setAttribute('baseFrequency', '0.02 0.024');
    turbulence.setAttribute('numOctaves', '1');
    turbulence.setAttribute('seed', '11');
    turbulence.setAttribute('result', 'noise');

    // 2) 模糊一下，让位移过渡更像厚玻璃而不是噪点
    var soften = document.createElementNS(ns, 'feGaussianBlur');
    soften.setAttribute('in', 'noise');
    soften.setAttribute('stdDeviation', '1.8');
    soften.setAttribute('result', 'softNoise');

    // 3) 按噪声的 R/G 通道把画面位移，形成折射
    var displace = document.createElementNS(ns, 'feDisplacementMap');
    displace.setAttribute('in', 'SourceGraphic');
    displace.setAttribute('in2', 'softNoise');
    displace.setAttribute('scale', '25');
    displace.setAttribute('xChannelSelector', 'R');
    displace.setAttribute('yChannelSelector', 'G');

    filter.appendChild(turbulence);
    filter.appendChild(soften);
    filter.appendChild(displace);
    svg.appendChild(filter);
    document.body.appendChild(svg);
  }

  /* ================================================================ */
  function init() {
    if (!reduceMotion) {
      if (finePointer) initCardEffect();
      initClickHearts();
      initScrollReveal();
    }
    initDynamicTitle();
    initRuntime();
    initNavbarShadow();
    initLiquidGlassFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
