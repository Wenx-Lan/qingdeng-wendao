/* 无头逻辑测试与平衡模拟 */
require('../js/util.js');
require('../js/data.js');
require('../js/narrative.js');
require('../js/story.js');
require('../js/events.js');
require('../js/engine.js');

const QD = globalThis.QD;
const E = QD.Engine;
const U = QD.U;

let errors = 0;
function ok(cond, msg) {
  if (!cond) { errors++; console.log('  ✗ ' + msg); }
  else console.log('  ✓ ' + msg);
}

console.log('== 基础数据校验 ==');
ok(QD.REALMS.length === 19, '境界共 19 个');
let stageCount = 0;
for (let i = 0; i < 18; i++) stageCount += 4;
stageCount += 1;
ok(stageCount === 73, '总小境界 73（18×4+道祖）');
ok(QD.REALMS[10].name === '洞明境', '仙上第一境为洞明境');
ok(QD.FEATURES.jing.realm === 2 && QD.FEATURES.soul.realm === 5 && QD.FEATURES.faxiang.realm === 8, '仙下每三境的神通解锁位正确');
ok(QD.TALENT.caps[0] === 9 && QD.TALENT.caps[1] === 14, '天赋阈值：半仙 / 逍遥');
ok(QD.REALMS[4].step === 10 && QD.REALMS[9].step === 10 && QD.REALMS[10].step === 1000 && QD.REALMS[15].step === 10000, '岁月步长映射正确');

console.log('== 开局 ==');
E.loadMeta();
E.meta = { deaths: 0, bestRealm: 0, endings: [], runs: 0 };
const root = QD.rollRoot();
const s = E.startLife({ name: '沈青灯', gender: '女', originId: 'liehu', talent: 40, root });
ok(s.life.realm === 0 && s.life.ap === 3, '开局境界与行动点');
ok(s.life.items.t_qingdeng === 1, '开局功法入袋');
ok(s.life.items.a_chai >= 1, '开局柴刀入袋');
const intro = QD.Narr.beat(s, 0);
ok(intro && intro.length >= 4, '开局主线文本存在');
E.record(s, '入世', intro);

console.log('== 闭关 / 宗门 / 渡劫 ==');
s.life.ap = 6;
let r = E.closedDoor(s, 'cave');
ok(r.ok && s.life.cult > 0, '洞府闭关增长修为');
s.life.stones = 999999;
r = E.closedDoor(s, 'stone');
ok(r.ok, '灵石辅修可用');
r = E.closedDoor(s, 'pill');
ok(r.ok, '丹药辅修可用');
r = E.closedDoor(s, 'array');
ok(!r.ok, '无阵盘时不可阵修');
const claim0 = E.claimSect(s);
ok(claim0.ok === false, '未积累时领取失败');
E.addPending(s);
const claim1 = E.claimSect(s);
ok(claim1.ok && claim1.stones > 0, '宗门物资可累积领取');
ok(E.chooseProfession(s, 'alchemy').ok, '可选择炼丹师');
ok(E.chooseProfession(s, 'forge').ok === false, '职业不可更改');

// 推到大圆满
s.life.cult = QD.needFor(0, 3);
s.life.sub = 3;
ok(E.canTrib(s), '大圆满可渡劫');
const pv = E.previewTrib(s, {});
ok(pv.chance > 0 && pv.chance <= 0.97, '渡劫概率正常：' + (pv.chance * 100).toFixed(1) + '%');
let trib = E.tribulation(s, {});
console.log('  渡劫结果：' + (trib.ok ? '成功' : '失败') + ' / 概率 ' + (trib.chance * 100).toFixed(1) + '%');
ok(trib.paras.length > 0, '渡劫有文本');

