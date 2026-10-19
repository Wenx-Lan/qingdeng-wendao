/* 青灯问道 · 世界游历事件库 */
(function (g) {
  'use strict';
  const QD = g.QD = g.QD || {};

  function scale(s, base) {
    return Math.round(base * Math.pow(3, Math.floor(s.life.realm / 3)));
  }

  const EVENTS = [
    {
      id: 'wolf', cat: 'beast', title: '荒岭狼群', minRealm: 0, maxRealm: 7, weight: 12, threat: 0,
      text: '天色将暗，荒岭上的风带着腥气。十几双绿眼睛在灌木后亮起，缓缓围拢。头狼体型大得不像狼，额上生着一撮白毛。',
      choices: [
        {
          label: '拔剑迎战', hint: '凶险 · 有妖丹与灵石',
          resolve: function (s, edge) {
            if (edge >= 0.9) {
              return {
                text: '你迎着狼群冲上去，剑光在暮色里划出一道白线。头狼的爪子擦过你的肩，你反手一剑，把它钉在地上。剩下的狼夹着尾巴散了。',
                effects: { stones: scale(s, 14), items: { m_neidan: 1 }, cult: 0.05 }
              };
            }
            return {
              text: '你被头狼扑倒在地，爪子撕开半边衣襟。你拼死捅出那一刀，狼群退了，你的血也流了一地。',
              effects: { stones: scale(s, 6), items: { m_neidan: 1 }, status: 'wound' },
              deathChance: 0.02
            };
          }
        },
        {
          label: '攀上枯树', hint: '稳妥 · 一无所获',
          resolve: function () {
            return { text: '你爬到枯树上坐到天亮。狼群在树下转了很久，最后叼走了你落在树下的半袋干粮。', effects: {} };
          }
        },
        {
          label: '掷出火折引开', hint: '稳妥 · 略有感悟',
          resolve: function () {
            return { text: '火折子在草丛里烧起来。狼怕火，退了几步。你趁夜绕出荒岭，回头时，山影里还有两点绿光在看你。', effects: { cult: 0.04 } };
          }
        }
      ]
    },
    {
      id: 'python', cat: 'beast', title: '黑潭蛟影', minRealm: 2, maxRealm: 10, weight: 9, threat: 3,
      text: '黑潭的水面静得像一块铁。你正要俯身取水，潭底忽然翻起一道黑影，鳞片在月光下泛着青。',
      choices: [
        {
          label: '潜入潭底', hint: '凶险 · 蛟丹与寒晶',
          resolve: function (s, edge) {
            if (edge >= 0.8) {
              return {
                text: '你潜入潭底，在一具巨大的白骨旁找到了那头老蛟。它已经快死了，你用剑送它最后一程。蛟丹入手时还是温的。',
                effects: { items: { m_neidan: 2, m_hanjing: 1 }, stones: scale(s, 22), cult: 0.08 }
              };
            }
            return {
              text: '你在潭底被蛟尾扫中，肋骨断了三根。你抱着蛟丹浮上来时，几乎已经没了力气。',
              effects: { items: { m_neidan: 1 }, status: 'heavy' },
              deathChance: 0.05
            };
          }
        },
        {
          label: '潭边设伏', hint: '稳健 · 寒晶',
          resolve: function (s) {
            return {
              text: '你在潭边守了半夜，蛟龙上岸蜕皮时，你取走了一片脱落的鳞。鳞片入水不沉，是上好的炼器材料。',
              effects: { items: { m_hanjing: 1 }, stones: scale(s, 8) }
            };
          }
        },
        {
          label: '离开', hint: '稳妥',
          resolve: function () {
            return { text: '你退了三步，转身就走。有些水，不该去搅。', effects: {} };
          }
        }
      ]
    },
    {
      id: 'ape', cat: 'beast', title: '血瞳魔猿', minRealm: 4, maxRealm: 14, weight: 8, threat: 6,
      text: '山谷里传来捶胸的闷响。一头两人高的魔猿挡在路中央，双眼血红，脚边堆着几具妖兽的尸骨。',
      choices: [
        {
          label: '正面搏杀', hint: '凶险 · 丰厚战利',
          resolve: function (s, edge) {
            if (edge >= 0.95) {
              return {
                text: '你与魔猿硬碰了三十招。最后一拳打穿它的胸口时，你的手也在抖。魔猿倒下，山谷里安静得可怕。',
                effects: { items: { m_neidan: 2, m_xingsha: 1 }, stones: scale(s, 30), cult: 0.1 }
              };
            }
            return {
              text: '魔猿的拳头擦着你的头砸在岩壁上，碎石崩了你一脸。你且战且退，最后是滚下山坡才捡回一条命。',
              effects: { status: 'heavy', stones: scale(s, 10) },
              deathChance: 0.06
            };
          }
        },
        {
          label: '布阵诱杀', hint: '需阵盘 · 稳妥',
          resolve: function (s) {
            const has = (s.life.items.arr_juling || 0) + (s.life.items.arr_zhoutian || 0) + (s.life.items.arr_hushan || 0);
            if (has > 0) {
              return {
                text: '你把阵盘埋在谷口，引魔猿踏入。阵光亮起的一瞬，你一剑封喉。',
                effects: { items: { m_neidan: 2 }, stones: scale(s, 26), cult: 0.08, useArray: true }
              };
            }
            return {
              text: '你摸了摸储物袋，才想起阵盘早已用尽。只能眼睁睁看着魔猿捶着胸口走远。',
              effects: {}
            };
          }
        },
        {
          label: '绕山而行', hint: '稳妥 · 略耗寿元',
          resolve: function () {
            return { text: '你绕了整整两天的山路，鞋底磨穿了一双。', effects: { lifespanPct: -0.01 } };
          }
        }
      ]
    },
    {
      id: 'corpse', cat: 'beast', title: '尸傀夜行', minRealm: 3, maxRealm: 12, weight: 7, threat: 4,
      text: '乱葬岗上起了雾。雾里有一排黑影，直挺挺地跳着，朝同一个方向去。为首那具穿着官服，脸上还贴着半张符。',
      choices: [
        {
          label: '以心火焚之', hint: '凶险 · 功德与贡献',
          resolve: function (s) {
            if (s.life.realm >= 3) {
              return {
                text: '你并指一点，心火落在符纸上。尸傀无声地烧起来，烧到最后，官服里掉出一枚铜印。',
                effects: { contrib: 8, stones: scale(s, 12), cult: 0.06 }
              };
            }
            return { text: '你的火太弱，尸傀只是歪了歪头。你被它一巴掌拍飞，滚进了沟里。', effects: { status: 'wound' }, deathChance: 0.03 };
          }
        },
        {
          label: '绕道', hint: '稳妥',
          resolve: function () {
            return { text: '你屏住呼吸，从雾的边缘绕过去。有些东西，还是让它们自己走吧。', effects: {} };
          }
        },
        {
          label: '掘其墓', hint: '贪念 · 有诅咒之险',
          resolve: function (s) {
            if (Math.random() < 0.65) {
              return { text: '你在棺里摸到一袋灵石和一枚旧钱。土很冷，冷得不像这个季节。', effects: { stones: scale(s, 35) } };
            }
            return { text: '棺盖掀开的瞬间，一股黑气扑上你的脸。你听见有人在耳边笑，笑声钻进了骨头里。', effects: { stones: scale(s, 20), status: 'curse' } };
          }
        }
      ]
    },
    {
      id: 'wounded', cat: 'friend', title: '雪地女修', minRealm: 1, maxRealm: 12, weight: 8, threat: 2,
      text: '山道边的雪里躺着一个人。是个女修，胸口有一道很深的剑伤，气息微弱，手还死死攥着储物袋。',
      choices: [
        {
          label: '出手救治', hint: '善缘 · 贡献与谢礼',
          resolve: function (s) {
            const hasPill = (s.life.items.p_huichun || 0) > 0;
            return {
              text: hasPill
                ? '你捏开她的嘴，喂下一枚回春丹。她咳出一口黑血，睁眼看了你很久，把储物袋里的一半灵石推给了你。'
                : '你撕下衣襟替她包扎，又渡了一口真气过去。她醒来后没说话，只把一枚玉牌塞进你手里。',
              effects: hasPill
                ? { contrib: 10, stones: scale(s, 15), usePill: 'p_huichun' }
                : { contrib: 12, stones: scale(s, 8), cult: 0.05 }
            };
          }
        },
        {
          label: '取走储物袋', hint: '恶念 · 心魔',
          resolve: function (s) {
            return {
              text: '你掰开她的手。储物袋里有不少灵石，还有一枚沾血的玉牌。她没有反抗，只是一直看着你。',
              effects: { stones: scale(s, 40), status: 'heart' }
            };
          }
        },
        {
          label: '装作没看见', hint: '稳妥',
          resolve: function () {
            return { text: '你从她身边走过去。走出很远，还能听见风里那声很轻的咳嗽。', effects: {} };
          }
        }
      ]
    },
    {
      id: 'drunk', cat: 'friend', title: '醉道人', minRealm: 0, maxRealm: 10, weight: 9, threat: 1,
      text: '破庙里躺着个醉道人，酒葫芦倒在地上，酒香飘出半里。他半睁着眼看你：“小友，有酒么？”',
      choices: [
        {
          label: '请他喝一壶', hint: '花费灵石 · 得丹药或指点',
          resolve: function (s) {
            const cost = scale(s, 6);
            if ((s.life.stones || 0) < cost) {
              return { text: '你摸遍了全身，只摸出几枚铜钱。道人笑了笑，翻个身又睡了。', effects: {} };
            }
            if (Math.random() < 0.5) {
              return { text: '道人喝得尽兴，从袖里摸出一枚丹药丢给你：“拿去，别问是什么。”', effects: { stones: -cost, items: { p_wudao: 1 } } };
            }
            return { text: '道人喝到一半，忽然指着你的丹田说了三句话。你回去想了半个月，才想明白第一句。', effects: { stones: -cost, cult: 0.22 } };
          }
        },
        {
          label: '听他讲道', hint: '稳妥 · 修为',
          resolve: function (s) {
            return { text: '道人絮絮叨叨讲了一夜，讲的全是些疯话。可你走的时候，脚步比来时轻。', effects: { cult: 0.12 } };
          }
        },
        {
          label: '走开', hint: '稳妥',
          resolve: function () {
            return { text: '你还有正事。破庙里的鼾声在你身后响起来，像打雷。', effects: {} };
          }
        }
      ]
    },
    {
      id: 'senior', cat: 'friend', title: '同门师兄', minRealm: 0, maxRealm: 8, weight: 8, threat: 0,
      text: '你在山道上碰见青灯宗的师兄。他背着一捆药材，走得一瘸一拐，看见你便笑了：“可算碰见个活人。”',
      choices: [
        {
          label: '帮他背药材', hint: '贡献与灵石',
          resolve: function (s) {
            return { text: '你替他背了三十里。到宗门时，他硬塞给你一袋灵石，说这是“脚力钱”。', effects: { stones: scale(s, 12), contrib: 6 } };
          }
        },
        {
          label: '与他切磋', hint: '修为 · 或轻伤',
          resolve: function (s) {
            if (Math.random() < 0.7) {
              return { text: '你们在山道上拆了五十招。他输了一招，笑着认输，又拉着你讲了许多运气的窍门。', effects: { cult: 0.12 } };
            }
            return { text: '他下手没轻没重，一记掌风把你掀进了路边的沟里。你爬起来时，他正尴尬地挠头。', effects: { cult: 0.08, status: 'wound' } };
          }
        },
        {
          label: '分道而行', hint: '稳妥',
          resolve: function () {
            return { text: '你们在岔路口分开。他走了几步，回头喊：“活着回来！”', effects: {} };
          }
        }
      ]
    },
    {
      id: 'cave', cat: 'chance', title: '无名古洞', minRealm: 1, maxRealm: 16, weight: 9, threat: 3,
      text: '崖壁上有个半人高的洞口，洞口结着蛛网，蛛网却是新的。风从洞里吹出来，带着一股陈年灵气。',
      choices: [
        {
          label: '深入探查', hint: '凶险 · 古物',
          resolve: function (s) {
            if (Math.random() < 0.6) {
              return {
                text: '你摸进洞深处，在一具枯骨旁找到一枚玉简和几块灵石。枯骨的手还保持着推门的姿势。',
                effects: { items: { m_yujian: 1 }, stones: scale(s, 25), cult: 0.1 }
              };
            }
            return {
              text: '洞里的石壁忽然合拢，你被夹在中间，拼了命才挤出来。背上的皮肉被磨掉一层。',
              effects: { stones: scale(s, 8), status: 'heavy' },
              deathChance: 0.03
            };
          }
        },
        {
          label: '只在洞口查看', hint: '稳妥 · 残简',
          resolve: function () {
            return { text: '你在洞口捡到半枚残简。简上只有三个字：灯、守、勿。', effects: { items: { m_yujian: 1 }, contrib: 4 } };
          }
        },
        {
          label: '封洞离开', hint: '稳妥',
          resolve: function () {
            return { text: '你搬了几块石头把洞口堵上。走远了才想，堵得住洞，堵得住里面的东西么。', effects: {} };
          }
        }
      ]
    },
    {
      id: 'stele', cat: 'chance', title: '无字残碑', minRealm: 2, maxRealm: 18, weight: 8, threat: 2,
      text: '荒野里立着一块残碑，碑上无字，只有一道道被风磨平的刻痕。你走近时，碑面映出一点灯火。',
      choices: [
        {
          label: '静坐参悟', hint: '修为 · 心魔',
          resolve: function (s) {
            if (Math.random() < 0.82) {
              return { text: '你在碑前坐了三天三夜。第四天清晨，你睁开眼，觉得自己体内有什么东西被轻轻推开了一道缝。', effects: { cult: 0.3 } };
            }
            return { text: '碑上忽然浮出一张脸，是你自己的脸。它对着你笑，笑得很慢。你惊醒时，天已经黑了。', effects: { cult: 0.15, status: 'heart' } };
          }
        },
        {
          label: '拓印碑文', hint: '贡献',
          resolve: function (s) {
            return { text: '你用朱砂把碑面拓下来。拓纸上没有字，只有一团晕开的红。宗门的长老看了很久，收下了，给了你一笔贡献。', effects: { contrib: 14, stones: scale(s, 6) } };
          }
        },
        {
          label: '叩首离去', hint: '稳妥 · 微末修为',
          resolve: function () {
            return { text: '你对着残碑拜了三拜。起身时，风把碑前的沙吹开，露出半句模糊的话：灯在人在。', effects: { cult: 0.05 } };
          }
        }
      ]
    },
    {
      id: 'spring', cat: 'chance', title: '山中灵泉', minRealm: 0, maxRealm: 12, weight: 9, threat: 0,
      text: '岩缝里渗出一眼泉水，水面浮着淡淡的白气。你掬起一捧，水是温的，掌心的旧伤竟有点发痒。',
      choices: [
        {
          label: '饮尽灵泉', hint: '修为与寿元',
          resolve: function (s) {
            return { text: '你俯身喝了三大口。泉水入腹，化作一线暖流，走遍四肢百骸。', effects: { cult: 0.2, lifespanPct: 0.03 } };
          }
        },
        {
          label: '装瓶带走', hint: '灵草',
          resolve: function () {
            return { text: '你把随身的水囊灌满，又在泉边采了几株被灵气养得发亮的草。', effects: { items: { m_qingyuan: 3 } } };
          }
        },
        {
          label: '沐浴疗伤', hint: '解除轻伤',
          resolve: function (s) {
            return { text: '你在泉里泡了半个时辰。出来时，身上那些旧伤竟都不疼了。', effects: { cure: ['wound', 'heavy'] } };
          }
        }
      ]
    },
    {
      id: 'meteor', cat: 'chance', title: '星落之夜', minRealm: 1, maxRealm: 18, weight: 7, threat: 1,
      text: '夜空中一颗星忽然亮了，拖着长长的尾巴坠向西方。大地震了一下，远处山头腾起一柱白烟。',
      choices: [
        {
          label: '追星而去', hint: '凶险 · 星砂',
          resolve: function (s) {
            return {
              text: '你追了半夜，在焦黑的山坑里找到几块还烫手的石头。石头裂开时，里面是细碎的星光。',
              effects: { items: { m_xingsha: 2 }, cult: 0.08 },
              deathChance: 0.02
            };
          }
        },
        {
          label: '对星许愿', hint: '修为',
          resolve: function () {
            return { text: '你不知道该许什么愿，最后只是在心里念了一遍自己的名字。风把星尘吹了你一身。', effects: { cult: 0.06 } };
          }
        },
        {
          label: '记下星轨', hint: '贡献',
          resolve: function (s) {
            return { text: '你把星落的方位仔仔细细画下来，交给了宗门的观星台。老执事盯着图看了半天，说这是大凶之兆。', effects: { contrib: 10 } };
          }
        }
      ]
    },
    {
      id: 'garden', cat: 'chance', title: '荒废药圃', minRealm: 1, maxRealm: 14, weight: 8, threat: 1,
      text: '山坳里有一片荒废的药圃，篱笆倒了半边。圃里的灵草没人打理，反倒长得比宗门里的更野、更旺。',
      choices: [
        {
          label: '采药', hint: '灵草',
          resolve: function (s) {
            return { text: '你采了满满一兜灵草。临走时才发现，药圃中央有一小块地，草长得格外整齐，像有人天天来打理。', effects: { items: { m_qingyuan: 2, m_chiyang: 2 } } };
          }
        },
        {
          label: '帮老农除草', hint: '善缘 · 回报',
          resolve: function (s) {
            return { text: '你帮守圃的老农除了半天草。老农话不多，临走塞给你一株用红绳系着的灵芝。', effects: { items: { m_jiuling: 1 }, stones: scale(s, 10) } };
          }
        },
        {
          label: '连根拔走', hint: '贪念 · 心魔',
          resolve: function (s) {
            return { text: '你把药圃里最值钱的几株连根拔了。土里渗出一股腥味，像是谁在底下哭。', effects: { items: { m_xuanbing: 1, m_jiuling: 1 }, status: 'heart' } };
          }
        }
      ]
    },
    {
      id: 'miasma', cat: 'peril', title: '瘴气深林', minRealm: 2, maxRealm: 12, weight: 8, threat: 2,
      text: '前面的林子终年笼着紫黑色的雾。雾里有细小的虫鸣，一声接一声，听得人头皮发麻。',
      choices: [
        {
          label: '屏息硬闯', hint: '中毒之险 · 近路',
          resolve: function (s) {
            if (Math.random() < 0.55) {
              return { text: '你闭气冲过瘴林，只在里头待了半炷香。出来时指甲盖已经发了黑。', effects: { status: 'poison', cult: 0.06 } };
            }
            return { text: '你穿过瘴林时，看见路边坐着几具白骨，姿态安详。你加快了脚步。', effects: { items: { m_xuanbing: 1 } } };
          }
        },
        {
          label: '绕行三日', hint: '稳妥 · 耗费寿元',
          resolve: function () {
            return { text: '你绕了三天路。三天不算长，可在修行人眼里，三天也是一寸命。', effects: { lifespanPct: -0.012 } };
          }
        },
        {
          label: '焚香驱瘴', hint: '花费灵石',
          resolve: function (s) {
            const cost = scale(s, 10);
            if ((s.life.stones || 0) < cost) {
              return { text: '你摸遍储物袋，连一撮香灰都没找着，只好原路退回。', effects: {} };
            }
            return { text: '你点燃一撮驱瘴香，紫雾向两边分开，露出一条窄路。路边的灵草被烟熏得发亮。', effects: { stones: -cost, items: { m_qingyuan: 2 }, cult: 0.04 } };
          }
        }
      ]
    },
    {
      id: 'thunder', cat: 'peril', title: '荒原雷池', minRealm: 3, maxRealm: 18, weight: 7, threat: 5,
      text: '荒原中央有一片焦黑的洼地，每隔十几息便有一道雷光落下。雷光里立着几块黑石，石心泛蓝。',
      choices: [
        {
          label: '入池淬体', hint: '凶险 · 大幅修为',
          resolve: function (s, edge) {
            if (edge >= 0.7) {
              return { text: '你迎着雷光走进洼地。雷落在肩上，皮开肉绽，可气海里的灵气也被劈得精纯了一截。', effects: { cult: 0.34, status: 'wound' } };
            }
            return { text: '第三道雷就把你劈趴下了。你趴在焦土里，闻着自己头发烧焦的味道，好半天才爬起来。', effects: { cult: 0.12, status: 'heavy' }, deathChance: 0.05 };
          }
        },
        {
          label: '取雷石', hint: '凶险 · 寒晶',
          resolve: function (s) {
            return { text: '你趁着雷光间隙冲进去，抱起一块蓝心黑石就跑。石头在怀里又麻又烫。', effects: { items: { m_hanjing: 2 } }, deathChance: 0.04 };
          }
        },
        {
          label: '观雷悟道', hint: '稳妥 · 修为',
          resolve: function () {
            return { text: '你在雷池外坐了七日，看雷起雷落。第七日，你忽然明白了一件事：雷不是天在发怒，是天在呼吸。', effects: { cult: 0.18 } };
          }
        }
      ]
    },
    {
      id: 'auction', cat: 'market', title: '坊市拍卖', minRealm: 1, maxRealm: 18, weight: 8, threat: 0,
      text: '坊市最大的阁楼今夜灯火通明。拍卖台上摆着一柄断剑、一枚丹药，还有一个用黑布罩着的笼子。',
      choices: [
        {
          label: '竞拍断剑', hint: '花费灵石 · 法器',
          resolve: function (s) {
            const cost = scale(s, 45);
            if ((s.life.stones || 0) < cost) {
              return { text: '你举了两次牌，第三次就有人报了更高的价。你摸了摸储物袋，默默坐了回去。', effects: {} };
            }
            const pool = s.life.realm >= 10 ? ['a_taixu', 'a_shanhe'] : s.life.realm >= 6 ? ['a_xingdou', 'a_zhenhun'] : ['a_qingfeng', 'a_xuantie', 'a_lingwen'];
            const id = QD.U.pick(pool);
            return { text: '你拍下了那柄断剑。回房拭去锈迹，剑身上浮出三道灵纹，竟是一柄被封印的法器。', effects: { stones: -cost, items: { [id]: 1 } } };
          }
        },
        {
          label: '售出材料', hint: '灵石',
          resolve: function (s) {
            let sold = 0, total = 0;
            ['m_qingyuan', 'm_chiyang', 'm_xuantie', 'm_neidan'].forEach(function (id) {
              const n = s.life.items[id] || 0;
              if (n > 0) { sold += n; total += n * scale(s, 5); QD.U.removeItem(s.life.items, id, n); }
            });
            if (!sold) return { text: '你的储物袋里空空如也，只能看别人一掷千金。', effects: {} };
            return { text: '你把积攒的材料尽数售出，换了一袋灵石。掌柜称重时，多看了你一眼。', effects: { stones: total } };
          }
        },
        {
          label: '旁观', hint: '贡献 · 见识',
          resolve: function (s) {
            return { text: '你在角落里看完了一场拍卖。那个黑布笼子里关着一只奄奄一息的灯蛾，最后被一个白衣人买走了。', effects: { contrib: 5, cult: 0.03 } };
          }
        }
      ]
    },
    {
      id: 'stall', cat: 'market', title: '旧货摊子', minRealm: 0, maxRealm: 12, weight: 8, threat: 0,
      text: '街角有个旧货摊，摊主是个独眼老头，摊上摆着缺角的玉、生锈的剑、看不出年份的兽骨。',
      choices: [
        {
          label: '买那枚残简', hint: '花费灵石 · 或有功法',
          resolve: function (s) {
            const cost = scale(s, 12);
            if ((s.life.stones || 0) < cost) return { text: '你把灵石数了三遍，还是差两块。老头把残简收了回去。', effects: {} };
            if (Math.random() < 0.35) {
              const pool = ['t_wuxing', 't_taiyin', 't_jiuyao', 't_dongming'];
              const id = QD.U.pick(pool);
              return { text: '你买下残简，回去用灵火一烤，简上浮出一篇功法。字迹很旧，像是几百年前的人写的。', effects: { stones: -cost, items: { [id]: 1 } } };
            }
            return { text: '残简上只有半篇没头没尾的吐纳法。你读了两遍，觉得还算有用。', effects: { stones: -cost, cult: 0.1 } };
          }
        },
        {
          label: '赌一块原石', hint: '花费灵石 · 赌运气',
          resolve: function (s) {
            const cost = scale(s, 20);
            if ((s.life.stones || 0) < cost) return { text: '老头斜了你一眼：“没钱也敢赌石？”', effects: {} };
            if (Math.random() < 0.4) {
              return { text: '原石切开，里头裹着一小团星砂般的蓝光。老头啧了一声，说你这运气该去买彩票。', effects: { stones: -cost, items: { m_xingsha: 1, m_hanjing: 1 } } };
            }
            return { text: '原石切开，是块普通的石头。老头笑得很开心，你觉得自己才像那块石头。', effects: { stones: -cost } };
          }
        },
        {
          label: '走开', hint: '稳妥',
          resolve: function () {
            return { text: '你总觉得那独眼老头看你的眼神不对，像是认识你。', effects: {} };
          }
        }
      ]
    },
    {
      id: 'blood', cat: 'evil', title: '血祭邪修', minRealm: 3, maxRealm: 16, weight: 7, threat: 5,
      text: '山谷里画着一个巨大的血阵，阵心绑着几个凡人。一个黑袍修士正在念咒，每念一句，阵中的人就淡一分。',
      choices: [
        {
          label: '出手救人', hint: '凶险 · 贡献与功德',
          resolve: function (s, edge) {
            if (edge >= 0.85) {
              return { text: '你一剑斩断阵旗。黑袍修士回头时，剑已经架在了他脖子上。阵中的凡人哭着给你磕头，你却只来得及救下三个。', effects: { contrib: 25, stones: scale(s, 30), cult: 0.1 } };
            }
            return { text: '你破了血阵，却被黑袍修士一掌打在胸口。他跑了，你吐了一地的血。', effects: { contrib: 15, status: 'heavy' }, deathChance: 0.06 };
          }
        },
        {
          label: '暗中跟随', hint: '稳妥 · 情报与贡献',
          resolve: function (s) {
            return { text: '你跟了他三天，记下了他的落脚处，把消息卖给了宗门的执法堂。执法堂的人连夜出发，回来时只带回一柄烧焦的剑。', effects: { contrib: 18, stones: scale(s, 12) } };
          }
        },
        {
          label: '偷学血祭', hint: '恶念 · 大幅修为 · 心魔',
          resolve: function (s) {
            return { text: '你躲在暗处，把血祭的口诀记了下来。回去试着运转，修为涨得飞快，可你照镜子时，发现自己的瞳孔红了一瞬。', effects: { cult: 0.35, status: 'heart' } };
          }
        }
      ]
    },
    {
      id: 'possess', cat: 'evil', title: '古修夺舍', minRealm: 5, maxRealm: 14, weight: 6, threat: 7,
      text: '你在古墓里碰到一缕残魂。它很高兴，说等了几千年，终于等来一个合适的皮囊。',
      choices: [
        {
          label: '守心不退', hint: '凶险 · 神魂大进',
          resolve: function (s) {
            if (Math.random() < 0.7) {
              return { text: '你在识海里与它厮杀了三日。最后你的神魂把它的残念一口吞了，撑得头疼了好些天。', effects: { cult: 0.4, contrib: 10 } };
            }
            return { text: '它钻进了你的识海。你咬破舌尖，用一口精血把它逼了出来，可神魂上还是留下了一道裂。', effects: { cult: 0.2, status: 'dao' }, deathChance: 0.07 };
          }
        },
        {
          label: '燃灯驱邪', hint: '残灯庇护',
          resolve: function (s) {
            return { text: '你把残灯举到额前。灯焰一跳，那缕残魂惨叫着退开，像被烫着了似的。', effects: { cult: 0.15, contrib: 12 } };
          }
        },
        {
          label: '退出古墓', hint: '稳妥',
          resolve: function () {
            return { text: '你退到墓外，把墓门重新封上。门后传来一声很长的叹息。', effects: {} };
          }
        }
      ]
    },
    {
      id: 'lampman', cat: 'story', title: '提灯的人', minRealm: 2, maxRealm: 12, weight: 4, threat: 0,
      cond: function (s) { return !s.life.flags.ev_lampman; },
      text: '山道上迎面走来一个提灯的人。灯是纸糊的，光却很亮，照得他的脸一片模糊。他停在你面前，问：“你的灯，还亮着么？”',
      choices: [
        {
          label: '如实回答', hint: '主线 · 灯',
          resolve: function (s) {
            s.life.flags.ev_lampman = true;
            return { text: '你说还亮着。提灯人点点头，把灯往前递了递。你看见自己的影子在地上被拉得很长，长到望不见头。他走时说：“灯亮着，路就还在。”', effects: { cult: 0.15, items: { p_wudao: 1 } } };
          }
        },
        {
          label: '反问他是什么人', hint: '主线 · 灯',
          resolve: function (s) {
            s.life.flags.ev_lampman = true;
            return { text: '他想了想，说：“我是上一个提灯的人。”说完便走了，灯却没带走，留在你脚边。你低头去看，那灯里没有火。', effects: { cult: 0.1, contrib: 6 } };
          }
        },
        {
          label: '不出声，让路', hint: '稳妥',
          resolve: function (s) {
            s.life.flags.ev_lampman = true;
            return { text: '你侧身让开。擦肩而过时，你听见灯里有人轻轻叹了口气。', effects: { cult: 0.05 } };
          }
        }
      ]
    },
    {
      id: 'suzhao', cat: 'story', title: '故人苏晚照', minRealm: 6, maxRealm: 16, weight: 4, threat: 0,
      cond: function (s) { return s.life.realm >= 6 && !s.life.flags.ev_suzhao; },
      text: '你在雪原上又碰见了苏晚照。她比上次见时更瘦，正蹲在一条冻住的河边，往冰面上点一盏小小的灯。',
      choices: [
        {
          label: '陪她坐一会儿', hint: '主线 · 善缘',
          resolve: function (s) {
            s.life.flags.ev_suzhao = true;
            return { text: '你们并肩坐着，看那盏灯在冰上烧出一个小小的洞。她说：“我每点燃一盏灯，就少一盏要守。”你问她守了多少盏，她没答，只说：“快了。”', effects: { cult: 0.18, items: { p_huichun: 2 } } };
          }
        },
        {
          label: '问她玉佩的来历', hint: '主线 · 身世',
          resolve: function (s) {
            s.life.flags.ev_suzhao = true;
            return { text: '她把玉佩摘下来给你看。玉佩缺了一角，断口很旧，上面刻着半个“灯”字。她说这是她娘留下的，她娘也是守灯人。', effects: { cult: 0.12, contrib: 10 } };
          }
        },
        {
          label: '假装没看见', hint: '稳妥',
          resolve: function (s) {
            s.life.flags.ev_suzhao = true;
            return { text: '你从她身后绕过去。走出很远，回头看，那盏灯还在冰面上亮着，她还在原地。', effects: {} };
          }
        }
      ]
    },
    {
      id: 'tianpage', cat: 'story', title: '天条残页', minRealm: 12, maxRealm: 18, weight: 4, threat: 3,
      cond: function (s) { return s.life.realm >= 12 && !s.life.flags.ev_tianpage; },
      text: '一片金色的纸从天上飘下来，落在你脚边。纸上只有一行字，字迹正在慢慢淡去：守灯人不得离灯。',
      choices: [
        {
          label: '收进袖中', hint: '主线 · 天条',
          resolve: function (s) {
            s.life.flags.ev_tianpage = true;
            return { text: '纸一入袖便烫得厉害。你把它贴在残灯上，那行字慢慢移到了灯身上，像本来就刻在那里。', effects: { cult: 0.2, contrib: 30 } };
          }
        },
        {
          label: '以仙光读取', hint: '主线 · 真相',
          resolve: function (s) {
            s.life.flags.ev_tianpage = true;
            return { text: '仙光扫过纸面，你看见了很多被抹掉的字。它们叠在一起，最后只剩下一个意思：天条怕灯。', effects: { cult: 0.15, contrib: 20, status: 'dao' } };
          }
        },
        {
          label: '任它飘走', hint: '稳妥',
          resolve: function (s) {
            s.life.flags.ev_tianpage = true;
            return { text: '纸片被风卷起来，越飞越高，最后像一片雪一样化在了天上。', effects: { cult: 0.05 } };
          }
        }
      ]
    }
  ];

  QD.EVENTS = EVENTS;
  QD.pickEvents = function (s, count) {
    const pool = EVENTS.filter(function (e) {
      if (s.life.realm < e.minRealm || s.life.realm > e.maxRealm) return false;
      if (e.cond && !e.cond(s)) return false;
      return true;
    });
    const picked = [];
    const used = {};
    const story = pool.filter(function (e) { return e.cat === 'story'; });
    if (story.length && Math.random() < 0.55) {
      const one = QD.U.pick(story);
      picked.push(one);
      used[one.id] = true;
    }
    while (picked.length < count) {
      const rest = pool.filter(function (e) { return !used[e.id]; });
      if (!rest.length) break;
      const e = QD.U.weighted(rest);
      picked.push(e);
      used[e.id] = true;
    }
    return QD.U.shuffle(picked);
  };
})(typeof window !== 'undefined' ? window : globalThis);
