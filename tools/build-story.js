/* 从 小说/*.md 生成 js/story.js
   把小说正文按「境界 → 章节」映射结构化，「陆长庚」替换为 {name} 占位符。
   用法：node tools/build-story.js
*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NOVEL_DIR = path.join(ROOT, '小说');
const OUT = path.join(ROOT, 'js', 'story.js');

const FILES = [
  '卷一（上）-序至第六章.md',
  '卷一（下）-第七章至第十三章.md',
  '卷二-轮回登仙.md',
  '卷三-灯照万古.md'
];

// 章节号 → [目标 key, 索引]（realms 索引即境界号 0..18）
const CHAPTER_TARGET = {
  1: ['realms', 0], 2: ['realms', 0], 3: ['realms', 0],
  4: ['realms', 1], 5: ['realms', 2], 6: ['realms', 3],
  7: ['realms', 4], 8: ['realms', 5], 9: ['realms', 6],
  10: ['realms', 7], 11: ['realms', 8], 12: ['realms', 9],
  13: ['death'],
  14: ['reincarnate'],
  15: ['restore'],
  16: ['realms', 10], 17: ['realms', 11], 18: ['realms', 12],
  19: ['realms', 13], 20: ['realms', 14], 21: ['realms', 15],
  22: ['realms', 16], 23: ['realms', 17], 24: ['realms', 18]
};

function cnToNum(s) {
  const d = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (s === '十') return 10;
  if (s.length === 1) return d[s] || 0;
  if (s[0] === '十') return 10 + (d[s[1]] || 0);
  if (s.indexOf('十') === 1) return (d[s[0]] || 0) * 10 + (d[s[2]] || 0);
  if (s[s.length - 1] === '十') return (d[s[0]] || 0) * 10;
  return 0;
}

function resolveTarget(heading) {
  if (heading.indexOf('序章') === 0) return ['realms', 0];
  if (heading.indexOf('尾声') === 0) return ['realms', 18];
  const m = heading.match(/^第([一二三四五六七八九十]+)章/);
  if (!m) return null;
  const n = cnToNum(m[1]);
  return CHAPTER_TARGET[n] || null;
}

const out = {
  realms: Array.from({ length: 19 }, function () { return []; }),
  reincarnate: [],
  restore: [],
  death: []
};

let current = null;
let chapterCount = 0;

function flush() {
  if (!current || !current.paras.length) return;
  const t = current.target;
  if (t[0] === 'realms') {
    out.realms[t[1]] = out.realms[t[1]].concat(current.paras);
  } else {
    out[t[0]] = out[t[0]].concat(current.paras);
  }
}

function isMetaLine(line) {
  if (/^---$/.test(line)) return true;                 // 分隔线
  if (/^#\s/.test(line)) return true;                  // 文件标题（# 或 ## 已另处理，这里兜底）
  if (/^>/.test(line)) return true;                    // 引用
  if (/^（[^）]*完\s*[·／]?[^）]*待续[^）]*）$/.test(line)) return true; // （卷… 完 · 待续…）
  if (/^（全书完）$/.test(line)) return true;           // （全书完）
  return false;
}

for (const file of FILES) {
  const text = fs.readFileSync(path.join(NOVEL_DIR, file), 'utf8');
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (/^##\s/.test(line)) {
      flush();
      const heading = line.replace(/^##\s*/, '');
      const target = resolveTarget(heading);
      if (!target) {
        console.error('无法识别章节：' + heading);
        process.exit(1);
      }
      current = { target: target, paras: [] };
      chapterCount++;
      continue;
    }
    if (!line) continue;
    if (isMetaLine(line)) continue;
    if (!current) continue; // 章节标题之前的内容（如文件开头 # 标题、引用）忽略
    current.paras.push(line.replace(/陆长庚/g, '{name}'));
  }
}
flush();

const story = {
  realms: out.realms,
  reincarnate: out.reincarnate,
  restore: out.restore,
  death: out.death
};

const js =
  '/* 青灯问道 · 小说剧情（由 tools/build-story.js 自动生成，请勿手改）\n' +
  '   正文中 {name} 会在运行时替换为玩家道号 life.name。 */\n' +
  '(function (g) {\n' +
  "  'use strict';\n" +
  '  const QD = g.QD = g.QD || {};\n' +
  '  QD.STORY = ' + JSON.stringify(story, null, 2) + ';\n' +
  '  QD.Story = {\n' +
  '    paras: function (s, key) {\n' +
  "      const name = (s && s.life && s.life.name) || '无名';\n" +
  "      const parts = key.split('.');\n" +
  '      let node = QD.STORY;\n' +
  '      for (let i = 0; i < parts.length; i++) node = node[parts[i]];\n' +
  '      if (!Array.isArray(node)) return null;\n' +
  "      return node.map(function (p) { return String(p).split('{name}').join(name); });\n" +
  '    },\n' +
  '    realmParas: function (s, realm) {\n' +
  '      const arr = QD.STORY.realms && QD.STORY.realms[realm];\n' +
  '      if (!arr || !arr.length) return null;\n' +
  "      const name = (s && s.life && s.life.name) || '无名';\n" +
  "      return arr.map(function (p) { return String(p).split('{name}').join(name); });\n" +
  '    }\n' +
  '  };\n' +
  "})(typeof window !== 'undefined' ? window : globalThis);\n";

fs.writeFileSync(OUT, js, 'utf8');

// 摘要输出
let realmParaCount = 0;
out.realms.forEach(function (arr) { realmParaCount += arr.length; });
console.log('生成 ' + OUT);
console.log('章节数：' + chapterCount);
console.log('段落统计：realms ' + out.realms.map(function (a) { return a.length; }).join(','));
console.log('          reincarnate ' + out.reincarnate.length + ' / restore ' + out.restore.length + ' / death ' + out.death.length);
console.log('正文段落合计：' + (realmParaCount + out.reincarnate.length + out.restore.length + out.death.length));
console.log('文件大小：' + (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