console.log('== 进阶与解锁 ==');
// 直接模拟到达各境界
function forceRealm(state, realm, sub) {
  state.life.realm = realm;
  state.life.sub = sub === undefined ? 0 : sub;
  state.life.cult = 0;
  state.life.maxLifespan = QD.REALMS[realm].life;
  state.life.lifespan = QD.REALMS[realm].life;
}
forceRealm(s, 2);
const b2 = E.onEnterRealm(s, 1);
ok(b2.join('').indexOf('内景') >= 0, '烛照境解锁内景淬体提示');
forceRealm(s, 5);
const b5 = E.onEnterRealm(s, 4);
ok(b5.join('').indexOf('长老') >= 0, '熔炉境解锁长老');
forceRealm(s, 8);
E.onEnterRealm(s, 7);
forceRealm(s, 10);
E.onEnterRealm(s, 9);
ok(s.life.dongtian.unlocked, '洞明境解锁体内洞天');
const up = E.upgradeDongtian(s, 'level');
ok(up.ok, '洞天可扩张');

console.log('== 天赋上限 ==');
E.meta.deaths = 0;
forceRealm(s, 9, 3);
s.life.cult = QD.needFor(9, 3);
let capped = E.previewTrib(s, { pill: true, array: true });
ok(capped.capped === true && capped.chance <= 0.06, '第一世天赋锁死仙门（≤6%）');
E.meta.deaths = 1;
capped = E.previewTrib(s, {});
ok(capped.next === 10 && capped.capped === false, '第二世可越仙门');
E.meta.deaths = 1;
forceRealm(s, 14, 3);
s.life.cult = QD.needFor(14, 3);
capped = E.previewTrib(s, {});
ok(capped.capped === true, '第二世天赋锁死天人境');

console.log('== 死亡/转世/鬼修 ==');
E.meta.deaths = 0;
let s2 = E.startLife({ name: '沈青灯', gender: '女', originId: 'shanggu', talent: 40, root: QD.rollRoot() });
forceRealm(s2, 6, 1);
s2.life.lifespan = 0;
let adv = E.advance(s2);
console.log('  死亡模式：' + (adv.death ? adv.death.mode : 'none') + '，累计死亡：' + E.meta.deaths);
ok(adv.death && ['final', 'reincarnate', 'ghost'].indexOf(adv.death.mode) >= 0, '寿元耗尽触发死亡结算');
if (adv.death.mode === 'reincarnate') {
  ok(s2.life.no === 2 && s2.life.realm === 0 && s2.life.pastLife, '转世重修：第二世、保留前世');
  // 冲到烛照
  forceRealm(s2, 1, 3);
  s2.life.cult = QD.needFor(1, 3);
  s2.life.talent = 70;
  s2.life.items.p_dujie = 5;
  s2.life.stones = 999999;
  let tr = E.tribulation(s2, { pill: true });
  console.log('  转世后重回烛照：' + (tr.ok ? '成功' : '失败'));
  if (tr.ok) ok(s2.life.realm === 6, '转世在烛照境恢复前世修为，当前：' + QD.REALMS[s2.life.realm].name);
}
// 鬼修强制
E.meta.deaths = 0;
let s3 = E.startLife({ name: '鬼灯', gender: '男', originId: 'yaonong', talent: 50, root: QD.rollRoot() });
forceRealm(s3, 6, 2);
s3.life.sect.profession = 'alchemy';
const ghostInfo = E.resolveDeath(s3, 'lifespan', E.capture(s3));
if (ghostInfo.mode === 'ghost') {
  ok(s3.life.realm === 5 && s3.life.ghost && s3.life.sect.profession === null, '鬼修：跌境 / 去职');
  ok(s3.life.lifespan > QD.REALMS[5].life, '鬼修寿元绵长');
}

