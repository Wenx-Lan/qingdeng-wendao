/* 青灯问道 · 生成应用图标（零依赖，纯 Node + 内置 zlib）
   运行：node tools/make-icons.js
   输出：icons/icon-512.png · icon-192.png · icon-96.png · icon-32.png · apple-touch-icon.png
*/
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ---------- PNG 编码 ---------- */
function crc32(buf) {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- 形状（归一化坐标 0..1，dy 向下为正） ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// 圆角方形（印章）
function inSeal(x, y) {
  const x0 = 0.15, y0 = 0.15, x1 = 0.85, y1 = 0.85, r = 0.10;
  const cx = clamp(x, x0 + r, x1 - r);
  const cy = clamp(y, y0 + r, y1 - r);
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}
// 印章描边（外框内、内框外）
function inSealBorder(x, y) {
  const o = 0.15, i = 0.022;
  const x0 = o, y0 = o, x1 = 1 - o, y1 = 1 - o, r = 0.10;
  function inRect(px, py, off, rr) {
    const cx = clamp(px, off + rr, 1 - off - rr);
    const cy = clamp(py, off + rr, 1 - off - rr);
    const dx = px - cx, dy = py - cy;
    return dx * dx + dy * dy <= rr * rr;
  }
  return inRect(x, y, o, r) && !inRect(x, y, o + i, Math.max(0.001, r - i));
}

// 灯焰（圆润灯肚 + 向上收尖）
function inFlame(x, y) {
  const dx = x - 0.5, dy = y - 0.5; // dy 向下为正
  // 圆润灯肚
  if (dx * dx + (dy - 0.14) * (dy - 0.14) <= 0.25 * 0.25) return true;
  // 向上收尖
  if (dy > -0.36 && dy < 0.08) {
    const t = (dy + 0.36) / 0.44;          // 顶部 0 → 灯肚 1
    const half = 0.25 * t;
    if (Math.abs(dx) <= half) return true;
  }
  return false;
}

/* ---------- 取色 ---------- */
function lerp(a, b, t) { return a + (b - a) * t; }

function sample(px, py) {
  // 背景：墨色
  let r = 10, g = 12, b = 16;
  if (inSeal(px, py)) {
    // 朱砂印章：上亮下暗
    const t = clamp((py - 0.15) / 0.70, 0, 1);
    r = lerp(179, 138, t); g = lerp(65, 42, t); b = lerp(58, 41, t);
    if (inFlame(px, py)) {
      // 金色灯焰：上亮下暗
      const ft = clamp((py - 0.24) / 0.40, 0, 1);
      r = lerp(240, 201, ft); g = lerp(222, 168, ft); b = lerp(187, 106, ft);
    } else if (inSealBorder(px, py)) {
      r = 232; g = 211; b = 162; // 金色描边
    }
  } else {
    // 印章外一圈微光金线
    const o = 0.15, rr = 0.10;
    const d = Math.max(0, Math.sqrt((px - 0.5) ** 2 + (py - 0.5) ** 2) - 0.34);
    if (d < 0.008) { r = 201; g = 168; b = 106; }
  }
  return [r, g, b, 255];
}

function render(size) {
  const SS = 3; // 3×3 超采样抗锯齿
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sample((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size);
          r += c[0]; g += c[1]; b += c[2]; a += c[3];
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      buf[o] = Math.round(r / n);
      buf[o + 1] = Math.round(g / n);
      buf[o + 2] = Math.round(b / n);
      buf[o + 3] = Math.round(a / n);
    }
  }
  return buf;
}

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  ['icon-512.png', 512],
  ['icon-192.png', 192],
  ['icon-96.png', 96],
  ['icon-32.png', 32],
  ['apple-touch-icon.png', 180]
];

for (const [name, size] of targets) {
  const png = encodePNG(size, size, render(size));
  fs.writeFileSync(path.join(outDir, name), png);
  console.log('生成 ' + name + ' (' + size + '×' + size + ', ' + png.length + ' B)');
}
