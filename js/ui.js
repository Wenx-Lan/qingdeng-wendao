/* 青灯问道 · 界面层 */
(function (g) {
  'use strict';
  const QD = g.QD, E = QD.Engine, U = QD.U;
  const $ = function (sel) { return document.querySelector(sel); };
  const h = function (v) { return U.esc(v); };
  const fmt = function (n) { return U.fmt(n); };

  const UI = QD.UI = {
    s: null,
    preview: null,
    creation: { gender: '男', originId: 'liehu' },
    modal: null,
    tab: null,
    travelResult: null,
    tribOpts: { pill: false, array: false },
    _busy: false,
    _bioLen: 0,
    _autoTimer: null,
    _storyActive: false,
    _lastRealm: 0
  };

  function pct(n) { return Math.round(n * 100) + '%'; }
  function lifeName(no) { return ['第一世', '第二世', '第三世', '第四世', '第五世', '第六世', '第七世', '第八世', '第九世'][no - 1] || ('第' + no + '世'); }
  function stepText(step) {
    return { 1: '一年', 10: '十年', 1000: '千年', 10000: '万年' }[step] || (step + '年');
  }
  function stepShort(step) {
    return { 1: '下一年', 10: '下十年', 1000: '下千年', 10000: '下万年' }[step] || ('下' + step + '年');
  }
  function glyphOf(it) {
    if (!it) return '?';
    if (it.type === 'pill') return '丹';
    if (it.type === 'artifact') return '器';
    if (it.type === 'technique') return '诀';
    if (it.type === 'array') return '阵';
    return '材';
  }
  function itemStat(it) {
    if (!it) return '';
    const arr = [];
    if (it.power) arr.push('战力 +' + pct(it.power));
    if (it.cult) arr.push('修炼 +' + pct(it.cult));
    if (it.trib) arr.push('渡劫 +' + pct(it.trib));
    if (it.type === 'pill' && it.effect) {
      const e = it.effect;
      if (e.cult) arr.push('修为 +' + pct(e.cult) + '（当前小境）');
      if (e.lifespanPct) arr.push('寿元 +' + pct(e.lifespanPct));
      if (e.trib) arr.push('渡劫 +' + pct(e.trib));
      if (e.talent) arr.push('天赋 +' + e.talent);
      if (e.buff) arr.push('修炼 +' + pct(e.buff.cult) + '（' + e.buff.turns + '段）');
      if (e.cure) arr.push('解除：' + e.cure.map(function (x) { return QD.STATUS[x].name; }).join('/'));
    }
    if (it.type === 'array' && it.effect) {
      if (it.effect.cult) arr.push('闭关修为 +' + pct(it.effect.cult));
      if (it.effect.trib) arr.push('渡劫 +' + pct(it.effect.trib));
    }
    return arr.join(' · ');
  }
  function rarityOf(it) {
    if (!it) return '';
    if (it.quality) return it.quality;
    return ['凡品', '凡品', '灵品', '宝品', '仙品', '道品'][it.tier || 0] || '凡品';
  }
  function effectChips(list) {
    if (!list || !list.length) return '';
    return '<div class="effect-chips">' + list.map(function (x) { return '<span class="tag jade">' + h(x) + '</span>'; }).join('') + '</div>';
  }

  /* =========================================================
     初始化
     ========================================================= */
  UI.init = function () {
    E.loadMeta();
    this.bind();
    const saved = E.load();
    if (saved) {
      this.ensureState(saved);
      if (!saved.life.dead) {
        this.s = saved;
        this.showGame();
        return;
      }
    }
    this.showCreate();
  };

  UI.ensureState = function (s) {
    if (!s.settings) s.settings = { autoAdvance: true };
    if (s.settings.autoAdvance === undefined) s.settings.autoAdvance = true;
    if (!s.life.buffs) s.life.buffs = [];
    if (!s.life.features) s.life.features = { jing: 0, soul: 0, faxiang: 0 };
    if (!s.life.dongtian) s.life.dongtian = { unlocked: false, level: 0, field: 0, spring: 0, stele: 0 };
    if (!s.life.cave) s.life.cave = { level: 0 };
    if (!s.life.equip) s.life.equip = { artifact: null, technique: null };
    if (!s.life.sect) s.life.sect = { profession: null, profLevel: 1, pending: { stones: 0, contrib: 0, items: {}, turns: 0 } };
    if (!s.life.sect.pending) s.life.sect.pending = { stones: 0, contrib: 0, items: {}, turns: 0 };
    if (!s.life.recent) s.life.recent = { closed: 0, travel: 0, craft: 0, feature: 0, dongtian: 0 };
    if (!s.life.apMax) s.life.apMax = 6;
    if (!s.life.maxLifespan) s.life.maxLifespan = QD.REALMS[s.life.realm].life;
    if (!s.life.history) s.life.history = [];
    if (!s.life.statuses) s.life.statuses = [];
    if (s.life.xianjing === undefined) s.life.xianjing = 0;
  };

  UI.bind = function () {
    document.addEventListener('click', function (e) {
      const actEl = e.target.closest('[data-act]');
      if (actEl) {
        const fn = UI.ACTIONS[actEl.dataset.act];
        if (fn) { e.preventDefault(); fn(actEl, e); return; }
      }
      const gEl = e.target.closest('[data-gender]');
      if (gEl && !UI.s) {
        UI.creation.gender = gEl.dataset.gender;
        UI.renderCreate();
        return;
      }
      const oEl = e.target.closest('[data-origin]');
      if (oEl && !UI.s) {
        UI.creation.originId = oEl.dataset.origin;
        UI.renderCreate();
        return;
      }
    });
    window.addEventListener('beforeunload', function () { if (UI.s) E.save(UI.s); });
    const nameInput = $('#in-name');
    if (nameInput) {
      nameInput.addEventListener('input', function () {
        const btn = $('#btn-start');
        if (btn) btn.disabled = !nameInput.value.trim();
      });
      nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') UI.ACTIONS['start-game']();
      });
    }
    const reroll = $('#btn-reroll');
    if (reroll) reroll.addEventListener('click', function () {
      if (!UI.preview) return;
      UI.preview.root = QD.rollRoot();
      UI.renderCreate();
    });
    const start = $('#btn-start');
    if (start) start.addEventListener('click', function () { UI.ACTIONS['start-game'](); });
  };

  /* =========================================================
     入世界面
     ========================================================= */
  UI.showCreate = function () {
    $('#screen-create').classList.remove('hidden');
    $('#screen-game').classList.add('hidden');
    $('#overlay').classList.add('hidden');
    $('#modal').classList.add('hidden');
    this.modal = null;
    this.travelResult = null;
    if (!this.preview) this.preview = E.rollCharacter();
    $('#in-name').value = this.lastName || '沈青灯';
    this.renderCreate();
  };

  UI.renderCreate = function () {
    const p = this.preview;
    if (!p) { this.preview = E.rollCharacter(); return this.renderCreate(); }
    const origins = $('#origin-list');
    if (origins) {
      origins.innerHTML = QD.ORIGINS.map(function (o) {
        const on = UI.creation.originId === o.id ? ' on' : '';
        return '<button type="button" class="origin-card' + on + '" data-origin="' + o.id + '">' +
          '<b>' + h(o.name) + '</b><small>' + h(o.desc) + '</small><em>' + h(o.bonusText) + '</em></button>';
      }).join('');
    }
    const seg = $('#gender-seg');
    if (seg) {
      Array.prototype.forEach.call(seg.children, function (b) {
        b.classList.toggle('on', b.dataset.gender === UI.creation.gender);
      });
    }
    const capHint = p.deaths <= 0
      ? '灯芯尚弱，此世只够照至 <b>' + p.capName + '</b>。<br>灯灭一次，灯芯才会更亮。'
      : (p.deaths >= 3
        ? '灯芯炽烈，此世可照至 <b>' + p.capName + '</b>。'
        : '轮回灼痕已深，此世可照至 <b>' + p.capName + '</b>。');
    $('#fate-card').innerHTML =
      '<div class="fate-kicker">灯 芯 · 天 赋</div>' +
      '<div class="fate-talent"><b>' + p.talent + '</b><span>/ 100</span></div>' +
      '<div class="talent-bar"><i style="width:' + p.talent + '%"></i></div>' +
      '<div class="fate-root-name">' + p.root.elems.join('·') + ' ' + h(p.root.name) + '</div>' +
      '<div class="fate-root-desc">' + h(p.root.desc) + '</div>' +
      '<div class="elem-row">' + p.root.elems.map(function (el) { return '<span class="elem">' + h(el) + '</span>'; }).join('') + '</div>' +
      '<div class="fate-cap">' + capHint + '<br><span style="color:#6f6a5f">天赋决定修行快慢与渡劫成败，也决定此世的天花板。</span></div>';

    const meta = E.meta;
    const best = meta.bestRealm ? QD.REALMS[meta.bestRealm].name : '—';
    $('#meta-line').innerHTML = '灯灭 <b>' + meta.deaths + '</b> 次 · 轮回灼痕 <b>' + meta.deaths + '</b> 道 · 历史最高 <b>' + best + '</b>' +
      (meta.endings.indexOf('道祖') >= 0 ? ' · <span style="color:#c9a86a">道祖已成</span>' : '');

    const startBtn = $('#btn-start');
    if (startBtn) startBtn.disabled = !$('#in-name').value.trim();
  };

  UI.showGame = function () {
    $('#screen-create').classList.add('hidden');
    $('#screen-game').classList.remove('hidden');
    this.render();
  };

  /* =========================================================
     主界面渲染
     ========================================================= */
  UI.render = function () {
    if (!this.s) return;
    const L = this.s.life;
    $('#hud-year').textContent = fmt(this.s.world.year);
    $('#hud-life').textContent = lifeName(L.no) + (L.ghost ? ' · 鬼身' : '') + (L.restored ? ' · 前世归来' : '');
    this.renderLeft();
    this.renderMiddle();
    this.renderRight();
    this.renderDock();
  };

  UI.renderLeft = function () {
    const s = this.s, L = s.life, R = QD.REALMS[L.realm];
    const rank = QD.SECT_RANK(L.realm);
    const origin = QD.ORIGINS.find(function (o) { return o.id === L.origin; }) || QD.ORIGINS[0];
    const lifePct = L.realm >= 18 ? 1 : U.clamp(L.lifespan / Math.max(1, L.maxLifespan), 0, 1);
    const statusHTML = L.statuses.length
      ? L.statuses.map(function (st) {
        const d = QD.STATUS[st.id];
        return '<span class="status-chip" style="color:' + d.color + ';border-color:' + d.color + '66" title="' + h(d.desc) + '">' + h(d.icon) + ' ' + h(d.name) + (st.turns < 900 ? ' ' + st.turns + '段' : '') + '</span>';
      }).join('')
      : '<span class="status-empty">身无挂碍</span>';
    const buffs = (L.buffs || []).map(function (b) {
      return '<span class="status-chip" style="color:#6fa88a;border-color:#6fa88a66" title="修炼速度提升">悟 ' + h(b.name) + ' ' + b.turns + '段</span>';
    }).join('');

    const featHTML = Object.keys(QD.FEATURES).map(function (k) {
      const f = QD.FEATURES[k];
      const lv = L.features[k] || 0;
      const locked = L.realm < f.realm;
      const pips = Array.from({ length: f.max }, function (_, i) { return '<i class="' + (i < lv ? 'on' : '') + '"></i>'; }).join('');
      return '<div class="feature-row" data-act="open-panel" data-panel="features" style="cursor:pointer">' +
        '<span class="feature-ico ' + (locked ? 'locked' : '') + '">' + f.icon + '</span>' +
        '<span class="feature-main"><b>' + f.name + '</b><small>' + (locked ? '需' + QD.REALMS[f.realm].name : '第 ' + lv + ' / ' + f.max + ' 层') + '</small></span>' +
        '<span class="feature-lv">' + pips + '</span></div>';
    }).join('');

    const art = L.equip.artifact ? QD.ITEMS[L.equip.artifact] : null;
    const tech = L.equip.technique ? QD.ITEMS[L.equip.technique] : null;

    $('#panel-left').innerHTML =
      '<div class="card">' +
        '<div class="char-name">' + h(L.name) + '</div>' +
        '<div class="char-sub"><span class="tag gold">' + lifeName(L.no) + '</span><span class="tag">' + h(L.gender) + '</span><span class="tag jade">' + h(origin.name) + '</span>' + (L.ghost ? '<span class="tag violet">鬼修</span>' : '') + '</div>' +
        '<div class="char-meta">天赋 <b>' + L.talent + '</b> · 灵根 <b>' + h(L.root.elems.join('·') + L.root.name) + '</b><br>宗门 <b>' + h(L.ghost ? '青灯宗 · 鬼修弟子' : rank.name) + '</b> · 职业 <b>' + h(L.sect.profession ? QD.SECT.professions[L.sect.profession].name : '未择') + '</b></div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">寿 元 <small>' + (L.realm >= 18 ? '无尽' : fmt(L.lifespan) + ' 载') + '</small></div>' +
        '<div class="life-line">年岁 <b>' + fmt(L.age) + '</b></div>' +
        '<div class="life-line">寿元上限 <b>' + (L.realm >= 18 ? '无尽' : fmt(L.maxLifespan)) + '</b></div>' +
        '<div class="life-bar ' + (lifePct < 0.25 ? 'warn' : '') + '"><i style="width:' + (lifePct * 100).toFixed(1) + '%"></i></div>' +
        '<div class="char-meta" style="margin-top:8px">此境寿数：<b>' + (L.realm >= 18 ? '∞' : fmt(QD.REALMS[L.realm].life)) + '</b> 载 · 岁月以<b>' + stepText(QD.REALMS[L.realm].step) + '</b>为步</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">当 下 状 态</div>' +
        '<div class="status-chips" style="justify-content:flex-start">' + statusHTML + buffs + '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">法 器 与 功 法 <small><button type="button" class="btn tiny" data-act="open-panel" data-panel="inventory">更换</button></small></div>' +
        '<div class="equip-line"><span class="equip-icon">器</span><span class="equip-main"><b>' + h(art ? art.name : '赤手空拳') + '</b><small>' + (art ? itemStat(art) : '未用法器') + '</small></span></div>' +
        '<div class="equip-line"><span class="equip-icon">法</span><span class="equip-main"><b>' + h(tech ? tech.name : '未修功法') + '</b><small>' + (tech ? itemStat(tech) : '未修功法') + '</small></span></div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">境 界 神 通 <small>仙下每三境开一法</small></div>' +
        featHTML +
      '</div>' +
      '<button type="button" class="mini-link" data-act="open-panel" data-panel="path">境界之路 · 十九重天</button>';
  };

  UI.renderMiddle = function () {
    const s = this.s, L = s.life, R = QD.REALMS[L.realm];
    const d = E.derive(s);
    const need = E.need(s);
    const ratio = L.realm >= 18 ? 1 : U.clamp(L.cult / Math.max(1, need), 0, 1);
    const ringR = 104;
    const circ = 2 * Math.PI * ringR;
    const off = circ * (1 - ratio);
    const statusHTML = L.statuses.length
      ? L.statuses.map(function (st) {
        const sd = QD.STATUS[st.id];
        return '<span class="status-chip" style="color:' + sd.color + ';border-color:' + sd.color + '66" title="' + h(sd.desc) + '">' + h(sd.icon) + ' ' + h(sd.name) + '</span>';
      }).join('')
      : '<span class="status-empty">身无挂碍，气机通畅</span>';
    const art = L.equip.artifact ? QD.ITEMS[L.equip.artifact] : null;
    const tech = L.equip.technique ? QD.ITEMS[L.equip.technique] : null;
    const canTrib = E.canTrib(s);
    const step = QD.REALMS[L.realm].step;
    const steps = [1, 10, 1000, 10000];
    const stepLabels = { 1: '仙下前四境', 10: '仙下后五境 · 半仙', 1000: '仙上五境', 10000: '天人三境 · 道祖' };
    const advHTML = steps.map(function (st) {
      const on = step === st;
      return '<button type="button" class="adv-btn" data-act="advance" data-step="' + st + '" ' + (on ? '' : 'disabled') + '>' +
        '<b>' + stepShort(st) + '</b><small>' + stepLabels[st] + '</small></button>';
    }).join('');

    const apPips = Array.from({ length: L.apMax }, function (_, i) {
      return '<i class="' + (i < L.ap ? 'on' : '') + '"></i>';
    }).join('');

    const tribBanner = canTrib
      ? (function () {
        const pv = E.previewTrib(s, {
          pill: (L.items.p_dujie || 0) > 0,
          array: (L.items.arr_hushan || 0) > 0
        });
        const txt = pv.capped
          ? '仙门紧闭 · 此世天赋已至极限'
          : '可服渡厄丹、布护山阵 · 当前成功率约 ' + Math.round(pv.chance * 100) + '%';
        return '<div class="trib-banner"><div class="trib-txt">大圆满已至 · 天劫在望<small>' + txt + '</small></div><button type="button" class="btn gold" data-act="trib">渡 劫</button></div>';
      })()
      : '';

    $('#panel-middle').innerHTML =
      '<div class="realm-stage" style="--realm-glow:' + R.color + '33">' +
        '<div class="realm-ring">' +
          '<svg viewBox="0 0 240 240">' +
            '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="' + R.color + '"/><stop offset="100%" stop-color="#e8d3a2"/></linearGradient></defs>' +
            '<circle class="ring-track" cx="120" cy="120" r="' + ringR + '"/>' +
            '<circle class="ring-bg" cx="120" cy="120" r="114"/>' +
            '<circle class="ring-fg" cx="120" cy="120" r="' + ringR + '" stroke-dasharray="' + circ.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"/>' +
            '<line class="ring-tick" x1="120" y1="6" x2="120" y2="16"/><line class="ring-tick" x1="120" y1="224" x2="120" y2="234"/>' +
            '<line class="ring-tick" x1="6" y1="120" x2="16" y2="120"/><line class="ring-tick" x1="224" y1="120" x2="234" y2="120"/>' +
          '</svg>' +
          '<div class="ring-core">' +
            '<div class="realm-name">' + R.name + '</div>' +
            '<div class="realm-sub">' + (L.realm >= 18 ? '万道归灯' : QD.SUB[L.sub]) + '</div>' +
            '<div class="realm-pct">' + (L.realm >= 18 ? '道 祖' : Math.floor(ratio * 100) + '%') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="realm-theme"><em>「' + h(R.theme) + '」</em></div>' +
        '<div class="cult-line"><div class="cult-num"><span>当前修为</span><span><b>' + (L.realm >= 18 ? '无尽' : fmt(L.cult) + ' / ' + fmt(need)) + '</b></span></div>' +
          '<div class="cult-bar"><i style="width:' + (ratio * 100).toFixed(1) + '%"></i></div></div>' +
      '</div>' +
      '<div class="stat-grid">' +
        '<div class="stat-cell"><small>战 力</small><b>' + fmt(d.power) + '</b><i>气机外显</i></div>' +
        '<div class="stat-cell"><small>寿 元</small><b>' + (L.realm >= 18 ? '无尽' : fmt(L.lifespan)) + '</b><i>' + (L.realm >= 18 ? '与道同存' : '尚余 ' + fmt(L.lifespan) + ' 载') + '</i></div>' +
        '<div class="stat-cell"><small>行 动 点</small><b>' + L.ap + ' / ' + L.apMax + '</b><i>只用于闭关与游历</i></div>' +
      '</div>' +
      '<div class="equip-strip">' +
        '<div class="equip-box"><small>所用法器</small><b>' + h(art ? art.name : '无') + '</b><em>' + (art ? itemStat(art) : '赤手空拳') + '</em></div>' +
        '<div class="equip-box"><small>所修功法</small><b>' + h(tech ? tech.name : '无') + '</b><em>' + (tech ? itemStat(tech) : '未修功法') + '</em></div>' +
      '</div>' +
      '<div class="status-strip">' + statusHTML + '</div>' +
      '<div class="advance-area">' +
        '<div class="advance-head"><span>岁 月 流 转</span><small>行动点 <b style="color:#c9a86a">' + L.ap + '</b> · 手动推进保留行动点</small></div>' +
        '<div class="advance-btns">' + advHTML + '</div>' +
        tribBanner +
        '<div class="char-meta" style="text-align:center;margin-top:9px">当前以「' + stepText(step) + '」为一步 · 寿元耗尽则身死道消</div>' +
      '</div>';

    // AP 指示器缓存
    this._apPips = apPips;
  };

  UI.renderRight = function () {
    const s = this.s, L = s.life;
    const all = L.history || [];
    const hist = all.slice(-160);
    let lastLife = null;
    let html = '';
    if (!hist.length) {
      html = '<div class="bio-empty">生平尚无记载。<br>踏出第一步，岁月自会落笔。</div>';
    } else {
      for (let i = 0; i < hist.length; i++) {
        const entry = hist[i];
        if (entry.life !== lastLife) {
          lastLife = entry.life;
          html += '<div class="bio-life-mark">' + lifeName(entry.life) + ' · ' + h(L.name) + '</div>';
        }
        const isLast = i === hist.length - 1;
        const preview = (entry.paras && entry.paras[0]) ? entry.paras[0].slice(0, 30) : '';
        html += '<details class="bio-entry" ' + (isLast ? 'open' : '') + '>' +
          '<summary><div class="be-title"><b>' + h(entry.title) + '</b><small>' + fmt(entry.age) + '岁 · ' + h(entry.realm) + '</small></div>' +
          '<div class="be-preview">' + h(preview) + '…</div></summary>' +
          '<div class="be-body">' + (entry.paras || []).map(function (p) { return '<p>' + h(p) + '</p>'; }).join('') + '</div>' +
          '</details>';
      }
    }
    $('#panel-right').innerHTML =
      '<div class="bio-head"><h3>人 物 生 平</h3><small>' + all.length + ' 段 · ' + (L.no > 1 ? '两世同书' : '此世亲历') + '</small></div>' +
      '<div class="bio-scroll" id="bio-scroll">' + html + '</div>';

    const bio = $('#bio-scroll');
    if (bio) {
      const oldLen = this._bioLen;
      this._bioLen = all.length;
      if (all.length > oldLen) {
        requestAnimationFrame(function () { bio.scrollTop = bio.scrollHeight; });
      }
    }
  };

  UI.renderDock = function () {
    const s = this.s, L = s.life;
    const pending = L.sect.pending.turns || 0;
    const dtLocked = L.realm < 10;
    const items = [
      { id: 'inventory', icon: '戒', label: '储物戒', badge: '' },
      { id: 'closed', icon: '关', label: '闭关修炼', badge: L.ap > 0 ? String(L.ap) : '', soft: true },
      { id: 'sect', icon: '宗', label: '宗门', badge: pending ? String(pending) : '' },
      { id: 'travel', icon: '游', label: '世界游历', badge: L.travel ? '途' : '' },
      { id: 'dongtian', icon: '天', label: '体内洞天', locked: dtLocked }
    ];
    $('#dock').innerHTML = '<div class="dock-inner">' + items.map(function (it) {
      return '<button type="button" class="dock-btn ' + (it.locked ? 'locked' : '') + '" data-act="open-panel" data-panel="' + it.id + '">' +
        '<span class="di">' + (it.locked ? '锁' : it.icon) + '</span>' +
        '<span class="dl">' + it.label + '</span>' +
        (it.badge ? '<span class="dock-badge ' + (it.soft ? 'soft' : '') + '">' + it.badge + '</span>' : '') +
        '</button>';
    }).join('') + '</div>';
  };

  /* =========================================================
     弹窗
     ========================================================= */
  UI.openPanel = function (name, tab) {
    this.modal = name;
    this.tab = tab || this.defaultTab(name);
    this.travelResult = null;
    this.renderModal();
    $('#modal').classList.remove('hidden');
  };

  UI.defaultTab = function (name) {
    if (name === 'inventory') return 'pill';
    if (name === 'sect') return 'scripture';
    return null;
  };

  UI.closeModal = function () {
    $('#modal').classList.add('hidden');
    this.modal = null;
    this.travelResult = null;
  };

  UI.renderModal = function () {
    if (!this.modal || !this.s) return;
    const box = $('#modal-content');
    let html = '';
    switch (this.modal) {
      case 'inventory': html = this.viewInventory(); break;
      case 'closed': html = this.viewClosed(); break;
      case 'sect': html = this.viewSect(); break;
      case 'travel': html = this.viewTravel(); break;
      case 'dongtian': html = this.viewDongtian(); break;
      case 'features': html = this.viewFeatures(); break;
      case 'path': html = this.viewPath(); break;
      case 'bio': html = this.viewBio(); break;
      case 'menu': html = this.viewMenu(); break;
      default: html = '<div class="empty-box">此阁尚未开启。</div>';
    }
    box.innerHTML = html;
    box.scrollTop = 0;
  };

  UI.resChips = function (extra) {
    const L = this.s.life;
    return '<span class="res-chip">灵石 <b>' + fmt(L.stones) + '</b></span>' +
      '<span class="res-chip">贡献 <b>' + fmt(L.contrib) + '</b></span>' +
      (extra || '');
  };

  /* =========================================================
     视图：储物戒
     ========================================================= */
  UI.viewInventory = function () {
    const L = this.s.life;
    const tabs = [['pill', '丹药'], ['artifact', '法器'], ['technique', '功法'], ['material', '材料'], ['array', '阵盘']];
    const tab = this.tab || 'pill';
    const ids = Object.keys(L.items).filter(function (id) {
      const it = QD.ITEMS[id];
      return it && it.type === tab && (L.items[id] || 0) > 0;
    }).sort(function (a, b) { return (QD.ITEMS[a].tier || 0) - (QD.ITEMS[b].tier || 0); });
    const cards = ids.map(function (id) {
      const it = QD.ITEMS[id];
      const n = L.items[id];
      let action = '';
      if (it.type === 'artifact' || it.type === 'technique') {
        const equipped = (it.type === 'artifact' ? L.equip.artifact : L.equip.technique) === id;
        action = equipped
          ? '<span class="tag gold">已装备</span>'
          : '<button type="button" class="btn tiny" data-act="item-equip" data-id="' + id + '">装备</button>';
      } else if (it.type === 'pill') {
        action = id === 'p_dujie'
          ? '<span class="tag">渡劫时用</span>'
          : '<button type="button" class="btn tiny" data-act="item-use" data-id="' + id + '">服用</button>';
      } else if (it.type === 'array') {
        action = '<span class="tag">闭关时用</span>';
      } else {
        action = '<span class="tag">材料</span>';
      }
      return '<div class="item-card">' +
        '<span class="item-glyph">' + glyphOf(it) + '</span>' +
        '<span class="item-main"><b>' + h(it.name) + ' <em>×' + n + '</em></b>' +
        '<p>' + h(it.desc || '') + '</p>' +
        (itemStat(it) ? '<div class="item-stat">' + h(itemStat(it)) + '</div>' : '') +
        '</span><span class="item-side">' + action + '<span class="item-count">' + rarityOf(it) + '</span></span></div>';
    }).join('');
    return '<div class="panel-head"><div><h2>储 物 戒</h2><div class="ph-sub">一戒一世界。你所有的家当，都在这一念之间。</div></div>' +
      '<div class="res-row">' + this.resChips() + '</div></div>' +
      '<div class="tabs">' + tabs.map(function (t) {
        return '<button type="button" class="tab ' + (tab === t[0] ? 'on' : '') + '" data-act="tab" data-tab="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>' +
      (cards ? '<div class="item-grid">' + cards + '</div>' : '<div class="empty-box">这一格空空如也。<br>下山走走，或许能带些东西回来。</div>');
  };

  /* =========================================================
     视图：闭关修炼
     ========================================================= */
  UI.viewClosed = function () {
    const s = this.s, L = s.life;
    const d = E.derive(s);
    const need = E.need(s);
    const canTrib = E.canTrib(s);
    const cave = QD.CAVES[L.cave.level];
    const nextCave = QD.CAVES[L.cave.level + 1];
    const methods = [
      ['cave', '洞府闭关', '不耗外物，以洞府灵气温养。效果随洞府等级提升。'],
      ['stone', '灵石辅修', '以灵石布阵，灵气浓度倍增。'],
      ['pill', '丹药辅修', '服下修为丹，药力化作修为。'],
      ['array', '聚灵阵辅修', '激活阵盘，聚拢方圆十里灵气。']
    ];
    const methodHTML = methods.map(function (m) {
      const base = E.closedMethods[m[0]].base;
      const gain = Math.round(need * base * d.cultMul);
      let cost = '不耗外物';
      let ok = true;
      if (m[0] === 'stone') {
        const c = Math.round(20 * E.econ(s));
        cost = '灵石 ' + fmt(c);
        ok = L.stones >= c;
      } else if (m[0] === 'pill') {
        const have = ['p_juyuan', 'p_ninghua', 'p_yusui', 'p_xianling', 'p_lingye'].filter(function (id) { return (L.items[id] || 0) > 0; });
        cost = have.length ? QD.ITEMS[have[0]].name + ' ×1' : '无可用丹药';
        ok = have.length > 0;
      } else if (m[0] === 'array') {
        const have = ['arr_zhoutian', 'arr_juling'].filter(function (id) { return (L.items[id] || 0) > 0; });
        cost = have.length ? QD.ITEMS[have[0]].name + ' ×1' : '无可用阵盘';
        ok = have.length > 0;
      }
      const disabled = L.ap < 1 || (L.sub === 3 && L.cult >= need) || L.realm >= 18 || !ok;
      return '<div class="method-card">' +
        '<h4>' + m[1] + '</h4><p>' + m[2] + '</p>' +
        '<div class="m-foot"><small>' + cost + ' · 1 行动点</small><span class="gain">约 +' + fmt(gain) + '</span></div>' +
        '<button type="button" class="btn tiny" data-act="closed" data-method="' + m[0] + '" ' + (disabled ? 'disabled' : '') + '>闭 关</button>' +
        '</div>';
    }).join('');

    const featureHTML = Object.keys(QD.FEATURES).map(function (k) {
      const f = QD.FEATURES[k];
      const lv = L.features[k] || 0;
      const locked = L.realm < f.realm;
      const cost = f.cost(lv);
      const maxed = lv >= f.max;
      return '<div class="dt-card"><h4>' + f.name + '</h4>' +
        '<p>' + f.desc + '</p>' +
        '<div class="dt-stars">' + Array.from({ length: f.max }, function (_, i) { return '<i class="' + (i < lv ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
        '<button type="button" class="btn tiny" data-act="upgrade-feature" data-key="' + k + '" ' + (locked || maxed || L.stones < cost ? 'disabled' : '') + '>' +
        (locked ? '需' + QD.REALMS[f.realm].name : maxed ? '已圆满' : '淬炼 · ' + fmt(cost) + ' 灵石') + '</button></div>';
    }).join('');

    const tribOpts = this.tribOpts;
    const hasPill = (L.items.p_dujie || 0) > 0;
    const hasArray = (L.items.arr_hushan || 0) > 0;
    const pv = E.previewTrib(s, { pill: tribOpts.pill && hasPill, array: tribOpts.array && hasArray });
    const tribHTML = canTrib
      ? '<div class="trib-card"><h4>天 劫 将 至</h4>' +
        '<p>你已站在' + QD.REALMS[L.realm].name + '的尽头。再进一步，便是' + QD.REALMS[L.realm + 1].name + '。天雷无眼，渡不过便是身死道消。</p>' +
        '<div class="trib-row"><span class="trib-chance">' + (pv.chance * 100).toFixed(0) + '%<small> 成功率</small></span>' +
        '<button type="button" class="check ' + (hasPill ? '' : 'disabled') + '" data-act="toggle-trib" data-kind="pill">' + (tribOpts.pill && hasPill ? '☑' : '☐') + ' 渡厄丹 +25%</button>' +
        '<button type="button" class="check ' + (hasArray ? '' : 'disabled') + '" data-act="toggle-trib" data-kind="array">' + (tribOpts.array && hasArray ? '☑' : '☐') + ' 护山阵 +10%</button>' +
        '<button type="button" class="btn primary" data-act="trib">叩 仙 门</button></div>' +
        (pv.capped ? '<p style="color:#b87a72;margin-top:8px">仙门紧闭。你隐约觉得，以这一世的天赋，走到这里已是极限。或许，只有轮回能让你再进一步。</p>' : '') +
        '</div>'
      : '<div class="trib-card" style="opacity:.72"><h4>渡 劫</h4><p>修至大圆满，方可叩问下一境。当前：' +
        (L.realm >= 18 ? '已是道祖，再无可渡之劫。' : QD.SUB[L.sub] + ' · ' + Math.floor(U.clamp(L.cult / Math.max(1, need), 0, 1) * 100) + '%') + '</p></div>';

    return '<div class="panel-head"><div><h2>闭 关 修 炼</h2><div class="ph-sub">' + QD.REALMS[L.realm].name + ' · ' + (L.realm >= 18 ? '万道归灯' : QD.SUB[L.sub]) + ' · 行动点 ' + L.ap + ' / ' + L.apMax + '</div></div>' +
      '<div class="res-row">' + this.resChips() + '</div></div>' +
      '<div class="cave-banner"><div><h4>' + cave.name + ' · 洞府 Lv.' + (L.cave.level + 1) + '</h4><p>灵气浓度 ×' + cave.mult.toFixed(2) + ' · 全闭关方式共享洞府加成</p>' +
      '<div class="ap-pips">' + (this._apPips || '') + '</div></div>' +
      (nextCave ? '<button type="button" class="btn tiny" data-act="upgrade-cave" ' + (L.stones < nextCave.cost ? 'disabled' : '') + '>扩建 · ' + fmt(nextCave.cost) + ' 灵石</button>' : '<span class="tag gold">已至壶中天地</span>') +
      '</div>' +
      '<div class="cult-line" style="margin:0 0 12px"><div class="cult-num"><span>修为</span><span><b>' + (L.realm >= 18 ? '无尽' : fmt(L.cult) + ' / ' + fmt(need)) + '</b></span></div><div class="cult-bar"><i style="width:' + (L.realm >= 18 ? 100 : U.clamp(L.cult / Math.max(1, need), 0, 1) * 100) + '%"></i></div></div>' +
      '<div class="method-grid">' + methodHTML + '</div>' +
      '<div class="section-title">境 界 神 通 <small>仙下每三个大境界解锁一法</small></div>' +
      '<div class="dt-grid">' + featureHTML + '</div>' +
      tribHTML;
  };

  /* =========================================================
     视图：宗门
     ========================================================= */
  UI.viewSect = function () {
    const s = this.s, L = s.life;
    const rank = QD.SECT_RANK(L.realm);
    const pending = L.sect.pending;
    const prof = L.sect.profession ? QD.SECT.professions[L.sect.profession] : null;
    const tab = this.tab || 'scripture';
    const shop = QD.SHOPS[tab];
    const claimItems = Object.keys(pending.items || {}).map(function (id) {
      return QD.ITEMS[id] ? QD.ITEMS[id].name + '×' + pending.items[id] : '';
    }).filter(Boolean).join('、');

    const shopHTML = shop ? shop.items.map(function (en) {
      const it = QD.ITEMS[en.id];
      const locked = L.realm < en.minRealm;
      const poor = L.contrib < en.cost;
      return '<div class="shop-row ' + (locked ? 'locked' : '') + '">' +
        '<span class="item-glyph" style="width:26px;height:26px;flex:0 0 26px;font-size:12px">' + glyphOf(it) + '</span>' +
        '<span class="sr-main"><b>' + h(it.name) + '</b><small>' + h(it.desc || '') + (itemStat(it) ? ' · ' + h(itemStat(it)) : '') + '</small></span>' +
        '<span class="sr-cost ' + (poor ? 'no' : '') + '">' + en.cost + ' 贡献</span>' +
        '<button type="button" class="btn tiny" data-act="buy" data-shop="' + tab + '" data-id="' + en.id + '" ' + (locked || poor ? 'disabled' : '') + '>' + (locked ? '境界不足' : poor ? '贡献不足' : '兑 换') + '</button>' +
        '</div>';
    }).join('') : '';

    const profChoices = !prof
      ? Object.keys(QD.SECT.professions).map(function (id) {
        const p = QD.SECT.professions[id];
        return '<div class="recipe-card"><b>' + p.icon + ' ' + p.name + '</b><p>' + p.desc + '</p>' +
          '<button type="button" class="btn tiny" data-act="choose-prof" data-id="' + id + '" ' + (L.ghost ? 'disabled' : '') + '>择此道</button></div>';
      }).join('')
      : '';
    const recipes = prof ? QD.RECIPES.filter(function (r) { return r.job === L.sect.profession; }) : [];
    const recipeHTML = recipes.map(function (r) {
      const mats = Object.keys(r.mats).map(function (k) {
        const need = r.mats[k];
        const have = L.items[k] || 0;
        return '<span style="color:' + (have >= need ? '#6fa88a' : '#b87a72') + '">' + QD.ITEMS[k].name + ' ×' + need + '（有' + have + '）</span>';
      }).join(' · ');
      const can = L.realm >= r.minRealm && Object.keys(r.mats).every(function (k) { return (L.items[k] || 0) >= r.mats[k]; });
      return '<div class="recipe-card"><b>' + h(r.name) + '</b><p>' + mats + '</p>' +
        '<div class="rc-foot"><small>成功率 ' + pct(r.success) + ' · 贡献 +' + r.contrib + '</small>' +
        '<button type="button" class="btn tiny" data-act="craft" data-id="' + r.id + '" ' + (can ? '' : 'disabled') + '>开 炉</button></div></div>';
    }).join('');

    return '<div class="panel-head"><div><h2>青 灯 宗</h2><div class="ph-sub">' + QD.SECT.motto + '</div></div>' +
      '<div class="res-row">' + this.resChips() + '</div></div>' +
      '<div class="sect-rank"><span class="sect-seal">灯</span><div><b>' + h(L.ghost ? '鬼修弟子' : rank.name) + '</b><small>' + (L.ghost ? '鬼身不得领职司，只领基础物资' : (QD.isElder(L.realm) ? '长老供奉 ×' + rank.mult.toFixed(1) : '弟子物资 · 每段岁月自动累积')) + '</small></div></div>' +
      '<div class="sect-hero">' +
        '<div class="claim-card"><h4>弟子物资</h4><p>已积压 <b style="color:#c9a86a">' + pending.turns + '</b> 个阶段。若一直不开此阁，它们会一直堆到你死。' + (claimItems ? '<br>' + h(claimItems) : '') + '</p>' +
        '<div class="claim-num">' + pending.turns + '<small> 段</small></div>' +
        '<button type="button" class="btn tiny" data-act="claim-sect" ' + (pending.turns ? '' : 'disabled') + ' style="margin-top:8px">领取积压</button></div>' +
        '<div class="prof-card"><h4>宗门职司</h4>' +
        (L.ghost ? '<p>你已是鬼身。长老袍留在了坟里，宗门只认你胸口的灯。</p>' :
          prof ? '<p>' + prof.desc + '</p><p style="color:#c9a86a">' + prof.name + ' · 熟练 ' + (L.sect.profLevel || 1) + ' 阶</p>' :
            '<p>择一道而立身。炼丹、炼器、布阵，皆可换取贡献。</p>') +
        (profChoices ? '<div class="recipe-grid">' + profChoices + '</div>' : '') +
        '</div>' +
      '</div>' +
      (prof ? '<div class="section-title">职 司 艺 业 <small>开炉不耗行动点</small></div><div class="recipe-grid">' + (recipeHTML || '<div class="empty-box">尚无可用丹方。</div>') + '</div>' : '') +
      '<div class="section-title">宗 门 四 阁 <small>以贡献点兑换</small></div>' +
      '<div class="tabs">' + Object.keys(QD.SHOPS).map(function (k) {
        return '<button type="button" class="tab ' + (tab === k ? 'on' : '') + '" data-act="tab" data-tab="' + k + '">' + QD.SHOPS[k].name + '</button>';
      }).join('') + '</div>' +
      '<div class="char-meta" style="margin-bottom:6px;color:#7d786c">' + h(shop ? shop.desc : '') + '</div>' +
      '<div>' + shopHTML + '</div>';
  };

  /* =========================================================
     视图：世界游历
     ========================================================= */
  UI.viewTravel = function () {
    const s = this.s, L = s.life;
    if (this.travelResult) {
      const r = this.travelResult;
      const deathTag = r.death ? '<span class="tag red">' + (r.death.mode === 'final' ? '身死' : r.death.mode === 'ghost' ? '化鬼' : '转世') + '</span>' : '';
      const deathParas = (r.death && r.death.paras) ? r.death.paras.slice(1) : [];
      const resultParas = [r.text].concat(deathParas).map(function (p) { return '<p>' + h(p) + '</p>'; }).join('');
      return '<div class="panel-head"><div><h2>在 路 上</h2><div class="ph-sub">' + h(r.title || '山外') + ' · ' + (r.index || 0) + ' / ' + (r.total || 0) + '</div></div><div class="res-row">' + this.resChips() + '</div></div>' +
        '<div class="event-card"><div class="event-kicker">路 逢 其 事 ' + deathTag + '</div><h3>' + h(r.title || '') + '</h3>' +
        '<div class="travel-result">' + resultParas + effectChips(r.effects) + '</div></div>' +
        '<div style="margin-top:14px;text-align:right"><button type="button" class="btn primary" data-act="travel-next">' + (r.death ? '灯 灭' : r.done ? '整 理 行 囊' : '继 续 前 行') + '</button></div>';
    }

    if (L.travel) {
      const t = L.travel;
      const ev = E.travelEvent(s);
      if (!ev) return '<div class="empty-box">前路茫茫，不见一物。</div>';
      const prog = t.events.map(function (_, i) { return '<i class="' + (i < t.index ? 'on' : '') + '"></i>'; }).join('');
      return '<div class="panel-head"><div><h2>在 路 上</h2><div class="ph-sub">' + h(ev.title) + ' · 第 ' + (t.index + 1) + ' / ' + t.events.length + ' 桩</div></div>' +
        '<div class="res-row"><span class="res-chip">行动点 <b>' + L.ap + '</b></span><span class="travel-progress">' + prog + '</span></div></div>' +
        '<div class="event-card"><div class="event-kicker">世 界 游 历</div><h3>' + h(ev.title) + '</h3><p>' + h(ev.text) + '</p>' +
        '<div class="event-choices">' + ev.choices.map(function (c, i) {
          return '<button type="button" class="choice-btn" data-act="travel-choice" data-index="' + i + '"><span>' + h(c.label) + '</span><small>' + h(c.hint || '') + '</small></button>';
        }).join('') + '</div></div>';
    }

    const can = L.ap >= 1;
    return '<div class="panel-head"><div><h2>世 界 游 历</h2><div class="ph-sub">山外有山，人外有人。</div></div><div class="res-row">' + this.resChips() + '</div></div>' +
      '<div class="travel-intro"><div class="ti-mark">游</div><h3>此 去 山 外</h3>' +
      '<p>你将离开宗门，走一段没有走过的路。一路大约会遇上三到四桩事：或妖兽拦路，或道友相逢，或一脚踩进天大的机缘，也可能踩进天大的麻烦。</p>' +
      '<div class="travel-warn"><span class="tag">妖兽袭击</span><span class="tag">偶遇道友</span><span class="tag">路逢机缘</span><span class="tag red">也可能身死</span></div>' +
      '<button type="button" class="btn primary big" data-act="travel-start" ' + (can ? '' : 'disabled') + '>' + (can ? '下 山（1 行动点）' : '行动点不足') + '</button>' +
      '<p style="margin-top:12px;font-size:11px">当前战力 ' + fmt(E.derive(s).power) + ' · 境界 ' + QD.REALMS[L.realm].name + ' · 神魂护佑 ' + pct(E.derive(s).safe) + '</p></div>';
  };

  /* =========================================================
     视图：体内洞天
     ========================================================= */
  UI.viewDongtian = function () {
    const s = this.s, L = s.life;
    if (!L.dongtian.unlocked) {
      const hints = [
        { min: 0, text: '你偶尔会在梦里看见一片混沌，混沌中央有一扇没有把手的门。' },
        { min: 2, text: '烛照内景时，那扇门后传来潮声。你贴耳去听，潮声里有人在唤一个单字：灯。' },
        { min: 5, text: '神魂熔铸之后，你终于确认，那扇门就在你自己体内。' },
        { min: 8, text: '叩仙之后，你隐隐觉得，真正的洞天不在天上，而在体内。' }
      ].filter(function (x) { return L.realm >= x.min; });
      return '<div class="panel-head"><div><h2>体 内 洞 天</h2><div class="ph-sub">仙上第一境 · 洞明境，方可开天。</div></div></div>' +
        '<div class="dt-locked"><div class="dt-lock-mark">锁</div><h3>洞天未开</h3>' +
        '<p>洞天不是修出来的，是「照」出来的。心火照见内景，内景深处自有一片天地。只是你的灯还不够亮。</p>' +
        '<p style="color:#c9a86a">解锁境界：洞明境（仙上五境第一境）</p>' +
        '<div class="hint-list">' + hints.map(function (x, i) { return '<div class="hint-item"><i>其' + U.roman(i) + '</i><span>' + h(x.text) + '</span></div>'; }).join('') + '</div>' +
        '</div>';
    }
    const dt = L.dongtian;
    const lv = dt.level || 0;
    const cur = QD.DONGTIAN.levels[lv];
    const next = QD.DONGTIAN.levels[lv + 1];
    const bonus = '修炼 +' + (lv * 5) + '% · 战力 +' + (lv * 5) + '% · 渡劫 +' + (lv * 1) + '%';
    const partCard = function (key) {
      const cfg = QD.DONGTIAN[key];
      const l = dt[key] || 0;
      const cost = l < 8 ? cfg.costs[l + 1] : 0;
      const needLevel = l + 1;
      const canLevel = dt.level >= needLevel;
      let effect = '';
      if (key === 'field') effect = '每段产青元草 ×' + cfg.yield[l] + '、赤阳花 ×' + Math.ceil(cfg.yield[l] / 2);
      if (key === 'spring') effect = '每段产洞天灵液 ×' + cfg.yield[l];
      if (key === 'stele') effect = '战力 +' + pct(cfg.power[l] || 0) + ' · 渡劫 +' + pct(cfg.trib[l] || 0);
      return '<div class="dt-card"><h4>' + cfg.name + '</h4><p>' + cfg.desc + '</p>' +
        '<div class="dt-stars">' + Array.from({ length: 8 }, function (_, i) { return '<i class="' + (i < l ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
        '<div class="char-meta" style="margin:0 0 6px">' + effect + '</div>' +
        '<button type="button" class="btn tiny" data-act="dt-upgrade" data-part="' + key + '" ' + (l >= 8 || !canLevel || L.stones < cost ? 'disabled' : '') + '>' +
        (l >= 8 ? '已圆满' : !canLevel ? '需洞天 ' + needLevel + ' 阶' : '提升 · ' + fmt(cost) + ' 灵石') + '</button></div>';
    };
    return '<div class="panel-head"><div><h2>体 内 洞 天</h2><div class="ph-sub">一线天光自虚无漏下，自成一界。</div></div><div class="res-row">' + this.resChips() + '</div></div>' +
      '<div class="dt-hero"><h3>' + cur.name + ' · 洞天 ' + lv + ' 阶</h3><p>' + bonus + '<br>洞天越广，仙气自生越快；灵田与灵泉，则让你的修行不再只靠宗门。</p></div>' +
      '<div class="dt-grid">' +
        '<div class="dt-card"><h4>洞 天 扩 张</h4><p>开辟混沌，扩张洞天。提升整体仙气产出与战力。</p>' +
        '<div class="dt-stars">' + Array.from({ length: 9 }, function (_, i) { return '<i class="' + (i < lv ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
        '<button type="button" class="btn tiny" data-act="dt-upgrade" data-part="level" ' + (!next || L.stones < next.cost ? 'disabled' : '') + '>' +
        (next ? '扩张 · ' + fmt(next.cost) + ' 灵石' : '已至大千') + '</button></div>' +
        partCard('field') + partCard('spring') + partCard('stele') +
      '</div>';
  };

  /* =========================================================
     视图：神通
     ========================================================= */
  UI.viewFeatures = function () {
    const s = this.s, L = s.life;
    const cards = Object.keys(QD.FEATURES).map(function (k) {
      const f = QD.FEATURES[k];
      const lv = L.features[k] || 0;
      const locked = L.realm < f.realm;
      const cost = f.cost(lv);
      const maxed = lv >= f.max;
      return '<div class="dt-card"><h4>' + f.icon + ' ' + f.name + '</h4><p>' + f.desc + '</p>' +
        '<div class="dt-stars">' + Array.from({ length: f.max }, function (_, i) { return '<i class="' + (i < lv ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
        '<div class="char-meta" style="margin:0 0 8px">' + (locked ? '解锁境界：' + QD.REALMS[f.realm].name : '当前第 ' + lv + ' / ' + f.max + ' 层') + '</div>' +
        '<button type="button" class="btn tiny" data-act="upgrade-feature" data-key="' + k + '" ' + (locked || maxed || L.stones < cost ? 'disabled' : '') + '>' +
        (locked ? '尚未解锁' : maxed ? '已至圆满' : '淬炼 · ' + fmt(cost) + ' 灵石') + '</button></div>';
    }).join('');
    return '<div class="panel-head"><div><h2>境 界 神 通</h2><div class="ph-sub">仙下九境，每三个大境界开一法。</div></div><div class="res-row">' + this.resChips() + '</div></div>' +
      '<div class="dt-grid">' + cards + '</div>' +
      '<div class="char-meta" style="margin-top:16px;color:#7d786c">神通淬炼不消耗行动点，只消耗灵石。境界越高，能淬炼的层数越多。</div>';
  };

  /* =========================================================
     视图：境界之路
     ========================================================= */
  UI.viewPath = function () {
    const s = this.s, L = s.life;
    const groups = [
      { title: '仙 下 九 境', from: 0, to: 8 },
      { title: '半 仙 之 境', from: 9, to: 9 },
      { title: '仙 上 五 境', from: 10, to: 14 },
      { title: '天 人 三 境', from: 15, to: 17 },
      { title: '道 祖 之 境', from: 18, to: 18 }
    ];
    let html = '<div class="panel-head"><div><h2>境 界 之 路</h2><div class="ph-sub">十九重天，七十二小境，一步一劫。</div></div></div>';
    groups.forEach(function (grp) {
      html += '<div class="section-title">' + grp.title + '</div><div class="path-list">';
      for (let i = grp.from; i <= grp.to; i++) {
        const R = QD.REALMS[i];
        const cls = i === L.realm ? ' now' : (i < L.realm ? ' done' : '');
        html += '<div class="path-item' + cls + '"><span class="path-dot">' + (i + 1) + '</span><div class="path-main">' +
          '<b>' + R.name + '</b><small>「' + R.theme + '」' + (i >= 18 ? '' : ' · 寿元 ' + fmt(R.life) + ' 载 · 岁月以' + stepText(R.step) + '为步') + '</small>' +
          '<span class="path-unlock">' + R.unlock + '</span></div></div>';
      }
      html += '</div>';
    });
    return html;
  };

  /* =========================================================
     视图：生平全览
     ========================================================= */
  UI.viewBio = function () {
    const s = this.s, L = s.life;
    let last = null;
    let html = '';
    (L.history || []).forEach(function (entry) {
      if (entry.life !== last) {
        last = entry.life;
        html += '<div class="bio-life-mark">' + lifeName(entry.life) + '</div>';
      }
      html += '<div class="bio-entry" style="padding-top:10px"><div class="be-title"><b>' + h(entry.title) + '</b><small>' + fmt(entry.age) + '岁 · ' + h(entry.realm) + '</small></div>' +
        '<div class="be-body">' + (entry.paras || []).map(function (p) { return '<p>' + h(p) + '</p>'; }).join('') + '</div></div>';
    });
    return '<div class="panel-head"><div><h2>人 物 生 平</h2><div class="ph-sub">' + (L.no > 1 ? '两世同书，字字皆你。' : '此世亲历，尚未完卷。') + '</div></div></div>' +
      (html || '<div class="empty-box">尚无记载。</div>');
  };

  /* =========================================================
     视图：菜单
     ========================================================= */
  UI.viewMenu = function () {
    const s = this.s;
    const meta = E.meta;
    return '<div class="panel-head"><div><h2>青 灯 小 筑</h2><div class="ph-sub">' + (s.settings.autoAdvance ? '行动点耗尽时，岁月会自动流转。' : '行动点耗尽后，将由你亲手翻开下一页。') + '</div></div></div>' +
      '<div class="sect-rank"><span class="sect-seal">灯</span><div><b>轮回灼痕 × ' + meta.deaths + '</b><small>灯灭次数越多，下世天赋越高。历史最高：' + (meta.bestRealm ? QD.REALMS[meta.bestRealm].name : '—') + '</small></div></div>' +
      '<div class="sect-hero">' +
        '<div class="claim-card"><h4>自动推进</h4><p>行动点用尽后，自动进入下一段岁月。关闭后，需手动点击「下一年」。</p>' +
        '<button type="button" class="btn tiny" data-act="toggle-auto">' + (s.settings.autoAdvance ? '已开启 · 点击关闭' : '已关闭 · 点击开启') + '</button></div>' +
        '<div class="claim-card"><h4>存档</h4><p>游戏在每次行动后自动存档。关闭页面亦不会丢失（同一浏览器）。</p>' +
        '<button type="button" class="btn tiny" data-act="save-now">立即存档</button></div>' +
      '</div>' +
      '<div class="section-title">游 戏 要 略</div>' +
      '<div class="char-meta" style="line-height:2">' +
        '· 行动点只用于「闭关修炼」与「世界游历」。其余行为不耗行动点。<br>' +
        '· 修至大圆满后，须渡劫方可破境。渡劫有身死之险，渡厄丹可大幅提高成功率。<br>' +
        '· 每次大境界突破会增寿并清空所有负面状态。<br>' +
        '· 宗门物资按阶段累积，忘记领取会一直堆着，直到领取或死亡。<br>' +
        '· 仙下每三个大境界解锁一门神通；体内洞天须待仙上第一境「洞明境」。<br>' +
        '· 修为 ≥ 第五境身死，有两成机会化鬼；≥ 第七境身死，有一成机会转世重修。<br>' +
        '· 天赋决定此世能走多远。灯灭之后，下世天赋必然更高。' +
      '</div>' +
      '<div class="section-title">一 些 选 择</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="btn tiny" data-act="open-panel" data-panel="path">境界之路</button>' +
        '<button type="button" class="btn tiny" data-act="open-panel" data-panel="bio">生平全览</button>' +
        '<button type="button" class="btn tiny danger" data-act="restart-run">重开此世</button>' +
        '<button type="button" class="btn tiny danger" data-act="reset-meta">抹去轮回</button>' +
      '</div>';
  };

  /* =========================================================
     动作
     ========================================================= */
  UI.ACTIONS = {};

  UI.ACTIONS['open-panel'] = function (el) {
    if (UI.s && UI.s.life.dead && el.dataset.panel !== 'bio') return;
    UI.openPanel(el.dataset.panel);
  };

  UI.ACTIONS['close-modal'] = function () { UI.closeModal(); };

  UI.ACTIONS['tab'] = function (el) {
    UI.tab = el.dataset.tab;
    UI.renderModal();
  };

  UI.ACTIONS['open-menu'] = function () { UI.openPanel('menu'); };

  UI.ACTIONS['toggle-auto'] = function () {
    UI.s.settings.autoAdvance = !UI.s.settings.autoAdvance;
    E.save(UI.s);
    UI.renderModal();
    UI.toast(UI.s.settings.autoAdvance ? '行动点耗尽后，岁月将自动流转。' : '已改为手动推进，行动点用尽后不会自动翻页。', 'gold');
  };

  UI.ACTIONS['save-now'] = function () {
    E.save(UI.s);
    UI.toast('已存档。', 'good');
  };

  UI.ACTIONS['start-game'] = function () {
    if (UI._busy) return;
    const name = ($('#in-name').value || '').trim();
    if (!name) { UI.toast('请先取一个道号。', 'bad'); return; }
    if (name.length > 8) { UI.toast('道号最多八字。', 'bad'); return; }
    UI._busy = true;
    const p = UI.preview || E.rollCharacter();
    const s = E.startLife({
      name: name,
      gender: UI.creation.gender,
      originId: UI.creation.originId,
      talent: p.talent,
      root: p.root
    });
    UI.s = s;
    UI.lastName = name;
    UI._bioLen = 0;
    UI._lastRealm = 0;
    const intro = QD.Narr.beat(s, 0);
    if (intro) E.record(s, '入世', intro);
    UI.showGame();
    UI.playStory('入世', intro || ['你睁开眼，看见了这个世界。'], { eyebrow: '柳溪村 · 十六岁' }).then(function () {
      UI._busy = false;
      UI.render();
    });
  };

  UI.ACTIONS['advance'] = function () { UI.doAdvance(false); };

  UI.ACTIONS['trib'] = function () { UI.doTrib(); };

  UI.ACTIONS['closed'] = function (el) {
    const m = el.dataset.method;
    const r = E.closedDoor(UI.s, m);
    if (!r.ok) { UI.toast(r.msg, 'bad'); return; }
    UI.render();
    UI.renderModal();
    if (r.ups && r.ups.length) {
      UI.toast(r.ups[r.ups.length - 1], 'gold');
    } else {
      UI.toast(r.msg, 'good');
    }
    UI.afterAction();
  };

  UI.ACTIONS['upgrade-cave'] = function () {
    const r = E.upgradeCave(UI.s);
    UI.toast(r.msg, r.ok ? 'good' : 'bad');
    if (r.ok) { UI.render(); UI.renderModal(); }
  };

  UI.ACTIONS['upgrade-feature'] = function (el) {
    const r = E.upgradeFeature(UI.s, el.dataset.key);
    UI.toast(r.msg, r.ok ? 'good' : 'bad');
    if (r.ok) { UI.render(); UI.renderModal(); }
  };

  UI.ACTIONS['dt-upgrade'] = function (el) {
    const r = E.upgradeDongtian(UI.s, el.dataset.part);
    UI.toast(r.msg, r.ok ? 'good' : 'bad');
    if (r.ok) { UI.render(); UI.renderModal(); }
  };

  UI.ACTIONS['toggle-trib'] = function (el) {
    const k = el.dataset.kind;
    UI.tribOpts[k] = !UI.tribOpts[k];
    UI.renderModal();
  };

  UI.ACTIONS['claim-sect'] = function () {
    const r = E.claimSect(UI.s);
    if (!r.ok) { UI.toast(r.msg, 'bad'); return; }
    const parts = ['灵石 +' + fmt(r.stones), '贡献 +' + r.contrib];
    if (Object.keys(r.items).length) parts.push(Object.keys(r.items).map(function (id) { return QD.ITEMS[id].name + '×' + r.items[id]; }).join('、'));
    UI.toast('领取了 ' + r.turns + ' 个阶段的物资：' + parts.join('，'), 'gold');
    UI.render();
    UI.renderModal();
  };

  UI.ACTIONS['choose-prof'] = function (el) {
    const r = E.chooseProfession(UI.s, el.dataset.id);
    UI.toast(r.msg, r.ok ? 'gold' : 'bad');
    if (r.ok) { UI.render(); UI.renderModal(); }
  };

  UI.ACTIONS['craft'] = function (el) {
    const r = E.craft(UI.s, el.dataset.id);
    UI.toast(r.msg, r.ok ? 'good' : 'bad');
    UI.render();
    UI.renderModal();
  };

  UI.ACTIONS['buy'] = function (el) {
    const r = E.buy(UI.s, el.dataset.shop, el.dataset.id);
    UI.toast(r.msg, r.ok ? 'good' : 'bad');
    if (r.ok) { UI.render(); UI.renderModal(); }
  };

  UI.ACTIONS['item-use'] = function (el) {
    const r = E.useItem(UI.s, el.dataset.id);
    UI.toast(r.msg, r.ok ? 'good' : 'bad');
    if (r.ok) { UI.render(); UI.renderModal(); }
  };

  UI.ACTIONS['item-equip'] = function (el) {
    const r = E.equip(UI.s, el.dataset.id);
    UI.toast(r.msg, r.ok ? 'good' : 'bad');
    if (r.ok) { UI.render(); UI.renderModal(); }
  };

  UI.ACTIONS['travel-start'] = function () {
    const r = E.startTravel(UI.s);
    if (!r.ok) { UI.toast(r.msg, 'bad'); return; }
    UI.renderModal();
    UI.render();
  };

  UI.ACTIONS['travel-choice'] = function (el) {
    const r = E.travelChoose(UI.s, parseInt(el.dataset.index, 10));
    if (!r.ok) { UI.toast(r.msg, 'bad'); return; }
    UI.travelResult = r;
    UI.renderModal();
    UI.render();
  };

  UI.ACTIONS['travel-next'] = function () {
    const r = UI.travelResult;
    UI.travelResult = null;
    if (r && r.death) {
      UI.closeModal();
      UI.handleDeath(r.death);
      return;
    }
    if (UI.s.life.travel) {
      UI.renderModal();
      UI.render();
      return;
    }
    UI.closeModal();
    UI.render();
    UI.toast('你回到了宗门。行囊里多了些东西，身上也许添了几道疤。', 'gold');
    UI.afterAction();
  };

  UI.ACTIONS['next-life'] = function () {
    $('#overlay').classList.add('hidden');
    E.clearSave();
    UI.s = null;
    UI.preview = E.rollCharacter();
    UI.creation.originId = 'liehu';
    UI._bioLen = 0;
    UI.showCreate();
  };

  UI.ACTIONS['continue-after-death'] = function () {
    $('#overlay').classList.add('hidden');
    UI.tribOpts = { pill: false, array: false };
    UI.render();
  };

  UI.ACTIONS['close-ending'] = function () {
    $('#overlay').classList.add('hidden');
    UI.render();
    UI.toast('你已是道祖。岁月于你，再无意义。', 'gold');
  };

  UI.ACTIONS['restart-run'] = function () {
    if (!window.confirm('重开此世？当前这一世的生平与修为都会消失，轮回灼痕保留。')) return;
    E.clearSave();
    UI.s = null;
    UI.preview = E.rollCharacter();
    UI.showCreate();
  };

  UI.ACTIONS['reset-meta'] = function () {
    if (!window.confirm('抹去所有轮回记录？灯灭次数、天赋提升与道祖结局都会清空。')) return;
    E.resetMeta();
    E.clearSave();
    UI.s = null;
    UI.preview = E.rollCharacter();
    UI.showCreate();
    UI.toast('轮回已抹去。灯芯重新变得微弱。', 'bad');
  };

  /* =========================================================
     推进与渡劫
     ========================================================= */
  UI.doAdvance = function (auto) {
    if (!this.s || this._busy || this.s.life.dead) return;
    if (this.s.life.travel) {
      if (!auto) this.toast('你还在路上。先走完这一程，再翻下一页岁月。', 'bad');
      return;
    }
    this._busy = true;
    this.closeModal();
    const res = E.advance(this.s);
    this._lastRealm = this.s.life.realm;
    this.render();
    const title = '第' + this.s.world.turn + '段 · ' + QD.Narr.periodWord(res.years);
    const eyebrow = res.death ? '灯 灭' : '岁 月 有 痕';
    this.playStory(title, res.paras, { eyebrow: eyebrow }).then(function () {
      UI._busy = false;
      UI.render();
      if (res.death) {
        UI.handleDeath(res.death);
      } else if (!auto) {
        UI.toast('岁月流转 ' + fmt(res.years) + ' 年。', '');
      }
      if (UI.s && UI.s.life.ended && !res.death) {
        // 结局在渡劫时已弹出，此处不重复
      }
    });
  };

  UI.doTrib = function () {
    if (!this.s || this._busy) return;
    if (!E.canTrib(this.s)) { this.toast('尚未至大圆满。', 'bad'); return; }
    const L = this.s.life;
    const pv = E.previewTrib(this.s, {
      pill: this.tribOpts.pill && (L.items.p_dujie || 0) > 0,
      array: this.tribOpts.array && (L.items.arr_hushan || 0) > 0
    });
    if (pv.capped) {
      if (!window.confirm('仙门紧闭。以你此世的天赋，强行渡劫几无生还可能。仍要一试？')) return;
    }
    this._busy = true;
    this.closeModal();
    const res = E.tribulation(this.s, {
      pill: this.tribOpts.pill && (L.items.p_dujie || 0) > 0,
      array: this.tribOpts.array && (L.items.arr_hushan || 0) > 0
    });
    this.tribOpts = { pill: false, array: false };
    this.render();
    this.playStory('天 劫', res.paras, { eyebrow: '渡 劫' }).then(function () {
      UI._busy = false;
      UI.render();
      if (res.death) {
        UI.handleDeath(res.death);
        return;
      }
      UI.toast('渡劫' + (res.ok ? '功成，境界已破。' : '未成，道基受损。') + '（成功率 ' + Math.round(res.chance * 100) + '%）', res.ok ? 'gold' : 'bad');
      if (res.ending) UI.showEnding();
    });
  };

  UI.afterAction = function () {
    this.render();
    const s = this.s;
    if (!s || s.life.dead) return;
    if (s.life.ap <= 0 && s.settings.autoAdvance && !s.life.travel) {
      this.toast('行动点已耗尽，岁月自行流转……', 'gold');
      const self = this;
      clearTimeout(this._autoTimer);
      this._autoTimer = setTimeout(function () {
        if (!self._busy && self.s && !self.s.life.dead && self.s.life.ap <= 0 && !self.s.life.travel) {
          self.doAdvance(true);
        }
      }, 900);
    }
  };

  /* =========================================================
     死亡 / 结局 / 浮层
     ========================================================= */
  UI.handleDeath = function (info) {
    const s = this.s;
    if (!s) return;
    this.render();
    if (info.mode === 'final') {
      this.showFatal(info);
    } else {
      this.showTransition(info);
    }
  };

  UI.showFatal = function (info) {
    const s = this.s, L = s.life;
    const meta = E.meta;
    const causeText = {
      lifespan: '寿元耗尽，油尽灯枯。',
      status: '旧疾缠身，药石无医。',
      tribulation: '天雷之下，道基尽碎。',
      travel: '山高路远，客死他乡。',
      curse: '天谴加身，魂飞魄散。'
    }[info.cause] || '身死道消。';
    const idx = Math.min(meta.deaths, QD.TALENT.ranges.length - 1);
    const range = QD.TALENT.ranges[idx];
    const cap = QD.talentCapName(meta.deaths);
    const next = '<div class="fatal-msg">灯灭一次，灯芯便亮一分。<br>轮回灼痕 <b>× ' + meta.deaths + '</b> · 下世天赋 <b>' + range[0] + ' – ' + range[1] + '</b><br>下世可照至 <b>' + cap + '</b></div>';
    const box = $('#overlay-box');
    box.className = 'overlay-box fatal';
    box.innerHTML =
      '<div class="story-eyebrow">灯 灭</div>' +
      '<div class="fatal-title">身死道消</div>' +
      '<div class="fatal-sub">' + causeText + '</div>' +
      '<div class="fatal-stats">' +
        '<div><small>道号</small><b>' + h(L.name) + '</b></div>' +
        '<div><small>境界</small><b>' + QD.REALMS[info.realmAtDeath].name + '</b></div>' +
        '<div><small>享年</small><b>' + fmt(L.age) + '</b></div>' +
        '<div><small>世数</small><b>' + lifeName(L.no) + '</b></div>' +
        '<div><small>生平</small><b>' + (L.history || []).length + ' 段</b></div>' +
        '<div><small>灼痕</small><b>× ' + meta.deaths + '</b></div>' +
      '</div>' + next +
      '<div class="fatal-msg" style="color:#7d786c">' + (meta.deaths >= 4 ? '灯芯已近炽烈。下一次，或许就是道祖。' : '再入轮回，从头来过。这一次，灯会更亮。') + '</div>' +
      '<button type="button" class="btn primary big" data-act="next-life">再 入 轮 回</button>';
    $('#overlay').classList.remove('hidden');
    this._storyActive = false;
    this._busy = false;
  };

  UI.showTransition = function (info) {
    const s = this.s, L = s.life;
    const isGhost = info.mode === 'ghost';
    const box = $('#overlay-box');
    box.className = 'overlay-box';
    box.innerHTML =
      '<div class="story-eyebrow">灯 未 灭</div>' +
      '<div class="story-title">' + (isGhost ? '鬼 身 续 命' : '转 世 重 修') + '</div>' +
      '<div class="fatal-msg">' +
      (isGhost
        ? '你从坟里爬了出来。<br>境界跌落一重，如今是 <b>' + QD.REALMS[L.realm].name + '·' + QD.SUB[L.sub] + '</b>。<br>宗门职司已失，只余基础物资；寿元却比生前长了两倍有余：<b>' + fmt(L.lifespan) + '</b> 载。'
        : '你回到了十六岁。<br>前世修为封存在灯芯深处，待你重入 <b>烛照境</b>，便会尽数归来。<br>这一世，你的天赋是 <b>' + L.talent + '</b>。') +
      '</div>' +
      '<div class="fatal-msg" style="color:#7d786c">' + (isGhost ? '鬼修不得再择职业。宗门仍认你胸口的灯。' : '灯芯未灭，故事未完。') + '</div>' +
      '<button type="button" class="btn primary big" data-act="continue-after-death">继 续 前 行</button>';
    $('#overlay').classList.remove('hidden');
    this._storyActive = false;
    this._busy = false;
  };

  UI.showEnding = function () {
    if (!this.s) return;
    const s = this.s, L = s.life;
    const end = E.ending(s);
    const box = $('#overlay-box');
    box.className = 'overlay-box ending-box';
    box.innerHTML =
      '<div class="story-eyebrow">道 祖</div>' +
      '<div class="ending-title">灯 照 万 古</div>' +
      '<div class="ending-sub">万 道 归 灯 · 逍 遥 世 间</div>' +
      '<div class="fatal-stats">' +
        '<div><small>道号</small><b>' + h(L.name) + '</b></div>' +
        '<div><small>终境</small><b>道祖境</b></div>' +
        '<div><small>世数</small><b>' + lifeName(L.no) + '</b></div>' +
        '<div><small>享年</small><b>' + fmt(L.age) + '</b></div>' +
        '<div><small>生平</small><b>' + (L.history || []).length + ' 段</b></div>' +
        '<div><small>灼痕</small><b>× ' + E.meta.deaths + '</b></div>' +
      '</div>' +
      '<div class="fatal-msg">从此世间再无你到不了的远方，再无你留不住的人。<br>你坐在灯下，等一个提灯的人回来。</div>' +
      '<button type="button" class="btn primary big" data-act="close-ending">继 续 逍 遥</button>';
    $('#overlay').classList.remove('hidden');
    this._storyActive = false;
    this._busy = false;
  };

  /* =========================================================
     叙事播放
     ========================================================= */
  UI.playStory = function (title, paras, opts) {
    opts = opts || {};
    const self = this;
    return new Promise(function (resolve) {
      const overlay = $('#overlay');
      const box = $('#overlay-box');
      if (!box) { resolve(); return; }
      box.className = 'overlay-box';
      box.innerHTML =
        '<div class="story-eyebrow">' + h(opts.eyebrow || '岁 月 有 痕') + '</div>' +
        '<div class="story-title">' + h(title) + '</div>' +
        '<div class="story-body" id="story-body"></div>' +
        '<div class="story-foot"><span class="story-hint" id="story-hint">点击任意处继续</span>' +
        '<button type="button" class="btn primary" id="story-done" disabled>收 入 生 平</button></div>';
      const body = box.querySelector('#story-body');
      const btn = box.querySelector('#story-done');
      const hint = box.querySelector('#story-hint');
      const list = (paras || []).filter(function (p) { return p; });
      if (!list.length) list.push('岁月无声，悄然流过。');
      const els = list.map(function (p) {
        const el = document.createElement('p');
        el.textContent = p;
        body.appendChild(el);
        return el;
      });
      let i = 0, closed = false;
      const finishReveal = function () {
        clearInterval(timer);
        els.forEach(function (el) { el.classList.add('show'); });
        if (btn) btn.disabled = false;
        if (hint) hint.textContent = '此后种种，皆入生平';
      };
      const next = function () {
        if (i >= els.length) { finishReveal(); return; }
        els[i].classList.add('show');
        i++;
        if (i >= els.length) finishReveal();
      };
      let timer = setInterval(next, 560);
      next();
      const close = function () {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        overlay.classList.add('hidden');
        self._storyActive = false;
        resolve();
      };
      btn.onclick = function (e) { e.stopPropagation(); close(); };
      box.onclick = function (e) {
        if (e.target === btn) return;
        if (i < els.length) next();
      };
      overlay.classList.remove('hidden');
      self._storyActive = true;
    });
  };

  /* =========================================================
     Toast
     ========================================================= */
  UI.toast = function (msg, type) {
    const box = $('#toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 380);
    }, 3200);
  };
})(window);
