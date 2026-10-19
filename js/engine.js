/* 青灯问道 · 游戏引擎（核心） */
(function (g) {
  'use strict';
  const QD = g.QD = g.QD || {};
  const U = QD.U;

  const SAVE_KEY = 'qingdeng_save_v1';
  const META_KEY = 'qingdeng_meta_v1';

  let storage = null;
  try { if (typeof localStorage !== 'undefined') storage = localStorage; } catch (e) { storage = null; }

  const E = {};

  /* ================= 元存档：轮回灼痕 ================= */
  E.meta = { deaths: 0, bestRealm: 0, endings: [], runs: 0 };

  E.loadMeta = function () {
    if (!storage) return E.meta;
    try {
      const raw = storage.getItem(META_KEY);
      if (raw) {
        const m = JSON.parse(raw);
        E.meta = Object.assign({ deaths: 0, bestRealm: 0, endings: [], runs: 0 }, m);
        E.meta.deaths = Math.max(0, E.meta.deaths | 0);
        if (!Array.isArray(E.meta.endings)) E.meta.endings = [];
        if (typeof E.meta.bestRealm !== 'number') E.meta.bestRealm = 0;
      }
    } catch (e) { /* ignore */ }
    return E.meta;
  };

  E.saveMeta = function () {
    if (!storage) return;
    try { storage.setItem(META_KEY, JSON.stringify(E.meta)); } catch (e) { /* ignore */ }
  };

  E.save = function (s) {
    if (!storage || !s) return;
    try { storage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  };

  E.load = function () {
    if (!storage) return null;
    try {
      const raw = storage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.life) return null;
      return s;
    } catch (e) { return null; }
  };

  E.clearSave = function () {
    if (!storage) return;
    try { storage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  };

  E.resetMeta = function () {
    E.meta = { deaths: 0, bestRealm: 0, endings: [], runs: 0 };
    E.saveMeta();
  };

  /* ================= 角色创建 ================= */
  E.rollCharacter = function () {
    const deaths = E.meta.deaths;
    return {
      talent: QD.rollTalent(deaths),
      root: QD.rollRoot(),
      cap: QD.talentCap(deaths),
      capName: QD.talentCapName(deaths),
      deaths: deaths
    };
  };

  E.startLife = function (opts) {
    const deaths = E.meta.deaths;
    const talent = opts.talent || QD.rollTalent(deaths);
    const root = opts.root || QD.rollRoot();
    const origin = QD.ORIGINS.find(function (o) { return o.id === opts.originId; }) || QD.ORIGINS[0];
    const items = {};
    Object.keys(QD.START.items).forEach(function (k) { items[k] = QD.START.items[k]; });
    if (origin.bonus.items) {
      Object.keys(origin.bonus.items).forEach(function (k) { U.addItem(items, k, origin.bonus.items[k]); });
    }
    const R = QD.REALMS[0];
    const s = {
      version: 1,
      world: { year: 0, turn: 0 },
      settings: { autoAdvance: true },
      life: {
        no: 1,
        name: (opts.name || '无名').slice(0, 8),
        gender: opts.gender || '女',
        origin: origin.id,
        talent: talent,
        root: root,
        realm: 0,
        sub: 0,
        cult: 0,
        age: QD.START.age,
        lifespan: R.life,
        maxLifespan: R.life,
        ap: QD.START.ap,
        apMax: QD.START.apMax,
        stones: QD.START.stones + (origin.bonus.stones || 0),
        xianjing: 0,
        contrib: QD.START.contrib,
        items: items,
        equip: { artifact: 'a_chai', technique: 't_qingdeng' },
        statuses: [],
        buffs: [],
        cave: { level: 0 },
        sect: {
          profession: null,
          profLevel: 1,
          pending: { stones: 0, contrib: 0, items: {}, turns: 0 }
        },
        features: { jing: 0, soul: 0, faxiang: 0 },
        dongtian: { unlocked: false, level: 0, field: 0, spring: 0, stele: 0 },
        flags: {},
        recent: { closed: 0, travel: 0, craft: 0, feature: 0, dongtian: 0 },
        history: [],
        ghost: false,
        pastLife: null,
        restored: false,
        dead: false,
        ended: false
      }
    };
    if (!items.a_chai) s.life.equip.artifact = null;
    U.addItem(items, 't_qingdeng', 1);
    s.life.maxLifespan = R.life;
    s.life.lifespan = R.life;
    E.meta.runs++;
    E.saveMeta();
    E.save(s);
    return s;
  };

  /* ================= 派生数值 ================= */
  E.econ = function (s) { return Math.pow(3, Math.floor(s.life.realm / 3)); };

  E.derive = function (s) {
    const L = s.life;
    const base = QD.BASE_POWER * Math.pow(QD.POWER_GROWTH, L.realm) * (1 + L.sub * 0.18);
    let pMult = 1;
    const art = L.equip.artifact ? QD.ITEMS[L.equip.artifact] : null;
    const tech = L.equip.technique ? QD.ITEMS[L.equip.technique] : null;
    if (art) pMult += art.power || 0;
    if (tech) pMult += tech.power || 0;
    pMult += (L.features.jing || 0) * QD.FEATURES.jing.power;
    pMult += (L.features.faxiang || 0) * QD.FEATURES.faxiang.power;
    const dt = L.dongtian || {};
    if (dt.unlocked) {
      pMult += (dt.level || 0) * 0.05;
      if (dt.stele) pMult += QD.DONGTIAN.stele.power[dt.stele] || 0;
    }
    const origin = QD.ORIGINS.find(function (o) { return o.id === L.origin; });
    if (origin && origin.bonus.power) pMult += origin.bonus.power;

    let cultMul = 0.55 + (L.talent / 100) * 0.9 + (L.root ? L.root.mult : 0);
    if (tech) cultMul += tech.cult || 0;
    if (origin && origin.bonus.cult) cultMul += origin.bonus.cult;
    cultMul += (QD.CAVES[L.cave.level].mult - 1) * 0.6;
    cultMul += (L.features.soul || 0) * QD.FEATURES.soul.cult;
    if (dt.unlocked) cultMul += (dt.level || 0) * 0.05;
    if (L.buffs) L.buffs.forEach(function (b) { cultMul += b.cult || 0; });

    let trib = (L.talent || 0) * 0.0045;
    if (tech) trib += tech.trib || 0;
    if (art) trib += art.trib || 0;
    trib += (L.features.jing || 0) * QD.FEATURES.jing.trib;
    trib += (L.features.soul || 0) * QD.FEATURES.soul.trib;
    trib += (L.features.faxiang || 0) * QD.FEATURES.faxiang.trib;
    if (dt.unlocked) {
      trib += (dt.stele ? (QD.DONGTIAN.stele.trib[dt.stele] || 0) : 0);
      trib += (dt.level || 0) * 0.01;
    }

    let safe = (L.features.soul || 0) * QD.FEATURES.soul.safe;
    let powerMul = 1, cultMulPenalty = 0;
    (L.statuses || []).forEach(function (st) {
      const d = QD.STATUS[st.id];
      if (!d) return;
      if (d.power) pMult += d.power;
      if (d.cult) cultMul += d.cult;
      if (d.trib) trib += d.trib;
    });
    if (L.ghost) { trib -= 0.08; cultMul += 0.05; }

    return {
      power: Math.max(1, base * Math.max(0.2, pMult)),
      cultMul: Math.max(0.2, cultMul),
      trib: trib,
      safe: U.clamp(safe, 0, 0.35),
      basePower: base
    };
  };

  E.need = function (s) {
    if (s.life.realm >= 18) return 0;
    return QD.needFor(s.life.realm, s.life.sub);
  };

  /* ================= 修为与破境 ================= */
  E.addCult = function (s, amount) {
    const out = [];
    if (s.life.realm >= 18 || amount <= 0) return out;
    s.life.cult += amount;
    let guard = 0;
    while (s.life.sub < 3 && guard++ < 10) {
      const need = QD.needFor(s.life.realm, s.life.sub);
      if (s.life.cult < need) break;
      s.life.cult -= need;
      s.life.sub++;
      out.push('气海一震，你已踏入' + QD.REALMS[s.life.realm].name + '·' + QD.SUB[s.life.sub] + '。');
      if (s.life.sub === 3) {
        out.push('至此已臻大圆满，只待一场天劫。');
      }
    }
    if (s.life.sub >= 3) {
      const need = QD.needFor(s.life.realm, 3);
      if (s.life.cult > need) s.life.cult = need;
    }
    return out;
  };

  E.previewTrib = function (s, opts) {
    opts = opts || {};
    if (s.life.realm >= 18) return { chance: 0, next: null, can: false };
    const next = s.life.realm + 1;
    const d = E.derive(s);
    let c = 0.55 + s.life.talent * 0.0050 - next * 0.010 + d.trib;
    if (opts.pill) c += 0.25;
    if (opts.array) c += 0.10;
    const cap = QD.talentCap(E.meta.deaths);
    let capped = false;
    if (next > cap) { c = Math.min(c * 0.12, 0.06); capped = true; }
    return { chance: U.clamp(c, 0.03, 0.97), next: next, capped: capped, cap: cap };
  };

  E.canTrib = function (s) {
    if (s.life.dead || s.life.realm >= 18) return false;
    return s.life.sub === 3 && s.life.cult >= QD.needFor(s.life.realm, 3);
  };

  E.tribulation = function (s, opts) {
    opts = opts || {};
    if (!E.canTrib(s)) return { ok: false, msg: '尚未至大圆满，不可渡劫。' };
    const pv = E.previewTrib(s, opts);
    let pillUsed = false, arrayUsed = false;
    if (opts.pill && (s.life.items.p_dujie || 0) > 0) {
      U.removeItem(s.life.items, 'p_dujie', 1);
      pillUsed = true;
    }
    if (opts.array) {
      if ((s.life.items.arr_hushan || 0) > 0) { U.removeItem(s.life.items, 'arr_hushan', 1); arrayUsed = true; }
    }
    const chance = pv.chance;
    const roll = Math.random();
    const oldRealm = s.life.realm;
    const lifeNo = s.life.no;
    const realmLabel = QD.realmLabel(s.life.realm, s.life.sub);
    const age = s.life.age;
    if (roll < chance) {
      s.life.realm++;
      s.life.sub = 0;
      s.life.cult = 0;
      const R = QD.REALMS[s.life.realm];
      const oldBase = QD.REALMS[oldRealm].life;
      const gain = Math.max(0, R.life - oldBase);
      s.life.maxLifespan = Math.max(R.life, s.life.maxLifespan + gain);
      s.life.lifespan = s.life.maxLifespan;
      s.life.statuses = s.life.ghost ? [{ id: 'ghost', turns: 999 }] : [];
      s.life.buffs = [];
      E.meta.bestRealm = Math.max(E.meta.bestRealm, s.life.realm);
      let paras = QD.Narr.tribulationText(s, true, chance, false).slice();
      const extra = E.onEnterRealm(s, oldRealm);
      paras = paras.concat(extra);
      let ending = false;
      if (s.life.realm >= 18) {
        ending = true;
        s.life.ended = true;
        paras = paras.concat(QD.Narr.ENDING.paras);
        if (E.meta.endings.indexOf('道祖') < 0) E.meta.endings.push('道祖');
        E.saveMeta();
      }
      E.save(s);
      E.pushHistory(s, lifeNo, realmLabel, age, paras, '渡劫');
      return { ok: true, chance: chance, paras: paras, death: null, ending: ending, pillUsed: pillUsed, arrayUsed: arrayUsed };
    }
    if (Math.random() < 0.35) {
      const before = E.capture(s);
      const paras = QD.Narr.tribulationText(s, false, chance, true).slice();
      const info = E.resolveDeath(s, 'tribulation', before);
      const all = paras.concat(info.paras);
      E.pushHistory(s, lifeNo, realmLabel, age, all, '渡劫');
      E.save(s);
      return { ok: false, chance: chance, paras: all, death: info, pillUsed: pillUsed, arrayUsed: arrayUsed };
    }
    s.life.sub = 2;
    s.life.cult = Math.round(QD.needFor(s.life.realm, 2) * 0.6);
    E.addStatus(s, 'dao');
    E.save(s);
    const failParas = QD.Narr.tribulationText(s, false, chance, false);
    E.pushHistory(s, lifeNo, realmLabel, age, failParas, '渡劫');
    return {
      ok: false, chance: chance, pillUsed: pillUsed, arrayUsed: arrayUsed,
      paras: failParas
    };
  };

  E.onEnterRealm = function (s, oldRealm) {
    const out = [];
    if (s.life.realm === 2) out.push('心火照见内景。自今日起，你可行「内景淬体」，以气血淬炼脏腑。');
    if (s.life.realm === 5) out.push('神识已成。自今日起，你可行「神魂熔铸」；宗门为你披上了长老青袍。');
    if (s.life.realm === 8) out.push('道火可外显。自今日起，你可行「法相显化」，凝法相临世。');
    if (s.life.realm === 10) {
      s.life.dongtian.unlocked = true;
      s.life.dongtian.level = 1;
      out.push('体内洞天已开。主界面下方「体内洞天」自此可入。');
    }
    if (s.life.realm === 2 && s.life.pastLife) {
      out.push.apply(out, E.applyPastLife(s));
      return out;
    }
    const beat = QD.Narr.beat(s, s.life.realm);
    if (beat) out.push.apply(out, beat);
    return out;
  };

  E.applyPastLife = function (s) {
    const p = s.life.pastLife;
    if (!p) return [];
    s.life.realm = p.realm;
    s.life.sub = p.sub;
    s.life.cult = p.sub === 3 ? QD.needFor(p.realm, 3) : 0;
    const R = QD.REALMS[p.realm];
    s.life.maxLifespan = Math.max(R.life, p.maxLifespan || 0, s.life.maxLifespan);
    s.life.lifespan = s.life.maxLifespan;
    s.life.statuses = [];
    s.life.buffs = [];
    s.life.features = {
      jing: Math.max(p.features.jing || 0, s.life.features.jing || 0),
      soul: Math.max(p.features.soul || 0, s.life.features.soul || 0),
      faxiang: Math.max(p.features.faxiang || 0, s.life.features.faxiang || 0)
    };
    if (p.dongtian && p.dongtian.unlocked) s.life.dongtian = U.clone(p.dongtian);
    s.life.cave.level = Math.max(s.life.cave.level, p.cave || 0);
    s.life.restored = true;
    Object.keys(p.flags || {}).forEach(function (k) { if (!s.life.flags[k]) s.life.flags[k] = true; });
    E.meta.bestRealm = Math.max(E.meta.bestRealm, s.life.realm);
    const out = QD.Narr.reincarnateRestoreText(s).slice();
    return out;
  };

  /* ================= 状态 ================= */
  E.addStatus = function (s, id) {
    if (!QD.STATUS[id]) return false;
    const ex = s.life.statuses.find(function (x) { return x.id === id; });
    if (ex) { ex.turns = Math.max(ex.turns, QD.STATUS[id].turns || 3); return false; }
    s.life.statuses.push({ id: id, turns: QD.STATUS[id].turns || 3 });
    return true;
  };

  E.cureStatus = function (s, list) {
    let n = 0;
    s.life.statuses = s.life.statuses.filter(function (st) {
      if (list.indexOf(st.id) >= 0 && !QD.STATUS[st.id].permanent) { n++; return false; }
      return true;
    });
    return n;
  };

  /* ================= 宗门 ================= */
  E.rank = function (s) { return QD.SECT_RANK(s.life.realm); };

  E.addPending = function (s) {
    const econ = E.econ(s);
    const rank = E.rank(s);
    const mult = s.life.ghost ? 1 : rank.mult;
    const p = s.life.sect.pending;
    p.stones += Math.round((8 * econ + 6) * mult);
    p.contrib += Math.round((2 + s.life.realm * 0.5) * mult);
    p.turns++;
    if (Math.random() < 0.32) {
      const pool = ['p_juyuan', 'p_huichun', 'p_jiedu', 'm_qingyuan', 'm_zhenwen', 'p_ninghua'];
      U.addItem(p.items, U.pick(pool), 1);
    }
    if (s.life.realm >= 5 && Math.random() < 0.18) {
      const pool = ['p_yanshou', 'p_dujie', 'p_wudao', 'm_jiuling', 'm_hanjing'];
      U.addItem(p.items, U.pick(pool), 1);
    }
  };

  E.claimSect = function (s) {
    const p = s.life.sect.pending;
    if (!p.turns) return { ok: false, msg: '宗门那边没有积压的物资。' };
    const stones = p.stones, contrib = p.contrib, turns = p.turns;
    s.life.stones += stones;
    s.life.contrib += contrib;
    const items = {};
    Object.keys(p.items).forEach(function (k) {
      U.addItem(s.life.items, k, p.items[k]);
      items[k] = p.items[k];
    });
    p.stones = 0; p.contrib = 0; p.items = {}; p.turns = 0;
    E.save(s);
    return { ok: true, stones: stones, contrib: contrib, items: items, turns: turns };
  };

  E.chooseProfession = function (s, id) {
    if (s.life.ghost) return { ok: false, msg: '鬼身不可再领宗门职司。' };
    if (s.life.sect.profession) return { ok: false, msg: '你已入他道，不可再改。' };
    if (!QD.SECT.professions[id]) return { ok: false, msg: '无此职司。' };
    s.life.sect.profession = id;
    E.save(s);
    return { ok: true, msg: '你正式成为青灯宗' + QD.SECT.professions[id].name + '。' };
  };

  E.craft = function (s, recipeId) {
    const r = QD.RECIPES.find(function (x) { return x.id === recipeId; });
    if (!r) return { ok: false, msg: '无此丹方。' };
    if (s.life.ghost) return { ok: false, msg: '鬼身阴气太重，炉火不认你。' };
    if (s.life.sect.profession !== r.job) return { ok: false, msg: '此非你所长。' };
    if (s.life.realm < r.minRealm) return { ok: false, msg: '境界不足，强行开炉只会炸炉。' };
    for (const k in r.mats) {
      if ((s.life.items[k] || 0) < r.mats[k]) return { ok: false, msg: '材料不足：' + QD.ITEMS[k].name + ' ×' + r.mats[k] };
    }
    for (const k in r.mats) U.removeItem(s.life.items, k, r.mats[k]);
    s.life.recent.craft++;
    if (Math.random() < r.success) {
      U.addItem(s.life.items, r.out, 1);
      s.life.contrib += r.contrib;
      s.life.sect.profLevel = Math.min(9, (s.life.sect.profLevel || 1) + (Math.random() < 0.3 ? 1 : 0));
      E.save(s);
      return { ok: true, msg: '炉火纯青。你炼成了「' + QD.ITEMS[r.out].name + '」，宗门另记 ' + r.contrib + ' 点贡献。', out: r.out };
    }
    E.save(s);
    return { ok: false, msg: '火候差了一线，材料尽毁。你看着炉底的灰，沉默了很久。' };
  };

  E.buy = function (s, shopKey, itemId) {
    const shop = QD.SHOPS[shopKey];
    if (!shop) return { ok: false, msg: '无此阁。' };
    const entry = shop.items.find(function (x) { return x.id === itemId; });
    if (!entry) return { ok: false, msg: '阁中无此物。' };
    if (s.life.realm < entry.minRealm) return { ok: false, msg: '境界不足，此物不予外借。' };
    if (s.life.contrib < entry.cost) return { ok: false, msg: '贡献点不足，尚差 ' + (entry.cost - s.life.contrib) + ' 点。' };
    s.life.contrib -= entry.cost;
    U.addItem(s.life.items, itemId, 1);
    E.save(s);
    return { ok: true, msg: '你以 ' + entry.cost + ' 点贡献换得「' + QD.ITEMS[itemId].name + '」。' };
  };

  /* ================= 闭关 ================= */
  E.closedMethods = {
    cave: { name: '洞府闭关', base: 0.14, desc: '不耗外物，只凭洞府灵气。效果与洞府等级相关。' },
    stone: { name: '灵石辅修', base: 0.20, desc: '以灵石布成小阵，灵气浓度倍增。' },
    pill: { name: '丹药辅修', base: 0.25, desc: '服下一枚修为丹，药力化作修为。' },
    array: { name: '聚灵阵辅修', base: 0.30, desc: '激活阵盘，聚拢方圆十里的灵气。' }
  };

  E.closedDoor = function (s, method) {
    if (s.life.dead) return { ok: false, msg: '人已不在。' };
    if (s.life.ap < 1) return { ok: false, msg: '行动点不足，先渡过这一段岁月吧。' };
    if (s.life.sub === 3 && s.life.cult >= E.need(s)) return { ok: false, msg: '已至大圆满，当先渡劫，再闭关也是白费。' };
    if (s.life.realm >= 18) return { ok: false, msg: '道祖之境，已无需闭关。' };
    const m = E.closedMethods[method];
    if (!m) return { ok: false, msg: '无此闭关之法。' };
    const econ = E.econ(s);
    let costText = '';
    if (method === 'stone') {
      const cost = Math.round(20 * econ);
      if (s.life.stones < cost) return { ok: false, msg: '灵石不足，需 ' + U.fmt(cost) + ' 枚。' };
      s.life.stones -= cost;
      costText = '消耗灵石 ' + U.fmt(cost);
    } else if (method === 'pill') {
      const order = ['p_juyuan', 'p_ninghua', 'p_yusui', 'p_xianling', 'p_lingye'];
      const have = order.find(function (id) { return (s.life.items[id] || 0) > 0; });
      if (!have) return { ok: false, msg: '储物戒中没有可用的修为丹。' };
      U.removeItem(s.life.items, have, 1);
      costText = '服下' + QD.ITEMS[have].name;
    } else if (method === 'array') {
      let have = null;
      if ((s.life.items.arr_zhoutian || 0) > 0) have = 'arr_zhoutian';
      else if ((s.life.items.arr_juling || 0) > 0) have = 'arr_juling';
      if (!have) return { ok: false, msg: '没有可用的聚灵阵盘。' };
      U.removeItem(s.life.items, have, 1);
      costText = '激活' + QD.ITEMS[have].name;
    }
    s.life.ap--;
    s.life.recent.closed++;
    const need = E.need(s);
    const d = E.derive(s);
    const amount = Math.max(1, Math.round(need * m.base * d.cultMul));
    const ups = E.addCult(s, amount);
    E.save(s);
    return {
      ok: true,
      amount: amount,
      ups: ups,
      msg: m.name + '：' + costText + '，修为增长 ' + U.fmt(amount) + ' 点。',
      paras: ups
    };
  };

  /* ================= 游历 ================= */
  E.startTravel = function (s) {
    if (s.life.dead) return { ok: false, msg: '人已不在。' };
    if (s.life.ap < 1) return { ok: false, msg: '行动点不足。' };
    s.life.ap--;
    s.life.recent.travel++;
    const count = 3 + (Math.random() < 0.4 ? 1 : 0);
    const events = QD.pickEvents(s, count);
    s.life.travel = {
      events: events.map(function (e) { return e.id; }),
      index: 0,
      results: []
    };
    E.save(s);
    return { ok: true, session: s.life.travel, events: events };
  };

  E.travelEvent = function (s) {
    const t = s.life.travel;
    if (!t) return null;
    const id = t.events[t.index];
    return QD.EVENTS.find(function (e) { return e.id === id; }) || null;
  };

  E.travelChoose = function (s, choiceIndex) {
    const t = s.life.travel;
    if (!t) return { ok: false, msg: '你并不在路上。' };
    const ev = E.travelEvent(s);
    if (!ev) return { ok: false, msg: '前方无路。' };
    const ch = ev.choices[choiceIndex];
    if (!ch) return { ok: false, msg: '无此选择。' };
    const lifeNo = s.life.no;
    const realmLabel = QD.realmLabel(s.life.realm, s.life.sub);
    const age = s.life.age;
    const d = E.derive(s);
    const effThreat = Math.max(ev.threat || 0, s.life.realm - 2);
    const threatPower = QD.BASE_POWER * Math.pow(QD.POWER_GROWTH, effThreat);
    const edge = d.power / threatPower;
    const out = ch.resolve(s, edge);
    const applied = E.applyEffects(s, out.effects || {});
    let death = null;
    if (out.deathChance) {
      let dc = out.deathChance * (1 - d.safe);
      if (s.life.ghost) dc *= 1.25;
      if (Math.random() < dc) {
        const before = E.capture(s);
        death = E.resolveDeath(s, 'travel', before);
        death.paras = [out.text].concat(death.paras);
      }
    }
    t.index++;
    t.results.push({ text: out.text, applied: applied, title: ev.title, death: !!death });
    const done = t.index >= t.events.length || !!death;
    if (done) {
      const paras = t.results.map(function (r) { return r.text; });
      if (death && death.paras && death.paras.length > 1) {
        paras.push.apply(paras, death.paras.slice(1));
      }
      s.life.history.push({
        life: lifeNo,
        turn: s.world.turn,
        year: s.world.year,
        age: age,
        realm: realmLabel,
        title: '游历 · ' + (t.results[0] ? t.results[0].title : '山外'),
        paras: paras
      });
      if (s.life.history.length > 600) s.life.history.splice(0, s.life.history.length - 600);
      s.life.travel = null;
    }
    E.save(s);
    return {
      ok: true,
      text: out.text,
      effects: applied,
      death: death,
      done: done,
      title: ev.title,
      index: t.index,
      total: t.events.length
    };
  };

  E.applyEffects = function (s, eff) {
    const log = [];
    if (!eff) return log;
    if (eff.stones) {
      s.life.stones = Math.max(0, s.life.stones + eff.stones);
      log.push((eff.stones > 0 ? '灵石 +' : '灵石 ') + U.fmt(eff.stones));
    }
    if (eff.contrib) {
      s.life.contrib = Math.max(0, s.life.contrib + eff.contrib);
      log.push((eff.contrib > 0 ? '贡献 +' : '贡献 ') + eff.contrib);
    }
    if (eff.xianjing) {
      s.life.xianjing = Math.max(0, s.life.xianjing + eff.xianjing);
      log.push('仙晶 +' + eff.xianjing);
    }
    if (eff.cult) {
      const amt = Math.round(E.need(s) * eff.cult);
      const ups = E.addCult(s, amt);
      log.push('修为 +' + U.fmt(amt));
      if (ups.length) log.push.apply(log, ups);
    }
    if (eff.items) {
      Object.keys(eff.items).forEach(function (k) {
        U.addItem(s.life.items, k, eff.items[k]);
        log.push(QD.ITEMS[k].name + ' ×' + eff.items[k]);
      });
    }
    if (eff.usePill) {
      U.removeItem(s.life.items, eff.usePill, 1);
      log.push('消耗' + QD.ITEMS[eff.usePill].name + ' ×1');
    }
    if (eff.useArray) {
      const arr = ['arr_juling', 'arr_zhoutian', 'arr_hushan'].find(function (id) { return (s.life.items[id] || 0) > 0; });
      if (arr) { U.removeItem(s.life.items, arr, 1); log.push('消耗' + QD.ITEMS[arr].name); }
    }
    if (eff.status) {
      E.addStatus(s, eff.status);
      log.push('状态：' + QD.STATUS[eff.status].name);
    }
    if (eff.cure) {
      const n = E.cureStatus(s, eff.cure);
      if (n) log.push('旧疾尽去');
    }
    if (eff.lifespanPct) {
      const add = Math.round(s.life.maxLifespan * eff.lifespanPct);
      s.life.maxLifespan = Math.max(10, s.life.maxLifespan + add);
      s.life.lifespan = Math.max(0, s.life.lifespan + add);
      log.push('寿元 ' + (add > 0 ? '+' : '') + U.fmt(add));
    }
    if (eff.talent) {
      s.life.talent = Math.min(120, s.life.talent + eff.talent);
      log.push('天赋 +' + eff.talent);
    }
    return log;
  };

  /* ================= 推进岁月 ================= */
  E.advance = function (s) {
    if (s.life.dead) return { paras: [], death: null, gameover: true };
    const L = s.life;
    const years = QD.stepOf(L.realm);
    s.world.turn++;
    s.world.year += years;
    L.age += years;
    L.lifespan -= years;
    L.ap = Math.min(L.apMax, L.ap + QD.START.apGain);

    const statusNotes = [];
    let deathCause = null;
    for (let i = L.statuses.length - 1; i >= 0; i--) {
      const st = L.statuses[i];
      const d = QD.STATUS[st.id];
      if (!d) { L.statuses.splice(i, 1); continue; }
      if (d.drain) {
        const loss = Math.max(1, Math.round(L.maxLifespan * d.drain));
        L.lifespan -= loss;
        statusNotes.push(d.name + '损耗寿元 ' + U.fmt(loss));
      }
      if (d.lethal && Math.random() < d.lethal) {
        deathCause = 'status';
      }
      if (!d.permanent) {
        st.turns--;
        if (st.turns <= 0) {
          statusNotes.push(d.name + '已愈');
          L.statuses.splice(i, 1);
        }
      }
    }
    if (L.lifespan <= 0 && !deathCause) deathCause = 'lifespan';

    let gain = 0;
    let harvest = [];
    if (!deathCause) {
      E.addPending(s);
      if (L.realm < 18) {
        const d = E.derive(s);
        gain = Math.max(1, Math.round(E.need(s) * 0.045 * d.cultMul));
        L.buffs = (L.buffs || []).filter(function (b) {
          b.turns--;
          return b.turns > 0;
        });
      }
      if (L.dongtian && L.dongtian.unlocked) {
        const dt = L.dongtian;
        if (dt.field > 0) {
          const n = QD.DONGTIAN.field.yield[dt.field];
          U.addItem(L.items, 'm_qingyuan', n);
          U.addItem(L.items, 'm_chiyang', Math.ceil(n / 2));
          harvest.push('灵田结了 ' + n + ' 株青元草');
        }
        if (dt.spring > 0) {
          const n = QD.DONGTIAN.spring.yield[dt.spring];
          U.addItem(L.items, 'p_lingye', n);
          harvest.push('灵泉凝出 ' + n + ' 滴洞天灵液');
        }
      }
    }

    const ctx = {
      years: years,
      actions: L.recent,
      pendingTurns: L.sect.pending.turns,
      death: !!deathCause
    };
    let paras = QD.Narr.advanceText(s, ctx);
    if (gain) {
      const ups = E.addCult(s, gain);
      if (ups.length) paras = paras.slice(0, 2).concat(ups, paras.slice(2));
    }
    if (harvest.length) paras.push('洞天之中，' + harvest.join('；') + '。');
    if (statusNotes.length) paras.push(statusNotes.join('；') + '。');

    const lifeNo = L.no;
    const realmLabel = QD.realmLabel(L.realm, L.sub);
    const age = L.age;
    let deathInfo = null;
    if (deathCause) {
      const before = E.capture(s);
      deathInfo = E.resolveDeath(s, deathCause === 'status' ? 'status' : 'lifespan', before);
      paras = paras.concat(deathInfo.paras);
    }
    E.pushHistory(s, lifeNo, realmLabel, age, paras, QD.Narr.periodWord(years));
    L.recent = { closed: 0, travel: 0, craft: 0, feature: 0, dongtian: 0 };
    E.save(s);
    return {
      paras: paras,
      death: deathInfo,
      gameover: !!(deathInfo && deathInfo.mode === 'final'),
      years: years
    };
  };

  E.pushHistory = function (s, lifeNo, realmLabel, age, paras, periodLabel) {
    s.life.history.push({
      life: lifeNo,
      turn: s.world.turn,
      year: s.world.year,
      age: age,
      realm: realmLabel,
      title: '第' + s.world.turn + '段 · ' + (periodLabel || QD.Narr.periodWord(QD.stepOf(s.life.realm))),
      paras: paras.slice()
    });
    if (s.life.history.length > 600) s.life.history.splice(0, s.life.history.length - 600);
  };

  E.record = function (s, title, paras) {
    s.life.history.push({
      life: s.life.no,
      turn: s.world.turn,
      year: s.world.year,
      age: s.life.age,
      realm: QD.realmLabel(s.life.realm, s.life.sub),
      title: title,
      paras: paras.slice()
    });
    E.save(s);
  };

  /* ================= 死亡与轮回 ================= */
  E.capture = function (s) {
    return {
      no: s.life.no,
      realm: s.life.realm,
      sub: s.life.sub,
      items: U.clone(s.life.items),
      equip: U.clone(s.life.equip),
      features: U.clone(s.life.features),
      cave: s.life.cave.level,
      dongtian: U.clone(s.life.dongtian),
      flags: U.clone(s.life.flags),
      stones: s.life.stones,
      contrib: s.life.contrib,
      talent: s.life.talent,
      maxLifespan: s.life.maxLifespan,
      lifespan: s.life.lifespan
    };
  };

  E.resolveDeath = function (s, cause, before) {
    const L = s.life;
    const cap = before || E.capture(s);
    const realmAtDeath = cap.realm;
    E.meta.deaths++;
    E.meta.bestRealm = Math.max(E.meta.bestRealm, realmAtDeath);
    E.saveMeta();

    let mode = 'final';
    const reincRoll = realmAtDeath >= 6 && Math.random() < 0.10;
    const ghostRoll = realmAtDeath >= 4 && Math.random() < 0.20;
    if (reincRoll) mode = 'reincarnate';
    else if (ghostRoll) mode = 'ghost';

    const paras = QD.Narr.deathText(s, cause, mode).slice();
    L.sect.pending = { stones: 0, contrib: 0, items: {}, turns: 0 };
    if (mode === 'reincarnate') {
      L.no++;
      L.pastLife = cap;
      L.realm = 0;
      L.sub = 0;
      L.cult = 0;
      L.age = QD.START.age;
      L.maxLifespan = QD.REALMS[0].life;
      L.lifespan = QD.REALMS[0].life;
      L.ap = QD.START.ap;
      L.statuses = [];
      L.buffs = [];
      L.dongtian = { unlocked: false, level: 0, field: 0, spring: 0, stele: 0 };
      L.features = { jing: 0, soul: 0, faxiang: 0 };
      L.cave = { level: 0 };
      L.dead = false;
      L.ghost = false;
      L.restored = false;
      L.talent = Math.min(120, L.talent + U.randInt(1, 3));
      L.flags = U.clone(cap.flags);
      L.recent = { closed: 0, travel: 0, craft: 0, feature: 0, dongtian: 0 };
      L.travel = null;
      paras.push('灯火没有灭。你在黑暗里走了很久，久到忘了自己的名字。');
      paras.push('忽然，前方亮起一点光。老瞎子的声音从光里传来：“灯芯还在。再点一次。”');
      paras.push('你睁开眼。柳溪村的晨雾漫过柴门，你十六岁，手里空空的，可胸口有一点火星正在慢慢烧起来。');
      paras.push('——第二世开始了。前世的修为，将在你重回烛照境时尽数归来。');
    } else if (mode === 'ghost') {
      const prevRealm = realmAtDeath;
      L.ghost = true;
      L.realm = Math.max(0, prevRealm - 1);
      L.sub = 0;
      L.cult = 0;
      L.maxLifespan = Math.round(QD.REALMS[prevRealm].life * 2.5);
      L.lifespan = L.maxLifespan;
      L.statuses = [{ id: 'ghost', turns: 999 }];
      L.buffs = [];
      L.dead = false;
      L.sect.profession = null;
      L.talent = Math.min(120, L.talent + 1);
      L.travel = null;
      L.flags.ev_ghost = true;
      paras.push.apply(paras, QD.Narr.ghostText(s));
      paras.push('——你以鬼身续命，境界跌落一重，宗门只余基础物资。寿元却比生前长了数倍。');
    } else {
      L.dead = true;
      L.travel = null;
    }
    E.saveMeta();
    E.save(s);
    return { mode: mode, cause: cause, paras: paras, realmAtDeath: realmAtDeath };
  };

  /* ================= 洞府 / 神通 / 洞天 ================= */
  E.upgradeCave = function (s) {
    const lv = s.life.cave.level;
    if (lv >= QD.CAVES.length - 1) return { ok: false, msg: '洞府已至极致，再无提升余地。' };
    const cost = QD.CAVES[lv + 1].cost;
    if (s.life.stones < cost) return { ok: false, msg: '灵石不足，尚差 ' + U.fmt(cost - s.life.stones) + ' 枚。' };
    s.life.stones -= cost;
    s.life.cave.level++;
    E.save(s);
    return { ok: true, msg: '洞府扩建为「' + QD.CAVES[s.life.cave.level].name + '」，灵气浓郁了几分。' };
  };

  E.upgradeFeature = function (s, key) {
    const f = QD.FEATURES[key];
    if (!f) return { ok: false, msg: '无此神通。' };
    if (s.life.realm < f.realm) return { ok: false, msg: '境界不足，尚不能修习' + f.name + '。' };
    const lv = s.life.features[key] || 0;
    if (lv >= f.max) return { ok: false, msg: f.name + '已至圆满。' };
    const cost = f.cost(lv);
    if (s.life.stones < cost) return { ok: false, msg: '灵石不足，尚差 ' + U.fmt(cost - s.life.stones) + ' 枚。' };
    s.life.stones -= cost;
    s.life.features[key] = lv + 1;
    s.life.recent.feature++;
    E.save(s);
    return { ok: true, msg: f.name + '进至第 ' + (lv + 1) + ' 层。' };
  };

  E.upgradeDongtian = function (s, part) {
    const dt = s.life.dongtian;
    if (!dt.unlocked) return { ok: false, msg: '体内洞天尚未开启。' };
    if (part === 'level') {
      if (dt.level >= QD.DONGTIAN.levels.length - 1) return { ok: false, msg: '洞天已至大千，再无可扩。' };
      const cost = QD.DONGTIAN.levels[dt.level + 1].cost;
      if (s.life.stones < cost) return { ok: false, msg: '灵石不足，尚差 ' + U.fmt(cost - s.life.stones) + ' 枚。' };
      s.life.stones -= cost;
      dt.level++;
      E.save(s);
      return { ok: true, msg: '洞天扩张至「' + QD.DONGTIAN.levels[dt.level].name + '」境。' };
    }
    const cfg = QD.DONGTIAN[part];
    if (!cfg) return { ok: false, msg: '无此灵脉。' };
    const lv = dt[part] || 0;
    if (lv >= 8) return { ok: false, msg: cfg.name + '已至圆满。' };
    const cost = cfg.costs[lv + 1];
    if (dt.level < lv + 1) return { ok: false, msg: '洞天境阶不足，先扩张洞天。' };
    if (s.life.stones < cost) return { ok: false, msg: '灵石不足，尚差 ' + U.fmt(cost - s.life.stones) + ' 枚。' };
    s.life.stones -= cost;
    dt[part] = lv + 1;
    s.life.recent.dongtian++;
    E.save(s);
    return { ok: true, msg: cfg.name + '提升至 ' + (lv + 1) + ' 阶。' };
  };

  /* ================= 物品 ================= */
  E.useItem = function (s, id) {
    const it = QD.ITEMS[id];
    if (!it) return { ok: false, msg: '无此物。' };
    if ((s.life.items[id] || 0) <= 0) return { ok: false, msg: '储物戒中没有此物。' };
    if (it.type === 'artifact' || it.type === 'technique') {
      return E.equip(s, id);
    }
    if (it.type !== 'pill') return { ok: false, msg: '此物不可直接服用。' };
    if (id === 'p_dujie') return { ok: false, msg: '渡厄丹需在渡劫时服用，此刻服下只是浪费。' };
    const eff = it.effect || {};
    if (eff.cure) {
      const has = s.life.statuses.some(function (st) { return eff.cure.indexOf(st.id) >= 0; });
      if (!has) return { ok: false, msg: '身上并无此症，服之无益。' };
    }
    const log = [];
    if (eff.cult) {
      if (s.life.realm >= 18) return { ok: false, msg: '道祖之境，已无需增修。' };
      const amt = Math.round(E.need(s) * eff.cult);
      const ups = E.addCult(s, amt);
      log.push('修为 +' + U.fmt(amt));
      if (ups.length) log.push.apply(log, ups);
    }
    if (eff.lifespanPct) {
      const add = Math.round(s.life.maxLifespan * eff.lifespanPct);
      s.life.maxLifespan += add;
      s.life.lifespan += add;
      log.push('寿元 +' + U.fmt(add));
    }
    if (eff.cure) {
      const n = E.cureStatus(s, eff.cure);
      log.push(n ? '药到病除' : '身上并无此症');
    }
    if (eff.buff) {
      s.life.buffs = s.life.buffs || [];
      const ex = s.life.buffs.find(function (b) { return b.id === eff.buff.id; });
      if (ex) ex.turns = eff.buff.turns;
      else s.life.buffs.push({ id: eff.buff.id, name: eff.buff.name, turns: eff.buff.turns, cult: eff.buff.cult });
      log.push('服后灵台空明（' + eff.buff.turns + ' 段内修炼 +' + Math.round(eff.buff.cult * 100) + '%）');
    }
    if (eff.talent) {
      s.life.talent = Math.min(120, s.life.talent + eff.talent);
      log.push('天赋 +' + eff.talent);
    }
    U.removeItem(s.life.items, id, 1);
    E.save(s);
    return { ok: true, msg: '服下「' + it.name + '」：' + log.join('，') + '。' };
  };

  E.equip = function (s, id) {
    const it = QD.ITEMS[id];
    if (!it) return { ok: false, msg: '无此物。' };
    if ((s.life.items[id] || 0) <= 0) return { ok: false, msg: '储物戒中没有此物。' };
    if (it.type === 'artifact') {
      s.life.equip.artifact = id;
      E.save(s);
      return { ok: true, msg: '你取出「' + it.name + '」，替换了旧器。' };
    }
    if (it.type === 'technique') {
      s.life.equip.technique = id;
      E.save(s);
      return { ok: true, msg: '你改修「' + it.name + '」，气机为之一变。' };
    }
    return { ok: false, msg: '此物不可装备。' };
  };

  /* ================= 结局 / 重开 ================= */
  E.startNextLife = function () {
    E.clearSave();
    return E.meta;
  };

  E.ending = function (s) {
    return {
      title: QD.Narr.ENDING.title,
      paras: QD.Narr.ENDING.paras,
      stats: {
        name: s.life.name,
        realm: QD.REALMS[s.life.realm].name,
        age: s.life.age,
        lives: s.life.no,
        deaths: E.meta.deaths
      }
    };
  };

  E.autoPlayDryRun = function () {
    /* 供测试使用：不依赖 DOM 的简化推演 */
    return E.meta;
  };

  QD.Engine = E;
})(typeof window !== 'undefined' ? window : globalThis);

