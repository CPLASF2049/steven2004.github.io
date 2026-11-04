/* Local typewriter: no CDN dependency, complete server-rendered text without JS. */
(function () {
  'use strict';
  function init() {
    var root = document.querySelector('.hero-writing');
    if (!root) return;
    var poems;
    try { poems = JSON.parse(root.dataset.poems); } catch (_) { return; }
    if (!Array.isArray(poems) || !poems.length) return;
    var title = root.querySelector('[data-hero-title]');
    var verse = root.querySelector('[data-hero-verse]');
    var source = root.querySelector('[data-hero-source]');
    var accessible = root.querySelector('[data-hero-accessible]');
    var count = root.querySelector('[data-hero-count]');
    var pause = root.querySelector('[data-hero-pause]');
    var next = root.querySelector('[data-hero-next]');
    var controls = root.querySelector('.hero-poem-controls');
    if (!title || !verse || !pause || !next) return;
    var fullTitle = title.textContent;
    var titleChars = Array.from(fullTitle);
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var paused = motion.matches;
    var index = Math.floor(Math.random() * poems.length);
    var phase = 'title', position = 0, timer = 0, visible = true;
    var chars = [];
    function clear() { window.clearTimeout(timer); timer = 0; }
    function schedule(delay) {
      clear();
      if (!paused && !document.hidden && visible) timer = window.setTimeout(step, delay);
    }
    function selectPoem() {
      chars = Array.from(poems[index].text);
      count.textContent = String(index + 1).padStart(2, '0') + ' / ' + poems.length;
      source.textContent = '— ' + poems[index].author + '《' + poems[index].work + '》';
      accessible.textContent = poems[index].text + ' ' + source.textContent;
    }
    function syncButton() {
      pause.textContent = paused ? '继续轮播' : '暂停轮播';
      pause.setAttribute('aria-pressed', String(paused));
      root.classList.toggle('is-paused', paused);
    }
    function complete() {
      clear();
      title.textContent = fullTitle;
      root.classList.add('title-complete');
      selectPoem();
      verse.textContent = poems[index].text;
      position = chars.length;
      phase = 'hold';
      root.classList.add('verse-complete');
    }
    function step() {
      if (paused || document.hidden || !visible) return;
      if (phase === 'title') {
        title.textContent = titleChars.slice(0, ++position).join('');
        if (position >= titleChars.length) {
          root.classList.add('title-complete');
          selectPoem(); position = 0; phase = 'write';
          schedule(450);
        } else schedule(115);
      } else if (phase === 'write') {
        verse.textContent = chars.slice(0, ++position).join('');
        if (position >= chars.length) {
          root.classList.add('verse-complete'); phase = 'hold'; schedule(6500);
        } else schedule(/[，。？！；、]/.test(chars[position - 1]) ? 330 : 100);
      } else if (phase === 'hold') {
        root.classList.remove('verse-complete'); phase = 'erase'; schedule(40);
      } else {
        verse.textContent = chars.slice(0, --position).join('');
        if (position <= 0) {
          index = (index + 1) % poems.length; selectPoem(); phase = 'write'; schedule(350);
        } else schedule(35);
      }
    }
    controls.hidden = false;
    selectPoem(); syncButton();
    if (paused) complete();
    else { title.textContent = ''; verse.textContent = ''; schedule(300); }
    pause.addEventListener('click', function () {
      paused = !paused;
      if (paused) complete(); else schedule(6500);
      syncButton();
    });
    next.addEventListener('click', function () {
      index = (index + 1) % poems.length;
      complete();
      if (!paused) { verse.textContent = ''; position = 0; phase = 'write'; root.classList.remove('verse-complete'); schedule(100); }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clear(); else schedule(phase === 'hold' ? 6500 : 150);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (!visible) clear(); else schedule(phase === 'hold' ? 6500 : 150);
      }).observe(root);
    }
    motion.addEventListener('change', function (e) {
      if (e.matches) { paused = true; complete(); syncButton(); }
    });
    root.dataset.typewriterReady = 'true';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