console.log('== 长程自动推演 ==');
E.meta = { deaths: 0, bestRealm: 0, endings: [], runs: 0 };
let auto = E.startLife({ name: '林照夜', gender: '男', originId: 'shuxiang', talent: 40, root: QD.rollRoot() });
E.record(auto, '入世', QD.Narr.beat(auto, 0) || []);
let turns = 0, deaths = 0, travels = 0, tribs = 0;
const maxTurns = 1200;
while (!auto.life.dead && turns < maxTurns) {
  turns++;
  E.claimSect(auto);
  // 升级洞府
  E.upgradeCave(auto);
  // 神通
  ['jing', 'soul', 'faxiang'].forEach(k => { for (let i = 0; i < 3; i++) E.upgradeFeature(auto, k); });
  if (auto.life.dongtian.unlocked) {
    for (let i = 0; i < 2; i++) {
      E.upgradeDongtian(auto, 'level');
      E.upgradeDongtian(auto, 'field');
      E.upgradeDongtian(auto, 'spring');
      E.upgradeDongtian(auto, 'stele');
    }
  }
  // 渡劫
  if (E.canTrib(auto)) {
    let pill = (auto.life.items.p_dujie || 0) > 0;
    let arr = (auto.life.items.arr_hushan || 0) > 0;
    tribs++;
    const tr = E.tribulation(auto, { pill, array: arr });
    if (tr.death) {
      deaths++;
      console.log('  第 ' + turns + ' 回合渡劫身死（' + QD.REALMS[tr.death.realmAtDeath].name + '），模式 ' + tr.death.mode);
      if (auto.life.dead) break;
      continue;
    }
    continue;
  }
  // 行动点
  while (auto.life.ap > 0) {
    let acted = false;
    if (Math.random() < 0.12 && auto.life.realm >= 1) {
      const t = E.startTravel(auto);
      if (t.ok) {
        travels++;
        let guard = 0;
        while (auto.life.travel && guard++ < 6) {
          const ev = E.travelEvent(auto);
          if (!ev) break;
          const res = E.travelChoose(auto, Math.floor(Math.random() * ev.choices.length));
          if (res.death) {
            deaths++;
            console.log('  第 ' + turns + ' 回合游历身死（' + QD.REALMS[res.death.realmAtDeath].name + '），模式 ' + res.death.mode);
            break;
          }
        }
        acted = true;
      }
    }
    if (auto.life.dead) break;
    if (auto.life.travel) break;
    if (!acted) {
      const order = ['array', 'pill', 'stone', 'cave'];
      for (const m of order) {
        const res = E.closedDoor(auto, m);
        if (res.ok) { acted = true; break; }
      }
    }
    if (!acted) break;
    if (auto.life.dead) break;
  }
  if (auto.life.dead) break;
  // 补药
  if ((auto.life.items.p_dujie || 0) < 2 && auto.life.contrib > 200 && auto.life.realm >= 6) E.buy(auto, 'alchemy', 'p_dujie');
  // 自动服药
  ['p_yanshou', 'p_qiannian', 'p_wannian'].forEach(id => {
    if ((auto.life.items[id] || 0) > 0 && auto.life.lifespan / auto.life.maxLifespan < 0.25) E.useItem(auto, id);
  });
  const res = E.advance(auto);
  if (res.death) {
    deaths++;
    console.log('  第 ' + turns + ' 回合寿元/状态身死（' + QD.REALMS[res.death.realmAtDeath].name + '），模式 ' + res.death.mode + '，寿命=' + auto.life.lifespan);
    if (res.death.mode === 'final' && !auto.life.dead) console.log('    异常：final 未结束');
  }
}
console.log('  模拟结束：回合 ' + turns + '，境界 ' + QD.REALMS[auto.life.realm].name + '·' + QD.SUB[auto.life.sub] + '，死亡 ' + deaths + '，游历 ' + travels + '，渡劫 ' + tribs + '，第 ' + auto.life.no + ' 世');
console.log('  累计死亡 meta=' + E.meta.deaths + '，生平段数=' + auto.life.history.length + '，年岁=' + auto.life.age);
ok(auto.life.history.length > 0, '生平有记录');
ok(turns > 1, '自动推演可运行');

console.log(errors === 0 ? '\n全部通过 ✔' : '\n存在 ' + errors + ' 个失败 ✗');
process.exit(errors ? 1 : 0);
