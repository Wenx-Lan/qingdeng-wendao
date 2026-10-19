/* 青灯问道 · 数据层 */
(function (g) {
  'use strict';
  const QD = g.QD = g.QD || {};

  QD.SUB = ['前期', '中期', '后期', '大圆满'];
  QD.SUB_MULT = [1, 1.4, 1.9, 2.5];

  /* ========== 境界表 ==========
     仙下九境 0-8，半仙境 9，仙上五境 10-14，天人三境 15-17，道祖境 18
     每个大境界四小境；道祖境无小境。
  */
  QD.REALMS = [
    {
      name: '微尘境', nick: '微尘', life: 60, step: 1, need: 100, color: '#9aa3ad',
      theme: '凡身如尘，引气入体',
      desc: '凡人之躯，第一次将天地灵气纳入经脉。尘微之光，亦可照夜。',
      unlock: '吐纳：可吸纳灵气，踏上修行之路。'
    },
    {
      name: '萤火境', nick: '萤火', life: 80, step: 1, need: 160, color: '#c9b46a',
      theme: '丹田凝火，昼夜不熄',
      desc: '丹田之中凝出一点萤火，微弱却执拗。可辟谷，可夜视，凡俗病痛再难近身。',
      unlock: '辟谷：不食五谷，寒暑不侵。'
    },
    {
      name: '烛照境', nick: '烛照', life: 110, step: 1, need: 260, color: '#d98f4e',
      theme: '心火照内，洞见经脉',
      desc: '心火如烛，照亮自身内景。经脉、脏腑、气血运行，纤毫毕现，修行自此有的放矢。',
      unlock: '内景：心火照见体内，玄妙之门初显。'
    },
    {
      name: '薪火境', nick: '薪火', life: 150, step: 1, need: 420, color: '#c96a3f',
      theme: '以身为薪，道火自燃',
      desc: '以身为薪，道火不熄。气血浑厚如炉，断骨可续，寿元大增，凡刀兵难伤。',
      unlock: '气血烘炉：肉身自成熔炉，恢复力大增。'
    },
    {
      name: '燎原境', nick: '燎原', life: 220, step: 10, need: 700, color: '#b8452f',
      theme: '气焰燎原，真气化海',
      desc: '真气漫过四肢百骸，如野火过原。气海初成，可御物短距飞行，一跃十丈。',
      unlock: '气海：真气化海，御物凌空。'
    },
    {
      name: '熔炉境', nick: '熔炉', life: 280, step: 10, need: 1150, color: '#8c5bb3',
      theme: '道火熔魂，神魂初铸',
      desc: '神魂入炉，重铸神识。从此神识外放，可查百步。宗门授长老衔。',
      unlock: '神魂：神识外放，可探幽冥。'
    },
    {
      name: '凌虚境', nick: '凌虚', life: 350, step: 10, need: 1900, color: '#5f8fd6',
      theme: '踏虚而行，神游百里',
      desc: '脚下无阶，只有风。可踏虚而行，神游百里，一念之间越过千山。',
      unlock: '凌虚：踏空而行，日行千里。'
    },
    {
      name: '载道境', nick: '载道', life: 430, step: 10, need: 3100, color: '#4fa89a',
      theme: '身载道纹，法随身动',
      desc: '一缕道纹落在肩头，很轻，却让举手投足暗合天理。言出有信，法随身动。',
      unlock: '道纹：身载一缕大道，术法威能大增。'
    },
    {
      name: '叩仙境', nick: '叩仙', life: 520, step: 10, need: 5000, color: '#c9a227',
      theme: '劫火炼身，叩问仙门',
      desc: '仙门在望，劫火临身。渡过者半步登仙，渡不过者身死道消。',
      unlock: '法相：道火外显，可凝法相临世。'
    },
    {
      name: '半仙境', nick: '半仙', life: 700, step: 10, need: 8200, color: '#d8c9a3',
      theme: '仙凡之隔，半步登仙',
      desc: '半只脚已踏入仙途，另半只还留在人间。仙门在望，九死一生。',
      unlock: '仙气：一缕仙气入体，凡俗术法再难伤身。'
    },
    {
      name: '洞明境', nick: '洞明', life: 13000, step: 1000, need: 14000, color: '#7fc8c0',
      theme: '体内洞天，一线天光',
      desc: '体内洞天初开，一线天光自虚无漏下。仙气自生，寿元以万年计。',
      unlock: '体内洞天：开天辟地，自成一界。'
    },
    {
      name: '流照境', nick: '流照', life: 16000, step: 1000, need: 24000, color: '#8fb8e8',
      theme: '仙光流照，映照诸天',
      desc: '仙光自洞天深处流出，照见山河万里，也照见心底旧影。',
      unlock: '流照：仙光所至，千里可见。'
    },
    {
      name: '无垢境', nick: '无垢', life: 20000, step: 1000, need: 42000, color: '#d9e2ea',
      theme: '仙躯无垢，万法不侵',
      desc: '尘垢落尽，仙躯通透。万法加身如风过疏竹，神通自显。',
      unlock: '无垢：仙躯洁净，诸邪不侵。'
    },
    {
      name: '执天境', nick: '执天', life: 25000, step: 1000, need: 75000, color: '#b04a4a',
      theme: '执掌天条，敕令诸天',
      desc: '天条在握，字字如铁。开口时，连风都学会停顿。',
      unlock: '执天：执掌一域天条，言出法随。'
    },
    {
      name: '逍遥境', nick: '逍遥', life: 32000, step: 1000, need: 130000, color: '#e0b25c',
      theme: '逍遥天地，不朽不灭',
      desc: '天地忽然变得很小，小到可以放进袖中。笑一声，云便散了。',
      unlock: '逍遥：天地之大，来去由心。'
    },
    {
      name: '同天境', nick: '同天', life: 130000, step: 10000, need: 240000, color: '#7fb08a',
      theme: '与天同寿，天人合一',
      desc: '与天同坐，共看一场下了十万年的雨。天人合一，借天地之力为己用。',
      unlock: '同天：寿与天齐，念动天应。'
    },
    {
      name: '造界境', nick: '造界', life: 170000, step: 10000, need: 450000, color: '#b989c9',
      theme: '一念造界，造化由心',
      desc: '掌心一粒尘里，有山，有河，有一盏刚刚点亮的灯。',
      unlock: '造界：一念生界，万物由心。'
    },
    {
      name: '无始境', nick: '无始', life: 220000, step: 10000, need: 850000, color: '#8a8fd6',
      theme: '无始无终，超脱光阴',
      desc: '想起很久以前，也想起很久以后。原来它们之间，只隔着一盏灯。',
      unlock: '无始：超脱光阴，过去未来皆在一念。'
    },
    {
      name: '道祖境', nick: '道祖', life: 999999999, step: 10000, need: 0, color: '#f0d98c',
      theme: '万道归灯，灯照万古',
      desc: '万道之源，唯一之境。灯即是道，道即是灯。',
      unlock: '道祖：万道归灯，逍遥万古。'
    }
  ];

  QD.TIER = function (realm) { return Math.min(3, Math.floor(realm / 3)); };
  QD.needFor = function (realm, sub) {
    return Math.round(QD.REALMS[realm].need * QD.SUB_MULT[sub]);
  };
  QD.stepOf = function (realm) { return QD.REALMS[realm].step; };
  QD.realmLabel = function (realm, sub) {
    return QD.REALMS[realm].name + (realm >= 18 ? '' : '·' + QD.SUB[sub]);
  };

  /* ========== 天赋与轮回 ========== */
  QD.TALENT = {
    ranges: [[28, 48], [56, 72], [74, 86], [88, 96], [97, 100]],
    caps: [9, 14, 17, 18],
    capNames: ['半仙境', '逍遥境', '无始境', '道祖境']
  };

  QD.rollTalent = function (deaths) {
    const i = Math.min(deaths, QD.TALENT.ranges.length - 1);
    const [a, b] = QD.TALENT.ranges[i];
    return QD.U.randInt(a, b);
  };
  QD.talentCap = function (deaths) {
    return QD.TALENT.caps[Math.min(deaths, QD.TALENT.caps.length - 1)];
  };
  QD.talentCapName = function (deaths) {
    return QD.TALENT.capNames[Math.min(deaths, QD.TALENT.capNames.length - 1)];
  };

  /* ========== 灵根 ========== */
  QD.ELEMENTS = ['金', '木', '水', '火', '土'];
  QD.ROOTS = [
    { id: 'tian', name: '天灵根', mult: 0.45, weight: 4, elemMax: 1, desc: '万中无一。灵气亲之如子，修行一日千里。' },
    { id: 'bianyi', name: '变异灵根', mult: 0.34, weight: 8, elemMax: 1, desc: '雷、冰、风之属，锋芒难驯，亦正亦邪。' },
    { id: 'shuang', name: '双灵根', mult: 0.22, weight: 28, elemMax: 2, desc: '两行相济，中正平和，稳步可期。' },
    { id: 'san', name: '三灵根', mult: 0.10, weight: 38, elemMax: 3, desc: '驳杂而稳，是凡尘修士最常见的根骨。' },
    { id: 'wei', name: '伪灵根', mult: 0.00, weight: 22, elemMax: 2, desc: '毫光微弱，几近于无。唯有大毅力者可破局。' }
  ];
  QD.rollRoot = function () {
    const r = QD.U.weighted(QD.ROOTS);
    const elems = QD.U.pickN(QD.ELEMENTS, r.elemMax);
    return { id: r.id, name: r.name, mult: r.mult, desc: r.desc, elems: elems.sort() };
  };

  /* ========== 出身 ========== */
  QD.ORIGINS = [
    {
      id: 'liehu', name: '山村猎户', desc: '生于山野，与虎狼争食。筋骨强健，胆气过人。',
      bonus: { power: 0.08, stones: 0, items: { a_chai: 1 } }, bonusText: '战力 +8% · 家传柴刀'
    },
    {
      id: 'shuxiang', name: '没落书香', desc: '家道中落，唯余一屋旧书与半盏冷茶。心静，悟性高。',
      bonus: { cult: 0.08, stones: 20, items: { p_juyuan: 1 } }, bonusText: '修炼 +8% · 聚元丹 ×1'
    },
    {
      id: 'shanggu', name: '市井商户', desc: '自小在秤杆与铜钱间长大，最懂人情世故，也最懂灵石的好处。',
      bonus: { stones: 180, items: { p_juyuan: 1 } }, bonusText: '灵石 +180 · 聚元丹 ×1'
    },
    {
      id: 'yaonong', name: '药农之家', desc: '识得百草，闻得药香。虽无仙缘，却有一双辨药的眼。',
      bonus: { stones: 30, items: { m_qingyuan: 4, p_huichun: 1 } }, bonusText: '青元草 ×4 · 回春丹 ×1'
    }
  ];

  /* ========== 丹药 ========== */
  QD.PILLS = {
    p_juyuan: { name: '聚元丹', type: 'pill', tier: 1, quality: '凡品', desc: '青元草炼成的入门丹药，入口化作一缕暖流。', effect: { cult: 0.35 } },
    p_ninghua: { name: '凝华丹', type: 'pill', tier: 2, quality: '灵品', desc: '灵气凝华，药力沉稳，可省却数日苦修。', effect: { cult: 0.5 } },
    p_yusui: { name: '玉髓丹', type: 'pill', tier: 3, quality: '宝品', desc: '玉髓为引，丹香如兰，唯筑基以上方可承受。', effect: { cult: 0.7 } },
    p_xianling: { name: '仙灵丹', type: 'pill', tier: 4, quality: '仙品', desc: '仙气凝成的丹丸，凡躯服之如饮烈酒。', effect: { cult: 0.9 } },
    p_yanshou: { name: '延寿丹', type: 'pill', tier: 2, quality: '灵品', desc: '续命之丹。可增寿元上限的两成。', effect: { lifespanPct: 0.2 } },
    p_qiannian: { name: '千年寿丹', type: 'pill', tier: 3, quality: '宝品', desc: '一炉丹药，千年光阴。增寿三成五。', effect: { lifespanPct: 0.35 } },
    p_wannian: { name: '万年寿丹', type: 'pill', tier: 4, quality: '仙品', desc: '仙界蟠桃入药，增寿五成。凡人服之，立成枯骨。', effect: { lifespanPct: 0.5 } },
    p_dujie: { name: '渡厄丹', type: 'pill', tier: 3, quality: '宝品', desc: '渡劫之时含于舌下，可挡三分天威。渡劫成功率 +25%。', effect: { trib: 0.25 } },
    p_jiedu: { name: '解毒丹', type: 'pill', tier: 1, quality: '凡品', desc: '百毒可解，唯独解不了人心。', effect: { cure: ['poison'] } },
    p_huichun: { name: '回春丹', type: 'pill', tier: 1, quality: '凡品', desc: '骨断可续，肉腐可生。解除轻伤与重伤。', effect: { cure: ['wound', 'heavy'] } },
    p_qingxin: { name: '清心丹', type: 'pill', tier: 2, quality: '灵品', desc: '心魔起时含服，如冷水浇头。', effect: { cure: ['heart'] } },
    p_pozhang: { name: '破障丹', type: 'pill', tier: 3, quality: '宝品', desc: '专治渡劫留下的道伤。道基有裂者慎服。', effect: { cure: ['dao'] } },
    p_wudao: { name: '悟道丹', type: 'pill', tier: 3, quality: '宝品', desc: '服后灵台空明，三次推进之内修炼速度 +35%。', effect: { buff: { id: 'wudao', name: '悟道', turns: 3, cult: 0.35 } } },
    p_xisui: { name: '洗髓丹', type: 'pill', tier: 4, quality: '仙品', desc: '洗经伐髓，逆改根骨。天赋永久 +1。', effect: { talent: 1 } },
    p_lingye: { name: '洞天灵液', type: 'pill', tier: 4, quality: '仙品', desc: '洞天灵泉凝成的一滴，胜过人间百年。', effect: { cult: 0.25 } }
  };

  /* ========== 法器 ========== */
  QD.ARTIFACTS = {
    a_chai: { name: '柴刀', type: 'artifact', tier: 0, power: 0.03, desc: '凡铁打造，刃口卷了。可它陪你走出山村。' },
    a_qingfeng: { name: '青锋剑', type: 'artifact', tier: 1, power: 0.08, desc: '青云宗制式长剑，胜在轻快。' },
    a_lingwen: { name: '灵纹法衣', type: 'artifact', tier: 1, power: 0.06, desc: '灵蚕丝织就，暗刻三道护身灵纹。' },
    a_juling: { name: '聚灵珠', type: 'artifact', tier: 1, power: 0.04, cult: 0.08, desc: '珠内自成小聚灵阵，修炼时事半功倍。' },
    a_xuantie: { name: '玄铁重剑', type: 'artifact', tier: 1, power: 0.12, desc: '重逾百斤，无锋无刃，胜在一个重字。' },
    a_zhenhun: { name: '镇魂铃', type: 'artifact', tier: 2, power: 0.10, trib: 0.05, desc: '铃音可安魂定魄，渡劫时尤为有用。' },
    a_xingdou: { name: '星斗幡', type: 'artifact', tier: 2, power: 0.18, cult: 0.06, desc: '幡上绣北斗，夜半引星辉。' },
    a_taixu: { name: '太虚镜', type: 'artifact', tier: 3, power: 0.25, trib: 0.06, desc: '镜中映出的，往往不是照镜之人。' },
    a_shanhe: { name: '山河印', type: 'artifact', tier: 3, power: 0.30, desc: '一方古印，压得住山河，也压得住气运。' },
    a_zhanxian: { name: '斩仙剑', type: 'artifact', tier: 4, power: 0.45, trib: 0.05, desc: '剑名斩仙，剑下却从未斩过仙。' },
    a_hundun: { name: '混沌钟', type: 'artifact', tier: 5, power: 0.60, trib: 0.08, desc: '钟声一响，万法皆寂。' },
    a_zhoutian: { name: '周天星斗盘', type: 'artifact', tier: 5, power: 0.80, cult: 0.10, desc: '三百六十五颗星子，尽在盘中。' }
  };

  /* ========== 功法 ========== */
  QD.TECHNIQUES = {
    t_qingdeng: { name: '青灯引气诀', type: 'technique', tier: 0, cult: 0.10, power: 0.02, desc: '青灯宗入门心法。灯不明，心不静，气不聚。' },
    t_wuxing: { name: '五行纳元经', type: 'technique', tier: 1, cult: 0.18, power: 0.04, desc: '五行相生，纳元归海。中正平和，最宜打基础。' },
    t_taiyin: { name: '太阴炼神篇', type: 'technique', tier: 1, cult: 0.15, power: 0.07, trib: 0.02, desc: '月华为引，炼神而不炼形，神魂较常人凝实。' },
    t_jiuyao: { name: '九曜焚天诀', type: 'technique', tier: 2, cult: 0.26, power: 0.10, desc: '九曜齐燃，焚尽前路。修行极快，亦极易走火。' },
    t_dongming: { name: '洞明经', type: 'technique', tier: 2, cult: 0.34, power: 0.14, trib: 0.03, desc: '洞明洞明，照见本心。仙上五境的第一部正法。' },
    t_liuzhao: { name: '流照真解', type: 'technique', tier: 3, cult: 0.44, power: 0.18, desc: '仙光流照，无处不达。' },
    t_wugou: { name: '无垢道章', type: 'technique', tier: 3, cult: 0.50, power: 0.22, trib: 0.05, desc: '无垢者，不染因果。' },
    t_zhitian: { name: '执天律', type: 'technique', tier: 4, cult: 0.62, power: 0.30, trib: 0.08, desc: '以身为律，以律为天。修此功者，多不得善终。' },
    t_wushi: { name: '无始经', type: 'technique', tier: 5, cult: 0.80, power: 0.45, trib: 0.10, desc: '无始无终，无我无灯。' }
  };

  /* ========== 材料 ========== */
  QD.MATERIALS = {
    m_qingyuan: { name: '青元草', type: 'material', tier: 1, desc: '山野常见灵草，聚元丹的主药。' },
    m_chiyang: { name: '赤阳花', type: 'material', tier: 1, desc: '向阳而生，花色如血，性烈。' },
    m_xuanbing: { name: '玄冰莲', type: 'material', tier: 2, desc: '生于千年寒潭，花瓣触之成霜。' },
    m_jiuling: { name: '九叶灵芝', type: 'material', tier: 3, desc: '九叶一花，百年一开，续命良药。' },
    m_xuantie: { name: '玄铁矿', type: 'material', tier: 1, desc: '沉甸甸的黑石，可炼兵刃。' },
    m_hanjing: { name: '寒晶', type: 'material', tier: 2, desc: '寒气凝成的晶石，炼器可固灵纹。' },
    m_xingsha: { name: '星砂', type: 'material', tier: 3, desc: '陨星落地后剩下的砂，夜里会发光。' },
    m_taichu: { name: '太初石', type: 'material', tier: 4, desc: '开天辟地时留下的一缕旧物。' },
    m_zhenwen: { name: '阵纹玉', type: 'material', tier: 1, desc: '可刻阵纹的软玉，阵法师的命根子。' },
    m_lingcan: { name: '灵蚕丝', type: 'material', tier: 2, desc: '灵蚕吐的丝，轻若无物，韧过精钢。' },
    m_tiangang: { name: '天罡木', type: 'material', tier: 3, desc: '雷击不死之木，天生带罡气。' },
    m_neidan: { name: '妖兽内丹', type: 'material', tier: 2, desc: '妖兽一身精华所凝，腥气扑鼻。' },
    m_yujian: { name: '残破玉简', type: 'material', tier: 1, desc: '不知哪一脉前辈留下的残简，或藏机缘。' }
  };

  /* ========== 阵盘 ========== */
  QD.ARRAYS = {
    arr_juling: { name: '聚灵阵盘', type: 'array', tier: 1, desc: '刻好阵纹的玉盘，闭关时激活可聚拢灵气。', effect: { cult: 0.30 } },
    arr_zhoutian: { name: '周天聚灵阵', type: 'array', tier: 2, desc: '三十六道阵纹连环，灵气如潮。', effect: { cult: 0.45 } },
    arr_hushan: { name: '护山阵盘', type: 'array', tier: 2, desc: '渡劫时激活，可挡一道天雷。成功率 +10%。', effect: { trib: 0.10 } }
  };

  /* ========== 物品索引 ========== */
  QD.ITEMS = {};
  ['PILLS', 'ARTIFACTS', 'TECHNIQUES', 'MATERIALS', 'ARRAYS'].forEach(function (k) {
    const src = QD[k];
    Object.keys(src).forEach(function (id) {
      src[id].id = id;
      src[id].kind = k.toLowerCase();
      QD.ITEMS[id] = src[id];
    });
  });
  QD.item = function (id) { return QD.ITEMS[id]; };

  /* ========== 洞府 ========== */
  QD.CAVES = [
    { name: '青石洞府', mult: 1.00, cost: 0 },
    { name: '引泉洞府', mult: 1.15, cost: 300 },
    { name: '聚灵洞府', mult: 1.30, cost: 1200 },
    { name: '地脉洞府', mult: 1.50, cost: 5000 },
    { name: '小洞天', mult: 1.70, cost: 20000 },
    { name: '洞天福地', mult: 1.95, cost: 80000 },
    { name: '紫府洞天', mult: 2.20, cost: 300000 },
    { name: '仙家洞府', mult: 2.50, cost: 1200000 },
    { name: '壶中天地', mult: 2.90, cost: 5000000 }
  ];

  /* ========== 境界神通（仙下每三个大境界解锁一个） ========== */
  QD.FEATURES = {
    jing: {
      name: '内景淬体', realm: 2, icon: '景', max: 9,
      desc: '心火照见内景，以气血淬炼脏腑肉身。每层战力 +4%，渡劫成功率 +2%。',
      cost: function (lv) { return Math.round(120 * Math.pow(1.85, lv)); },
      power: 0.04, trib: 0.02
    },
    soul: {
      name: '神魂熔铸', realm: 5, icon: '魂', max: 9,
      desc: '以道火熔铸神魂。每层修炼速度 +5%，游历遇险概率 -4%，渡劫成功率 +1%。',
      cost: function (lv) { return Math.round(220 * Math.pow(1.9, lv)); },
      cult: 0.05, trib: 0.01, safe: 0.04
    },
    faxiang: {
      name: '法相显化', realm: 8, icon: '相', max: 9,
      desc: '道火外显，凝成法相临世。每层战力 +7%，渡劫成功率 +3%。',
      cost: function (lv) { return Math.round(600 * Math.pow(2.0, lv)); },
      power: 0.07, trib: 0.03
    }
  };

  /* ========== 宗门 ========== */
  QD.SECT = {
    name: '青灯宗',
    motto: '灯不明，心不静，气不聚。',
    ranks: [
      { min: 0, name: '外门弟子', mult: 1.0 },
      { min: 5, name: '执事长老', mult: 1.7 },
      { min: 7, name: '首座长老', mult: 2.3 },
      { min: 9, name: '太上长老', mult: 3.2 },
      { min: 12, name: '副掌教', mult: 4.5 },
      { min: 15, name: '太上掌教', mult: 6.5 }
    ],
    professions: {
      alchemy: { name: '炼丹师', icon: '丹', desc: '以灵草入炉，炼百药成丹。可炼制修为丹、疗伤丹、渡厄丹与寿丹。' },
      forge: { name: '炼器师', icon: '器', desc: '以矿石为骨，灵纹为魂。可锻造法器，亦可修补残兵。' },
      array: { name: '阵法师', icon: '阵', desc: '以玉为纸，以灵为墨。可刻聚灵阵盘、护山阵，亦可参悟天地大势。' }
    }
  };

  QD.SECT_RANK = function (realm) {
    let idx = 0;
    for (let i = 0; i < QD.SECT.ranks.length; i++) {
      if (realm >= QD.SECT.ranks[i].min) idx = i;
    }
    return { index: idx, name: QD.SECT.ranks[idx].name, mult: QD.SECT.ranks[idx].mult };
  };
  QD.isElder = function (realm) { return realm >= 5; };

  /* ========== 宗门商铺 ========== */
  QD.SHOPS = {
    scripture: {
      name: '藏经阁', icon: '经',
      desc: '青灯宗七百年藏书，灯下可借阅。以贡献点换取功法。',
      items: [
        { id: 't_wuxing', cost: 40, minRealm: 2 },
        { id: 't_taiyin', cost: 55, minRealm: 3 },
        { id: 't_jiuyao', cost: 110, minRealm: 5 },
        { id: 't_dongming', cost: 160, minRealm: 7 },
        { id: 't_liuzhao', cost: 260, minRealm: 10 },
        { id: 't_wugou', cost: 340, minRealm: 12 },
        { id: 't_zhitian', cost: 520, minRealm: 13 },
        { id: 't_wushi', cost: 800, minRealm: 15 }
      ]
    },
    alchemy: {
      name: '丹房', icon: '丹',
      desc: '丹炉终日不熄。丹药与灵草，皆可以贡献点换取。',
      items: [
        { id: 'p_juyuan', cost: 8, minRealm: 0 },
        { id: 'p_jiedu', cost: 10, minRealm: 0 },
        { id: 'p_huichun', cost: 12, minRealm: 0 },
        { id: 'p_ninghua', cost: 18, minRealm: 3 },
        { id: 'p_qingxin', cost: 18, minRealm: 3 },
        { id: 'p_pozhang', cost: 30, minRealm: 5 },
        { id: 'p_wudao', cost: 35, minRealm: 5 },
        { id: 'p_yanshou', cost: 40, minRealm: 4 },
        { id: 'p_yusui', cost: 45, minRealm: 6 },
        { id: 'p_dujie', cost: 60, minRealm: 4 },
        { id: 'p_qiannian', cost: 120, minRealm: 9 },
        { id: 'p_xianling', cost: 150, minRealm: 10 },
        { id: 'p_wannian', cost: 400, minRealm: 12 },
        { id: 'p_xisui', cost: 500, minRealm: 14 },
        { id: 'm_qingyuan', cost: 4, minRealm: 0 },
        { id: 'm_chiyang', cost: 6, minRealm: 0 },
        { id: 'm_xuanbing', cost: 20, minRealm: 5 },
        { id: 'm_jiuling', cost: 60, minRealm: 8 }
      ]
    },
    artifact: {
      name: '器阁', icon: '器',
      desc: '刀剑有灵，择主而鸣。以贡献点换取法器与矿石。',
      items: [
        { id: 'a_qingfeng', cost: 20, minRealm: 1 },
        { id: 'a_lingwen', cost: 25, minRealm: 1 },
        { id: 'a_juling', cost: 30, minRealm: 2 },
        { id: 'a_xuantie', cost: 40, minRealm: 3 },
        { id: 'a_zhenhun', cost: 45, minRealm: 4 },
        { id: 'a_xingdou', cost: 90, minRealm: 7 },
        { id: 'a_taixu', cost: 160, minRealm: 10 },
        { id: 'a_shanhe', cost: 200, minRealm: 11 },
        { id: 'a_zhanxian', cost: 320, minRealm: 13 },
        { id: 'a_hundun', cost: 500, minRealm: 15 },
        { id: 'a_zhoutian', cost: 700, minRealm: 16 },
        { id: 'm_xuantie', cost: 5, minRealm: 0 },
        { id: 'm_hanjing', cost: 25, minRealm: 5 },
        { id: 'm_xingsha', cost: 80, minRealm: 9 },
        { id: 'm_taichu', cost: 300, minRealm: 14 }
      ]
    },
    array: {
      name: '阵宫', icon: '阵',
      desc: '石壁上刻满阵纹，看久了会头晕。阵盘与阵材在此换取。',
      items: [
        { id: 'arr_juling', cost: 15, minRealm: 0 },
        { id: 'arr_zhoutian', cost: 45, minRealm: 6 },
        { id: 'arr_hushan', cost: 50, minRealm: 7 },
        { id: 'm_zhenwen', cost: 8, minRealm: 0 },
        { id: 'm_lingcan', cost: 12, minRealm: 2 },
        { id: 'm_tiangang', cost: 70, minRealm: 8 }
      ]
    }
  };

  /* ========== 职业配方 ========== */
  QD.RECIPES = [
    { id: 'rc_juyuan', job: 'alchemy', name: '聚元丹', out: 'p_juyuan', mats: { m_qingyuan: 2 }, success: 0.85, contrib: 2, minRealm: 0 },
    { id: 'rc_huichun', job: 'alchemy', name: '回春丹', out: 'p_huichun', mats: { m_qingyuan: 3 }, success: 0.80, contrib: 3, minRealm: 0 },
    { id: 'rc_jiedu', job: 'alchemy', name: '解毒丹', out: 'p_jiedu', mats: { m_qingyuan: 2, m_chiyang: 1 }, success: 0.78, contrib: 3, minRealm: 1 },
    { id: 'rc_ninghua', job: 'alchemy', name: '凝华丹', out: 'p_ninghua', mats: { m_qingyuan: 3, m_chiyang: 2 }, success: 0.68, contrib: 5, minRealm: 2 },
    { id: 'rc_yanshou', job: 'alchemy', name: '延寿丹', out: 'p_yanshou', mats: { m_jiuling: 1, m_chiyang: 2 }, success: 0.60, contrib: 10, minRealm: 4 },
    { id: 'rc_yusui', job: 'alchemy', name: '玉髓丹', out: 'p_yusui', mats: { m_xuanbing: 2, m_jiuling: 1 }, success: 0.55, contrib: 14, minRealm: 5 },
    { id: 'rc_dujie', job: 'alchemy', name: '渡厄丹', out: 'p_dujie', mats: { m_jiuling: 2, m_xuanbing: 1 }, success: 0.50, contrib: 20, minRealm: 5 },

    { id: 'rc_qingfeng', job: 'forge', name: '青锋剑', out: 'a_qingfeng', mats: { m_xuantie: 3 }, success: 0.82, contrib: 3, minRealm: 0 },
    { id: 'rc_lingwen', job: 'forge', name: '灵纹法衣', out: 'a_lingwen', mats: { m_lingcan: 3, m_zhenwen: 1 }, success: 0.72, contrib: 6, minRealm: 2 },
    { id: 'rc_xuantie', job: 'forge', name: '玄铁重剑', out: 'a_xuantie', mats: { m_xuantie: 5, m_hanjing: 1 }, success: 0.65, contrib: 8, minRealm: 3 },
    { id: 'rc_zhenhun', job: 'forge', name: '镇魂铃', out: 'a_zhenhun', mats: { m_hanjing: 2, m_xuantie: 4, m_neidan: 1 }, success: 0.55, contrib: 15, minRealm: 4 },
    { id: 'rc_xingdou', job: 'forge', name: '星斗幡', out: 'a_xingdou', mats: { m_xingsha: 2, m_lingcan: 3 }, success: 0.50, contrib: 18, minRealm: 6 },

    { id: 'rc_juling', job: 'array', name: '聚灵阵盘', out: 'arr_juling', mats: { m_zhenwen: 2 }, success: 0.85, contrib: 2, minRealm: 0 },
    { id: 'rc_zhoutian', job: 'array', name: '周天聚灵阵', out: 'arr_zhoutian', mats: { m_zhenwen: 3, m_tiangang: 1 }, success: 0.65, contrib: 10, minRealm: 5 },
    { id: 'rc_hushan', job: 'array', name: '护山阵盘', out: 'arr_hushan', mats: { m_tiangang: 2, m_xingsha: 1 }, success: 0.50, contrib: 25, minRealm: 8 }
  ];

  /* ========== 状态 ========== */
  QD.STATUS = {
    wound: { name: '轻伤', icon: '伤', color: '#c98a5a', desc: '战力 -8%，修炼 -10%。', power: -0.08, cult: -0.10, turns: 3 },
    heavy: { name: '重伤', icon: '重', color: '#b04a4a', desc: '战力 -25%，修炼 -25%，每阶段流失寿元。', power: -0.25, cult: -0.25, drain: 0.008, turns: 5 },
    poison: { name: '中毒', icon: '毒', color: '#7fa05a', desc: '战力 -15%，每阶段流失寿元，可能毒发身亡。', power: -0.15, cult: -0.15, drain: 0.015, lethal: 0.06, turns: 6 },
    heart: { name: '心魔', icon: '魔', color: '#8c5bb3', desc: '修炼 -20%，每阶段有几率走火入魔。', cult: -0.20, lethal: 0.05, turns: 6 },
    dao: { name: '道伤', icon: '道', color: '#c9a227', desc: '修炼 -30%，渡劫 -15%，寿元流失。', cult: -0.30, trib: -0.15, drain: 0.012, lethal: 0.02, turns: 8 },
    curse: { name: '天谴', icon: '谴', color: '#b04a4a', desc: '战力 -25%，修炼 -35%，每阶段可能身死。', power: -0.25, cult: -0.35, lethal: 0.08, turns: 5 },
    ghost: { name: '鬼身', icon: '鬼', color: '#6f8fa8', desc: '阴气缠身：寿元绵长，宗门只发基础物资，渡劫成功率略降。', permanent: true }
  };

  /* ========== 体内洞天 ========== */
  QD.DONGTIAN = {
    levels: [
      { name: '混沌', mult: 0.00, cost: 0 },
      { name: '初开', mult: 0.05, cost: 200 },
      { name: '灵生', mult: 0.10, cost: 800 },
      { name: '泉涌', mult: 0.16, cost: 3000 },
      { name: '山成', mult: 0.22, cost: 12000 },
      { name: '日月', mult: 0.30, cost: 50000 },
      { name: '周天', mult: 0.40, cost: 200000 },
      { name: '小千', mult: 0.52, cost: 800000 },
      { name: '大千', mult: 0.66, cost: 3000000 },
      { name: '洞天', mult: 0.85, cost: 12000000 }
    ],
    field: {
      name: '灵田', desc: '洞天灵田可植灵植，每阶段产出灵草与灵石。',
      costs: [0, 80, 240, 700, 2000, 6000, 18000, 50000, 150000],
      yield: [0, 1, 2, 3, 5, 8, 12, 18, 26]
    },
    spring: {
      name: '灵泉', desc: '灵泉凝液，每阶段产出洞天灵液，亦可滋养洞天。',
      costs: [0, 100, 300, 900, 2600, 8000, 24000, 70000, 200000],
      yield: [0, 1, 1, 2, 3, 4, 6, 9, 12]
    },
    stele: {
      name: '道碑', desc: '参悟道碑，可提升战力与渡劫成功率。',
      costs: [0, 120, 360, 1000, 3000, 9000, 27000, 80000, 230000],
      power: [0, 0.03, 0.06, 0.10, 0.15, 0.21, 0.28, 0.36, 0.46],
      trib: [0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.10]
    }
  };

  /* ========== 开局 ========== */
  QD.START = {
    stones: 80,
    contrib: 0,
    items: { p_juyuan: 2, a_chai: 1 },
    technique: 't_qingdeng',
    artifact: 'a_chai',
    age: 16,
    ap: 3,
    apMax: 6,
    apGain: 3
  };

  /* ========== 修炼与战力 ========== */
  QD.BASE_POWER = 120;
  QD.POWER_GROWTH = 1.85;

  QD.lerpColor = function (c1, c2, t) {
    function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
    const a = hex(c1), b = hex(c2);
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')';
  };
})(typeof window !== 'undefined' ? window : globalThis);

