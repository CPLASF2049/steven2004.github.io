/* ================================================================
 * 鼠标交互动效
 *
 *   1. 聚光灯：整页模糊，只有鼠标周围一圈保持清晰（.spotlight-overlay）
 *   2. 卡片：跟随鼠标的柔光 + 边框发光 + 轻微 3D 倾斜（.index-card）
 *   3. 列表项：只跟随柔光，不倾斜（.list-group-item）
 *
 * JS 只负责算坐标，视觉全部交给 CSS 变量：
 *   --spot-x / --spot-y  视口坐标，给聚光灯层
 *   --mx / --my          元素内百分比坐标，给光晕
 *   --rx / --ry          倾斜角度，给 3D 变换
 *
 * 触屏设备、以及系统开了「减少动态效果」时，整套效果不启用。
 * 想调强度：CSS 里的 --spot-blur / --spot-radius 和下面的 TILT_MAX。
 * ================================================================ */
(function () {
  'use strict';

  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var mqFine = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;
  if (mqReduce && mqReduce.matches) return;   // 系统要求减少动态效果
  if (mqFine && !mqFine.matches) return;      // 触屏设备，没有鼠标

  var TILT_MAX = 3.5;                                    // 最大倾斜角度（度）
  var TILT_SELECTOR = '.index-card';                     // 会做 3D 倾斜的卡片
  var GLOW_SELECTOR = '.index-card, .list-group-item';   // 会跟随发光的目标

  var root = document.documentElement;
  var overlay = null;
  var lastEvent = null;
  var frameId = 0;
  var currentGlow = null;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'spotlight-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
  }

  function clearElement(el) {
    if (!el) return;
    el.style.removeProperty('--mx');
    el.style.removeProperty('--my');
    el.style.removeProperty('--rx');
    el.style.removeProperty('--ry');
  }

  function paint() {
    frameId = 0;
    var e = lastEvent;
    if (!e) return;

    // 聚光灯跟着鼠标走（只写 CSS 变量，不在 JS 里动样式）
    root.style.setProperty('--spot-x', e.clientX + 'px');
    root.style.setProperty('--spot-y', e.clientY + 'px');
    if (!overlay || !overlay.isConnected) buildOverlay();
    if (!overlay.classList.contains('is-active')) {
      overlay.classList.add('is-active');
    }

    // 找出鼠标下面的可交互卡片
    var target = e.target && e.target.closest ? e.target.closest(GLOW_SELECTOR) : null;
    if (target !== currentGlow) {
      clearElement(currentGlow);
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
    if (!frameId) frameId = window.requestAnimationFrame(paint);
  }

  function reset() {
    lastEvent = null;
    clearElement(currentGlow);
    currentGlow = null;
    if (overlay) overlay.classList.remove('is-active');
  }

  function init() {
    buildOverlay();
    // 用事件委托，Fluid 刷新局部内容后不用重新绑定
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', reset);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) reset();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
