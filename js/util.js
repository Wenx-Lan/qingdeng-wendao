/* 青灯问道 · 基础工具 */
(function (g) {
  'use strict';
  const QD = g.QD = g.QD || {};

  const U = {};

  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.chance = p => Math.random() < p;
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.pickN = function (arr, n) {
    const a = arr.slice();
    const out = [];
    while (a.length && out.length < n) {
      out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
    }
    return out;
  };
  U.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.weighted = function (list) {
    let total = 0;
    for (const it of list) total += (it.weight || 1);
    let r = Math.random() * total;
    for (const it of list) {
      r -= (it.weight || 1);
      if (r <= 0) return it;
    }
    return list[list.length - 1];
  };

  U.fmt = function (n) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    n = Math.round(n);
    const neg = n < 0 ? '-' : '';
    n = Math.abs(n);
    if (n < 10000) return neg + String(n);
    if (n < 100000000) {
      const v = n / 10000;
      return neg + (v >= 100 ? v.toFixed(0) : v.toFixed(1)).replace(/\.0$/, '') + '万';
    }
    const v = n / 100000000;
    return neg + (v >= 100 ? v.toFixed(0) : v.toFixed(1)).replace(/\.0$/, '') + '亿';
  };

  U.pct = function (n, digits) {
    return (n * 100).toFixed(digits === undefined ? 0 : digits) + '%';
  };

  U.esc = function (s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  U.addItem = function (bag, id, n) {
    if (!id) return;
    bag[id] = (bag[id] || 0) + (n === undefined ? 1 : n);
    if (bag[id] <= 0) delete bag[id];
  };

  U.removeItem = function (bag, id, n) {
    n = n === undefined ? 1 : n;
    if ((bag[id] || 0) < n) return false;
    bag[id] -= n;
    if (bag[id] <= 0) delete bag[id];
    return true;
  };

  U.count = function (bag, id) { return bag[id] || 0; };

  U.clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  U.roman = function (i) {
    return ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'][i] || String(i + 1);
  };

  QD.U = U;
})(typeof window !== 'undefined' ? window : globalThis);
