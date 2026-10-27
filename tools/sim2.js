/* 多世自动推演：验证轮回成长与数值平衡 */
require('../js/util.js');
require('../js/data.js');
require('../js/narrative.js');
require('../js/story.js');
require('../js/events.js');
require('../js/engine.js');

const QD = globalThis.QD;
const E = QD.Engine;
const U = QD.U;

function itemScore(id) {
  const it = QD.ITEMS[id];
  if (!it) return 0;
  return (it.power || 0) * 100 + (it.cult || 0) * 160 + (it.trib || 0) * 300;
}

function bestFromBag(s, type) {
  let best = null, score = -1;
  Object.keys(s.life.items).forEach(id => {
    const it = QD.ITEMS[id];
    if (!it || it.type !== type) return;
    const sc = itemScore(id);
    if (sc > score) { score = sc; best = id; }
  });
  return best;
}

function shopBest(s, key) {
  const shop = QD.SHOPS[key];
  let best = null, score = -1;
  shop.items.forEach(en => {
    if (s.life.realm < en.minRealm) return;
    if (s.life.contrib < en.cost) return;
    const it = QD.ITEMS[en.id];
    if (!it || (it.type !== 'artifact' && it.type !== 'technique')) return;
    const sc = itemScore(en.id) - en.cost * 0.5;
    if (sc > score) { score = sc; best = en; }
  });
  return best;
}

