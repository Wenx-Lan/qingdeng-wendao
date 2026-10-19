/* 青灯问道 · 启动与背景灯尘 */
(function (g) {
  'use strict';
  const QD = g.QD;

  function boot() {
    if (!QD || !QD.Engine || !QD.UI) {
      console.error('青灯问道：模块未加载完整。');
      return;
    }
    QD.UI.init();
    initMotes();
  }

  function initMotes() {
    const canvas = document.getElementById('motes');
    if (!canvas) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    let dots = [];
    let raf = null;

    function reset() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const count = Math.max(18, Math.min(54, Math.floor(W * H / 34000)));
      for (let i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.5 + Math.random() * 1.7,
          vy: -(0.04 + Math.random() * 0.22),
          vx: (Math.random() - 0.5) * 0.08,
          a: 0.05 + Math.random() * 0.22,
          ph: Math.random() * Math.PI * 2,
          gold: Math.random() < 0.55
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        d.y += d.vy;
        d.x += d.vx + Math.sin(t / 4200 + d.ph) * 0.06;
        if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
        if (d.x < -10) d.x = W + 10;
        if (d.x > W + 10) d.x = -10;
        const alpha = d.a * (0.65 + 0.35 * Math.sin(t / 1800 + d.ph));
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.gold
          ? 'rgba(201, 168, 106, ' + alpha + ')'
          : 'rgba(150, 178, 200, ' + (alpha * 0.8) + ')';
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    reset();
    window.addEventListener('resize', function () {
      cancelAnimationFrame(raf);
      reset();
      raf = requestAnimationFrame(draw);
    });
    raf = requestAnimationFrame(draw);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // PWA：仅在 https / localhost 下注册 Service Worker（file:// 下跳过）
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () { /* 忽略注册失败 */ });
    });
  }
  registerSW();
})(window);
