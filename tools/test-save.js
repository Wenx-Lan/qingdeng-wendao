/* 存档 / 结局 / 寿元 测试 */
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

require('../js/util.js');
require('../js/data.js');
require('../js/narrative.js');
require('../js/events.js');
require('../js/engine.js');

const QD = globalThis.QD;
const E = QD.Engine;
let fail = 0;
function ok(c, m) { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; }

E.loadMeta();
E.meta = { deaths: 0, bestRealm: 0, endings: [], runs: 0 };
E.saveMeta();
let s = E.startLife({ name: '存灯', gender: '女', originId: 'yaonong', talent: 44, root: QD.rollRoot() });
E.record(s, '入世', QD.Narr.beat(s, 0) || []);
s.life.stones = 1234;
s.life.cult = 55;
E.save(s);
const loaded = E.load();
ok(loaded && loaded.life.name === '存灯', '存档写入与读取');
ok(loaded.life.stones === 1234 && loaded.life.cult === 55, '存档数值一致');
ok(loaded.life.history.length === 1, '存档保留生平');
ok(E.loadMeta().deaths === 0, '元存档读取');

// 寿元增长与状态清空
s.life.realm = 0; s.life.sub = 3; s.life.cult = QD.needFor(0, 3);
s.life.maxLifespan = 80; s.life.lifespan = 40;
E.addStatus(s, 'poison');
E.addStatus(s, 'heart');
s.life.items.p_dujie = 1;
const oldTalent = s.life.talent;
const origRandom = Math.random;
Math.random = () => 0;
const tr = E.tribulation(s, { pill: true });
Math.random = origRandom;
ok(tr.ok && s.life.realm === 1, '渡劫成功进入下一境');
ok(s.life.statuses.length === 0, '大境界突破清空负面状态');
ok(s.life.maxLifespan >= 80 + (80 - 60), '突破增加寿元（保留丹药加成）：' + s.life.maxLifespan);
ok(s.life.lifespan === s.life.maxLifespan, '突破后寿元回满');

// 道祖结局
E.meta.deaths = 3;
s.life.realm = 17; s.life.sub = 3; s.life.cult = QD.needFor(17, 3);
s.life.talent = 100;
s.life.items.p_dujie = 3;
const pv = E.previewTrib(s, { pill: true });
console.log('  道祖渡劫预览：' + (pv.chance * 100).toFixed(1) + '% capped=' + pv.capped);
Math.random = () => 0;
const end = E.tribulation(s, { pill: true });
Math.random = origRandom;
ok(end.ok && s.life.realm === 18, '渡劫成功到达道祖境');
ok(end.ending === true, '触发结局标记');
ok(end.paras.join('').indexOf('万道归灯') >= 0, '结局叙事已并入渡劫文本');
ok(E.meta.endings.indexOf('道祖') >= 0, '结局写入元存档');

// 鬼修突破保留鬼身
E.meta.deaths = 3;
const g = E.startLife({ name: '鬼灯', gender: '男', originId: 'liehu', talent: 100, root: QD.rollRoot() });
g.life.ghost = true;
g.life.realm = 8; g.life.sub = 3; g.life.cult = QD.needFor(8, 3);
g.life.statuses = [{ id: 'ghost', turns: 999 }];
g.life.items.p_dujie = 1;
Math.random = () => 0;
const gt = E.tribulation(g, { pill: true });
Math.random = origRandom;
ok(gt.ok && g.life.statuses.some(function (st) { return st.id === 'ghost'; }), '鬼修突破后保留鬼身');
ok(gt.ok && g.life.realm === 9, '鬼修也可正常渡劫');

// 死亡判定：10% 转世与 20% 鬼修独立判定
E.meta.deaths = 3;
const d = E.startLife({ name: '判灯', gender: '女', originId: 'yaonong', talent: 90, root: QD.rollRoot() });
d.life.realm = 7;
Math.random = () => 0.15;
const info = E.resolveDeath(d, 'lifespan', E.capture(d));
Math.random = origRandom;
ok(info.mode === 'ghost', '0.15 时：转世不中、鬼修命中');

// 死亡后读档仍可继续
E.meta.deaths = 1;
const s2 = E.startLife({ name: '二灯', gender: '男', originId: 'liehu', talent: QD.rollTalent(1), root: QD.rollRoot() });
ok(s2.life.talent >= 56 && s2.life.talent <= 72, '第二次死亡后天赋区间提升：' + s2.life.talent);

console.log(fail ? 'FAIL ' + fail : 'ALL PASS');
process.exit(fail ? 1 : 0);