function runLife(label, travelRate) {
  const ch = E.rollCharacter();
  let s = E.startLife({ name: '林照夜', gender: '男', originId: 'shuxiang', talent: ch.talent, root: ch.root });
  E.record(s, '入世', QD.Narr.beat(s, 0) || []);
  E.chooseProfession(s, 'alchemy');
  const startDeaths = E.meta.deaths;
  const startCap = ch.cap;
  let turns = 0, tribs = 0, travelDeaths = 0, tribDeaths = 0, maxRealm = 0;
  const realmTurns = [];
  let lastRealm = 0;
  let t0 = Date.now();
  while (!s.life.dead && turns < 4000) {
    turns++;
    if (s.life.ended) break;
    if (s.life.realm !== lastRealm) {
      realmTurns.push(QD.REALMS[s.life.realm].name + '@' + turns);
      lastRealm = s.life.realm;
      maxRealm = Math.max(maxRealm, s.life.realm);
    }
    E.claimSect(s);

    // 装备更好的
    const bArt = bestFromBag(s, 'artifact');
    if (bArt && itemScore(bArt) > itemScore(s.life.equip.artifact || '')) E.equip(s, bArt);
    const bTech = bestFromBag(s, 'technique');
    if (bTech && itemScore(bTech) > itemScore(s.life.equip.technique || '')) E.equip(s, bTech);

    // 商店换功法/法器
    ['scripture', 'artifact'].forEach(k => {
      for (let i = 0; i < 2; i++) {
        const en = shopBest(s, k);
        if (!en) break;
        const cur = k === 'scripture' ? s.life.equip.technique : s.life.equip.artifact;
        if (itemScore(en.id) < itemScore(cur || '')) break;
        const r = E.buy(s, k, en.id);
        if (!r.ok) break;
        if (k === 'scripture') E.equip(s, en.id); else E.equip(s, en.id);
      }
    });

    // 渡厄丹储备
    if (s.life.realm >= 4 && E.meta.deaths > 0) {
      const need = s.life.realm >= 8 ? 3 : 1;
      while ((s.life.items.p_dujie || 0) < need && s.life.contrib >= 60) {
        if (!E.buy(s, 'alchemy', 'p_dujie').ok) break;
      }
    }
    // 回血/解毒
    if (s.life.statuses.length) {
      ['p_jiedu', 'p_huichun', 'p_qingxin', 'p_pozhang'].forEach(id => {
        if ((s.life.items[id] || 0) > 0) E.useItem(s, id);
      });
    }
    // 洞府/神通/洞天
    for (let i = 0; i < 2; i++) E.upgradeCave(s);
    ['jing', 'soul', 'faxiang'].forEach(k => {
      for (let i = 0; i < 2; i++) E.upgradeFeature(s, k);
    });
    if (s.life.dongtian.unlocked) {
      for (let i = 0; i < 2; i++) {
        E.upgradeDongtian(s, 'level');
        E.upgradeDongtian(s, 'field');
        E.upgradeDongtian(s, 'spring');
        E.upgradeDongtian(s, 'stele');
      }
    }
    // 寿元丹
    if (s.life.lifespan / s.life.maxLifespan < 0.3) {
      ['p_yanshou', 'p_qiannian', 'p_wannian'].forEach(id => {
        if ((s.life.items[id] || 0) > 0) E.useItem(s, id);
      });
    }
    // 修为丹全吃
    ['p_juyuan', 'p_ninghua', 'p_yusui', 'p_xianling', 'p_lingye'].forEach(id => {
      let guard = 0;
      while ((s.life.items[id] || 0) > 0 && guard++ < 20) E.useItem(s, id);
    });

    // 渡劫
    if (E.canTrib(s)) {
      tribs++;
      const pv = E.previewTrib(s, {
        pill: (s.life.items.p_dujie || 0) > 0,
        array: (s.life.items.arr_hushan || 0) > 0
      });
      const tr = E.tribulation(s, {
        pill: (s.life.items.p_dujie || 0) > 0,
        array: (s.life.items.arr_hushan || 0) > 0
      });
      if (tr.death) {
        tribDeaths++;
        if (tr.death.mode === 'final') break;
        continue;
      }
      if (tr.ok) { maxRealm = Math.max(maxRealm, s.life.realm); }
      continue;
    }

    // 行动点
    while (s.life.ap > 0 && !s.life.dead) {
      let acted = false;
      if (travelRate > 0 && Math.random() < travelRate && s.life.realm >= 1) {
        const t = E.startTravel(s);
        if (t.ok) {
          acted = true;
          let guard = 0;
          while (s.life.travel && guard++ < 6) {
            const ev = E.travelEvent(s);
            if (!ev) break;
            const res = E.travelChoose(s, ev.choices.length - 1); // 多数为稳妥项
            if (res.death) {
              travelDeaths++;
              if (res.death.mode === 'final') { s.life.dead = true; break; }
              break;
            }
          }
          if (s.life.dead) break;
          continue;
        }
      }
      const order = ['array', 'pill', 'stone', 'cave'];
      for (const m of order) {
        const res = E.closedDoor(s, m);
        if (res.ok) { acted = true; break; }
      }
      if (!acted) break;
    }
    if (s.life.dead) break;
    const res = E.advance(s);
    if (res.death) {
      if (res.death.mode === 'final') break;
    }
    if (s.life.no > 1 && turns > 1 && s.life.pastLife && s.life.realm < 2) {
      // 转世初期，正常推进
    }
  }
  const ended = s.life.ended;
  return {
    label, turns, tribs, travelDeaths, tribDeaths, maxRealm,
    realm: s.life.realm, sub: s.life.sub, dead: s.life.dead, ended,
    age: s.life.age, no: s.life.no, deaths: E.meta.deaths - startDeaths,
    talent: ch.talent, cap: startCap, realmTurns, ms: Date.now() - t0,
    history: s.life.history.length
  };
}

E.meta = { deaths: 0, bestRealm: 0, endings: [], runs: 0 };
console.log('== 多世推演（谨慎路线） ==');
for (let i = 0; i < 6; i++) {
  const r = runLife('第' + (i + 1) + '轮', 0);
  console.log(JSON.stringify(r, null, 0));
  if (r.ended) { console.log('  ★ 到达道祖境，推演结束'); break; }
  if (E.meta.deaths > 8) break;
}

