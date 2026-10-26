/**
 * HS-MATH-BANK-GLOBAL-1C — 全高一 KP 种子草案（权威结构化）
 * 状态：SEED_DRAFT — 禁止本阶段执行 SQL / 写库
 *
 * RECOVERY：本文件由 GLOBAL-1C-RECOVERY 自 SQL 源重建（非 git 检出）。
 * 来源：
 * - existingInDb ← db/migrate_hs_math_p1_0.sql + db/seed_hs_math_ch03_function_kps.sql
 * - seedsToInsert ← db/seed_hs_math_global1c_missing_kps.sql
 * prerequisites/qtypes/methods 为结构占位（再生），以 code/name/section/summary/sort 为准。
 */

function s(o) { return o }

/** 库内已有（索引，不进 INSERT 草案） */
export const existingInDb = [
  {
    "code": "rja.1.1.01",
    "name": "集合的含义与元素",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.1",
    "sectionName": "集合的概念",
    "summary": "集合是具有确定属性的对象全体；元素属于集合记作 ∈。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.1.02",
    "name": "集合的表示法",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.1",
    "sectionName": "集合的概念",
    "summary": "常用列举法与描述法表示集合。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.1.03",
    "name": "空集与全集（描述层面）",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.1",
    "sectionName": "集合的概念",
    "summary": "空集不含任何元素，记作 ∅；讨论补集时常引入全集。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.2.01",
    "name": "子集与真子集",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.2",
    "sectionName": "集合间的基本关系",
    "summary": "A⊆B 表示 A 的元素都属于 B；真子集还要求 A≠B。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.2.02",
    "name": "集合相等",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.2",
    "sectionName": "集合间的基本关系",
    "summary": "A=B 当且仅当 A⊆B 且 B⊆A。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.3.01",
    "name": "并集",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.3",
    "sectionName": "集合的基本运算",
    "summary": "A∪B 由属于 A 或属于 B 的元素组成。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.3.02",
    "name": "交集",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.3",
    "sectionName": "集合的基本运算",
    "summary": "A∩B 由同时属于 A 与 B 的元素组成。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.3.03",
    "name": "补集",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.3",
    "sectionName": "集合的基本运算",
    "summary": "在全集 U 下，∁_U A 由 U 中不属于 A 的元素组成。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.3.04",
    "name": "文氏图与综合运算",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.3",
    "sectionName": "集合的基本运算",
    "summary": "用文氏图理解并、交、补的综合运算。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.4.01",
    "name": "充分条件",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.4",
    "sectionName": "充分条件与必要条件",
    "summary": "若 p⇒q，则 p 是 q 的充分条件。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.4.02",
    "name": "必要条件",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.4",
    "sectionName": "充分条件与必要条件",
    "summary": "若 p⇒q，则 q 是 p 的必要条件。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.4.03",
    "name": "充要条件",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.4",
    "sectionName": "充分条件与必要条件",
    "summary": "若 p⇔q，则 p 是 q 的充要条件。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.5.01",
    "name": "全称量词",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.5",
    "sectionName": "全称量词与存在量词",
    "summary": "∀ 表示“任意”；含全称量词的命题对论域中每一个对象成立。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.5.02",
    "name": "存在量词",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.5",
    "sectionName": "全称量词与存在量词",
    "summary": "∃ 表示“存在”；含存在量词的命题至少对一个对象成立。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.1.5.03",
    "name": "含有量词的命题否定",
    "specialtyCode": "rja-ch1",
    "sectionCode": "1.5",
    "sectionName": "全称量词与存在量词",
    "summary": "否定时全称与存在互换，并否定结论。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.1.01",
    "name": "函数的定义",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "summary": "在数集 A 上，对任意 x∈A 按对应关系 f 有唯一确定的 y∈数集 B 与之对应，则称 f:A→B 为函数；记号 y=f(x)。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.1.02",
    "name": "定义域",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "summary": "使函数有意义的自变量取值全体，记作 D(f) 或定义域；求定义域须考虑分式、根式、对数等限制。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.1.03",
    "name": "值域",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "summary": "函数值组成的集合，记作 R(f) 或值域；可由解析式、图象或单调性等求取。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.1.04",
    "name": "对应关系",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "summary": "函数三要素之一；同一对应关系可用不同字母表示，关键在“对应法则”本身而非符号。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.1.05",
    "name": "相同函数的判断",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "summary": "两函数相同当且仅当定义域相同且对应关系相同（值域随之相同）；仅解析式写法不同可能仍为同一函数。",
    "sortOrder": 50,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.1.06",
    "name": "解析法",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "summary": "用数学表达式给出对应关系；是高中最常用的表示法，便于求值、讨论性质。",
    "sortOrder": 60,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.1.07",
    "name": "图象法",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "summary": "在平面直角坐标系中用点集表示函数；图象是点 (x,f(x)) 的轨迹，可直观读定义域、值域与单调性等。",
    "sortOrder": 70,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.1.08",
    "name": "列表法",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "summary": "用表格列出部分自变量与函数值；适合离散取值或实验数据，一般不能完整刻画连续函数全部性质。",
    "sortOrder": 80,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.1.09",
    "name": "分段函数",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "summary": "在定义域不同子集上用不同解析式给出对应关系；求值、图象与性质须按区间分别讨论再综合。",
    "sortOrder": 90,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.1.10",
    "name": "函数求值",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.1",
    "sectionName": "函数的概念及其表示",
    "summary": "给定自变量（或表达式）求函数值；含复合、分段、抽象函数 f(g(x)) 等常见求值题型。",
    "sortOrder": 100,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.2.01",
    "name": "单调递增",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "summary": "在区间 I 上，任意 x1<x2 都有 f(x1)<f(x2)（或 ≤）则称在 I 上（严格）单调递增；须明确所论区间。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.2.02",
    "name": "单调递减",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "summary": "在区间 I 上，任意 x1<x2 都有 f(x1)>f(x2)（或 ≥）则称在 I 上（严格）单调递减；须明确所论区间。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.2.03",
    "name": "单调区间",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "summary": "函数在其上保持单调的最大区间（或指定区间）；同一函数可有多个单调区间，书写时注意开闭。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.2.04",
    "name": "单调性判断",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "summary": "用定义、图象、导数（后续）或已知结论判断单调性；比较 f(x1) 与 f(x2) 时注意变形等价性。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.2.05",
    "name": "单调性与不等式",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "summary": "利用单调性比较大小或解不等式：同向可传递；复合时注意内外层单调性组合。",
    "sortOrder": 50,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.2.06",
    "name": "最大值",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "summary": "若存在 x0∈D 使对任意 x∈D 有 f(x)≤f(x0)，则 f(x0) 为最大值；注意定义域与是否取到。",
    "sortOrder": 60,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.2.07",
    "name": "最小值与区间最值",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "summary": "最小值类似定义；闭区间上连续函数必有最值。区间最值常结合端点与单调性（或极值）讨论。",
    "sortOrder": 70,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.2.08",
    "name": "单调性与最值",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "summary": "在单调区间上，端点（或区间趋向）决定最值；先定单调性再求最值，避免只看导数公式而忽略定义域。",
    "sortOrder": 80,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.2.09",
    "name": "奇偶性定义与定义域对称",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "summary": "讨论奇偶性必须先检验定义域关于原点对称；若不对称则既非奇也非偶。偶：f(-x)=f(x)；奇：f(-x)=-f(x)。零函数在对称定义域上既奇又偶。",
    "sortOrder": 90,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.2.10",
    "name": "奇函数与偶函数的判断",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "summary": "在定义域已关于原点对称的前提下，用定义、图象或赋值法判断奇/偶；不可仅凭解析式“看起来像”而跳过定义域。",
    "sortOrder": 100,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.2.11",
    "name": "既奇又偶、非奇非偶及图象对称",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "summary": "既奇又偶⇔在对称定义域上为常值 0（零函数）。非奇非偶常见。偶函数图象关于 y 轴对称；奇函数关于原点对称。",
    "sortOrder": 110,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.2.12",
    "name": "奇偶性求值与综合应用",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.2",
    "sectionName": "函数的基本性质",
    "summary": "用奇偶性求未知函数值、讨论分段/含参奇偶性。与单调性综合时必须明确所讨论的区间（如在 [0,+∞) 增则在对称负半轴相应递减等）。",
    "sortOrder": 120,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.3.01",
    "name": "幂函数概念",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.3",
    "sectionName": "幂函数",
    "summary": "形如 y=x^α（α 为常数）的函数称为幂函数；定义域随 α 变化（整数、分数、无理数情形不同）。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.3.02",
    "name": "常见幂函数图象",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.3",
    "sectionName": "幂函数",
    "summary": "掌握 y=x,x^2,x^3,x^{1/2},x^{-1} 等典型图象过定点、象限分布与大致形状。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.3.03",
    "name": "幂函数性质概览",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.3",
    "sectionName": "幂函数",
    "summary": "综合定义域、值域、奇偶性、单调性与图象特征；不同 α 性质差异大，勿机械套用。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.3.04",
    "name": "幂函数单调性",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.3",
    "sectionName": "幂函数",
    "summary": "在各自定义域的合适区间上讨论增减；如 x^2 在 [0,+∞) 增、在 (-∞,0] 减；注意 α 与区间。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  },
  {
    "code": "rja.3.3.05",
    "name": "幂函数奇偶性",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.3",
    "sectionName": "幂函数",
    "summary": "先看定义域是否关于原点对称，再判断奇偶：如 x^2 偶、x^3 奇、x^{1/2} 定义域非对称故非奇非偶。",
    "sortOrder": 50,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "IN_DB"
  }
]

/** 本阶段拟 INSERT 的缺失 KP */
export const seedsToInsert = [
  {
    "code": "rja.2.1.01",
    "name": "不等式的基本性质",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.1",
    "sectionName": "等式性质与不等式性质",
    "summary": "不等式的传递、加法、乘法（注意乘数符号）等基本性质。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.2.1.02",
    "name": "作差比较大小",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.1",
    "sectionName": "等式性质与不等式性质",
    "summary": "通过作差并因式分解或配方比较两式大小。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.2.1.03",
    "name": "不等式应用建模",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.1",
    "sectionName": "等式性质与不等式性质",
    "summary": "把实际约束翻译成不等式并求解。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.2.1.04",
    "name": "等式的基本性质",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.1",
    "sectionName": "等式性质与不等式性质",
    "summary": "等式两边同加、同乘（非零）保持等式。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.2.2.01",
    "name": "算术-几何平均不等式",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.2",
    "sectionName": "基本不等式",
    "summary": "对正数 a,b：(a+b)/2≥√(ab)，等号当且仅当 a=b。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.2.2.02",
    "name": "配凑法求最值",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.2",
    "sectionName": "基本不等式",
    "summary": "通过换元或配凑使乘积或和为定值以求最值。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.2.2.03",
    "name": "基本不等式双变量",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.2",
    "sectionName": "基本不等式",
    "summary": "两正变量和定积最大、积定和最小等典型模型。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.2.2.04",
    "name": "基本不等式应用注意",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.2",
    "sectionName": "基本不等式",
    "summary": "正数条件、等号成立条件；一正二定三等号。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.2.3.01",
    "name": "三个二次的关系",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "summary": "二次函数、方程、不等式通过图象与根相互转化。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.2.3.02",
    "name": "一元二次不等式解法",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "summary": "先求根再根据开口确定解集（两根之间或之外）。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.2.3.03",
    "name": "含参二次不等式",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "summary": "参数影响判别式、根的分布与解集分类讨论。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.2.3.04",
    "name": "二次函数区间最值",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "summary": "闭区间上结合顶点是否落入区间求最值。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.2.3.05",
    "name": "根的分布",
    "specialtyCode": "rja-ch2",
    "sectionCode": "2.3",
    "sectionName": "二次函数与一元二次方程、不等式",
    "summary": "用判别式、对称轴、端点符号讨论根的位置。",
    "sortOrder": 50,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.3.4.01",
    "name": "实际问题函数建模",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.4",
    "sectionName": "函数的应用（一）",
    "summary": "从实际问题抽象函数关系并明确定义域。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.3.4.02",
    "name": "分段实际模型",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.4",
    "sectionName": "函数的应用（一）",
    "summary": "分段计费、分段税率等模型的列式与求值。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.3.4.03",
    "name": "函数模型选择与比较",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.4",
    "sectionName": "函数的应用（一）",
    "summary": "比较不同函数模型对同一问题的拟合与预测。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.3.4.04",
    "name": "用函数解决最值实际问题",
    "specialtyCode": "rja-ch3",
    "sectionCode": "3.4",
    "sectionName": "函数的应用（一）",
    "summary": "在实际约束下求函数最值并解释实际意义。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.1.01",
    "name": "n次方根",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.1",
    "sectionName": "指数",
    "summary": "正数的 n 次方根；偶次根非负，奇次根符号随底数。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.1.02",
    "name": "分数指数幂",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.1",
    "sectionName": "指数",
    "summary": "a^{m/n} 与根式互化（注意底数条件）；负指数与零指数。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.1.03",
    "name": "指数幂运算",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.1",
    "sectionName": "指数",
    "summary": "同底数幂乘法、除法、幂的乘方等运算法则。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.1.04",
    "name": "根式与指数互化",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.1",
    "sectionName": "指数",
    "summary": "根式与分数指数幂的互化及化简。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.2.01",
    "name": "指数函数概念",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.2",
    "sectionName": "指数函数",
    "summary": "y=a^x（a>0,a≠1）的定义域、值域与过定点。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.2.02",
    "name": "指数函数单调性",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.2",
    "sectionName": "指数函数",
    "summary": "a>1 增，0<a<1 减；比较大小常用化同底。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.2.03",
    "name": "指数方程",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.2",
    "sectionName": "指数函数",
    "summary": "同底化简、换元解指数方程。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.2.04",
    "name": "指数函数图象变换",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.2",
    "sectionName": "指数函数",
    "summary": "平移、对称等对指数函数图象的影响。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.3.01",
    "name": "对数概念",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.3",
    "sectionName": "对数",
    "summary": "若 a^b=N（a>0,a≠1），则 b=log_a N。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.3.02",
    "name": "对数运算法则",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.3",
    "sectionName": "对数",
    "summary": "积商幂的对数法则及常用变形。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.3.03",
    "name": "换底公式",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.3",
    "sectionName": "对数",
    "summary": "log_a b = log_c b / log_c a。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.3.04",
    "name": "对数方程初步",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.3",
    "sectionName": "对数",
    "summary": "解对数方程时注意真数与底数限制。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.4.01",
    "name": "对数函数概念",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.4",
    "sectionName": "对数函数",
    "summary": "y=log_a x 与指数函数互为反函数；过定点(1,0)。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.4.02",
    "name": "对数函数单调性",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.4",
    "sectionName": "对数函数",
    "summary": "a>1 增，0<a<1 减；比大小注意底数。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.4.03",
    "name": "对数函数图象与性质",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.4",
    "sectionName": "对数函数",
    "summary": "定义域、值域、渐近线与图象特征。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.5.01",
    "name": "指数增长模型",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.5",
    "sectionName": "函数的应用（二）",
    "summary": "复利、人口、衰减等指数型实际模型。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.5.02",
    "name": "对数应用",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.5",
    "sectionName": "函数的应用（二）",
    "summary": "用对数处理乘积或数量级，或解指数型实际方程。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.5.03",
    "name": "二分法思想",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.5",
    "sectionName": "函数的应用（二）",
    "summary": "用零点存在定理与二分法逼近方程根。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.4.5.04",
    "name": "复合增长模型",
    "specialtyCode": "rja-ch4",
    "sectionCode": "4.5",
    "sectionName": "函数的应用（二）",
    "summary": "分段增长、多阶段指数或一次复合模型。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.1.01",
    "name": "角的概念推广",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.1",
    "sectionName": "任意角和弧度制",
    "summary": "任意角、象限角、终边相同的角。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.1.02",
    "name": "弧度制",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.1",
    "sectionName": "任意角和弧度制",
    "summary": "弧度定义；角度与弧度互化。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.1.03",
    "name": "弧长应用",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.1",
    "sectionName": "任意角和弧度制",
    "summary": "弧长公式 l=|α|r（α 为弧度）。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.2.01",
    "name": "三角函数定义",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.2",
    "sectionName": "三角函数的概念",
    "summary": "单位圆或坐标定义正弦、余弦、正切。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.2.02",
    "name": "同角关系",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.2",
    "sectionName": "三角函数的概念",
    "summary": "sin²θ+cos²θ=1 及商数关系等。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.2.03",
    "name": "三角函数定义域与符号",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.2",
    "sectionName": "三角函数的概念",
    "summary": "各三角函数定义域与象限符号。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.3.01",
    "name": "诱导公式",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.3",
    "sectionName": "诱导公式",
    "summary": "关于 π±α、π/2±α 等诱导公式。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.3.02",
    "name": "互化求值",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.3",
    "sectionName": "诱导公式",
    "summary": "用诱导公式化为锐角或已知角求值。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.3.03",
    "name": "化简证明",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.3",
    "sectionName": "诱导公式",
    "summary": "三角式化简与恒等证明。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.4.01",
    "name": "正弦函数性质",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.4",
    "sectionName": "三角函数的图象与性质",
    "summary": "y=sin x 的周期性、奇偶性、单调区间与最值。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.4.02",
    "name": "余弦函数性质",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.4",
    "sectionName": "三角函数的图象与性质",
    "summary": "y=cos x 的图象与性质。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.4.03",
    "name": "正切函数",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.4",
    "sectionName": "三角函数的图象与性质",
    "summary": "y=tan x 的定义域、周期与单调区间。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.5.01",
    "name": "和差公式",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.5",
    "sectionName": "三角恒等变换",
    "summary": "sin/cos 的和角、差角公式。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.5.02",
    "name": "二倍角公式",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.5",
    "sectionName": "三角恒等变换",
    "summary": "二倍角及降幂公式。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.5.03",
    "name": "辅助角公式",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.5",
    "sectionName": "三角恒等变换",
    "summary": "a sinθ+b cosθ 化为单一正弦型。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.5.04",
    "name": "恒等证明",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.5",
    "sectionName": "三角恒等变换",
    "summary": "综合运用公式证明三角恒等式。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.6.01",
    "name": "振幅周期相位",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.6",
    "sectionName": "函数 y=Asin(ωx+φ)",
    "summary": "由 A,ω,φ 读振幅、周期、初相。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.6.02",
    "name": "图象变换",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.6",
    "sectionName": "函数 y=Asin(ωx+φ)",
    "summary": "伸缩、平移顺序与图象变换。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.6.03",
    "name": "由已知求解析式",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.6",
    "sectionName": "函数 y=Asin(ωx+φ)",
    "summary": "由五点或条件待定 A,ω,φ。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.7.01",
    "name": "简谐振动",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.7",
    "sectionName": "三角函数的应用",
    "summary": "简谐运动的三角模型。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.7.02",
    "name": "潮汐模型",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.7",
    "sectionName": "三角函数的应用",
    "summary": "用正弦型函数刻画潮汐等周期现象。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rja.5.7.03",
    "name": "测量应用",
    "specialtyCode": "rja-ch5",
    "sectionCode": "5.7",
    "sectionName": "三角函数的应用",
    "summary": "解三角形与测高测距等应用。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.10.1.01",
    "name": "样本空间",
    "specialtyCode": "rjb-ch5",
    "sectionCode": "10.1",
    "sectionName": "随机事件与概率",
    "summary": "随机试验与样本空间。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.10.1.02",
    "name": "古典概型",
    "specialtyCode": "rjb-ch5",
    "sectionCode": "10.1",
    "sectionName": "随机事件与概率",
    "summary": "等可能基本事件下的概率计算。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.10.1.03",
    "name": "事件关系与运算",
    "specialtyCode": "rjb-ch5",
    "sectionCode": "10.1",
    "sectionName": "随机事件与概率",
    "summary": "并、交、对立事件及概率性质。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.10.2.01",
    "name": "独立事件",
    "specialtyCode": "rjb-ch5",
    "sectionCode": "10.2",
    "sectionName": "事件的相互独立性",
    "summary": "独立当且仅当 P(AB)=P(A)P(B)。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.10.2.02",
    "name": "独立重复试验初步",
    "specialtyCode": "rjb-ch5",
    "sectionCode": "10.2",
    "sectionName": "事件的相互独立性",
    "summary": "独立重复情境下的概率计算入门。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.10.3.01",
    "name": "大数定律思想",
    "specialtyCode": "rjb-ch5",
    "sectionCode": "10.3",
    "sectionName": "频率与概率",
    "summary": "频率稳定于概率的直观（大数定律思想）。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.10.3.02",
    "name": "频率与概率关系",
    "specialtyCode": "rjb-ch5",
    "sectionCode": "10.3",
    "sectionName": "频率与概率",
    "summary": "用频率估计概率的适用条件与误差意识。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.1.01",
    "name": "向量概念",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.1",
    "sectionName": "平面向量的概念",
    "summary": "向量的定义、几何表示与自由向量。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.1.02",
    "name": "向量模",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.1",
    "sectionName": "平面向量的概念",
    "summary": "向量的模（长度）及其非负性。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.1.03",
    "name": "相等向量",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.1",
    "sectionName": "平面向量的概念",
    "summary": "方向相同且模相等的向量相等。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.1.04",
    "name": "平行与共线向量",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.1",
    "sectionName": "平面向量的概念",
    "summary": "向量平行（共线）的几何含义。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.2.01",
    "name": "向量加法",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.2",
    "sectionName": "平面向量的运算",
    "summary": "三角形法则、平行四边形法则与运算律。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.2.02",
    "name": "数量积",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.2",
    "sectionName": "平面向量的运算",
    "summary": "a·b=|a||b|cosθ；垂直当且仅当数量积为 0。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.2.03",
    "name": "向量夹角",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.2",
    "sectionName": "平面向量的运算",
    "summary": "由数量积求夹角；注意夹角范围。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.2.04",
    "name": "投影",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.2",
    "sectionName": "平面向量的运算",
    "summary": "向量在某方向上的投影。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.2.05",
    "name": "数乘",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.2",
    "sectionName": "平面向量的运算",
    "summary": "实数与向量的数乘及几何意义。",
    "sortOrder": 50,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.3.01",
    "name": "基底",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.3",
    "sectionName": "平面向量基本定理及坐标表示",
    "summary": "平面向量基本定理：不共线向量作基底。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.3.02",
    "name": "坐标运算",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.3",
    "sectionName": "平面向量基本定理及坐标表示",
    "summary": "坐标下的加减、数乘、数量积与模。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.3.03",
    "name": "共线条件",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.3",
    "sectionName": "平面向量基本定理及坐标表示",
    "summary": "坐标或数量关系刻画共线。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.3.04",
    "name": "向量垂直的坐标条件",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.3",
    "sectionName": "平面向量基本定理及坐标表示",
    "summary": "坐标数量积为 0 当且仅当垂直。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.4.01",
    "name": "向量应用",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.4",
    "sectionName": "平面向量的应用",
    "summary": "用向量处理平面几何与实际位移问题。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.4.02",
    "name": "位移合成",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.4",
    "sectionName": "平面向量的应用",
    "summary": "位移、速度等矢量合成。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.4.03",
    "name": "功的计算",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.4",
    "sectionName": "平面向量的应用",
    "summary": "恒力做功 W=F·s。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.6.4.04",
    "name": "几何证明",
    "specialtyCode": "rjb-ch1",
    "sectionCode": "6.4",
    "sectionName": "平面向量的应用",
    "summary": "用向量证明平行、中点、垂直等。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.7.1.01",
    "name": "虚数单位",
    "specialtyCode": "rjb-ch2",
    "sectionCode": "7.1",
    "sectionName": "复数的概念",
    "summary": "i²=-1；复数 a+bi 及实部虚部。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.7.1.02",
    "name": "复数相等",
    "specialtyCode": "rjb-ch2",
    "sectionCode": "7.1",
    "sectionName": "复数的概念",
    "summary": "两复数相等当且仅当实部、虚部分别相等。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.7.1.03",
    "name": "复平面",
    "specialtyCode": "rjb-ch2",
    "sectionCode": "7.1",
    "sectionName": "复数的概念",
    "summary": "复数与复平面点或向量的对应。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.7.2.01",
    "name": "复数运算",
    "specialtyCode": "rjb-ch2",
    "sectionCode": "7.2",
    "sectionName": "复数的四则运算",
    "summary": "加减乘除运算法则（除法用共轭）。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.7.2.02",
    "name": "共轭复数",
    "specialtyCode": "rjb-ch2",
    "sectionCode": "7.2",
    "sectionName": "复数的四则运算",
    "summary": "共轭的性质与几何意义。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.7.3.01",
    "name": "复数模",
    "specialtyCode": "rjb-ch2",
    "sectionCode": "7.3",
    "sectionName": "复数的三角表示",
    "summary": "|a+bi|=√(a²+b²)；模的乘法性质。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.7.3.02",
    "name": "复数三角形式初步",
    "specialtyCode": "rjb-ch2",
    "sectionCode": "7.3",
    "sectionName": "复数的三角表示",
    "summary": "选学：三角形式与辐角（系统保留小节）。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.1.01",
    "name": "棱柱概念",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.1",
    "sectionName": "基本立体图形",
    "summary": "棱柱、棱锥、棱台、圆柱圆锥球等基本结构。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.1.02",
    "name": "简单组合体",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.1",
    "sectionName": "基本立体图形",
    "summary": "识别由基本几何体组成的组合体。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.2.01",
    "name": "斜二测",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.2",
    "sectionName": "立体图形的直观图",
    "summary": "斜二测画法规则与直观图还原。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.2.02",
    "name": "直观图与原图关系",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.2",
    "sectionName": "立体图形的直观图",
    "summary": "长度、平行性在直观图中的保持与变化。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.3.01",
    "name": "柱体体积",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.3",
    "sectionName": "空间几何体的表面积与体积",
    "summary": "柱体体积 V=Sh。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.3.02",
    "name": "锥体应用",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.3",
    "sectionName": "空间几何体的表面积与体积",
    "summary": "锥体体积 V=(1/3)Sh 及应用。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.3.03",
    "name": "组合体",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.3",
    "sectionName": "空间几何体的表面积与体积",
    "summary": "组合体表面积与体积的分割或补形。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.3.04",
    "name": "球体表面积与体积",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.3",
    "sectionName": "空间几何体的表面积与体积",
    "summary": "球的表面积与体积公式。",
    "sortOrder": 40,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.4.01",
    "name": "平行公理",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.4",
    "sectionName": "空间点、直线、平面之间的位置关系",
    "summary": "平行公理及推论；异面直线概念。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.4.02",
    "name": "直线与平面位置关系",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.4",
    "sectionName": "空间点、直线、平面之间的位置关系",
    "summary": "线面平行、相交、在平面内。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.5.01",
    "name": "线面平行判定",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.5",
    "sectionName": "空间直线、平面的平行",
    "summary": "线面平行的判定与性质定理。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.5.02",
    "name": "面面平行",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.5",
    "sectionName": "空间直线、平面的平行",
    "summary": "面面平行的判定与性质。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.6.01",
    "name": "线面垂直",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.6",
    "sectionName": "空间直线、平面的垂直",
    "summary": "线面垂直判定与性质；线线垂直关系。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.6.02",
    "name": "垂直证明",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.6",
    "sectionName": "空间直线、平面的垂直",
    "summary": "综合运用线面、面面垂直证明。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.8.6.03",
    "name": "面面垂直",
    "specialtyCode": "rjb-ch3",
    "sectionCode": "8.6",
    "sectionName": "空间直线、平面的垂直",
    "summary": "面面垂直判定与性质。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.9.1.01",
    "name": "简单随机抽样",
    "specialtyCode": "rjb-ch4",
    "sectionCode": "9.1",
    "sectionName": "随机抽样",
    "summary": "简单随机抽样的含义与实施要点。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.9.1.02",
    "name": "系统抽样与分层抽样",
    "specialtyCode": "rjb-ch4",
    "sectionCode": "9.1",
    "sectionName": "随机抽样",
    "summary": "系统抽样、分层抽样的适用场景。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.9.2.01",
    "name": "频率估计概率",
    "specialtyCode": "rjb-ch4",
    "sectionCode": "9.2",
    "sectionName": "用样本估计总体",
    "summary": "用频率稳定估计概率或总体比例。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.9.2.02",
    "name": "样本数字特征",
    "specialtyCode": "rjb-ch4",
    "sectionCode": "9.2",
    "sectionName": "用样本估计总体",
    "summary": "均值、方差、百分位数等估计总体。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.9.2.03",
    "name": "用样本估计总体分布",
    "specialtyCode": "rjb-ch4",
    "sectionCode": "9.2",
    "sectionName": "用样本估计总体",
    "summary": "频率分布直方图等。",
    "sortOrder": 30,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.9.3.01",
    "name": "回归思想",
    "specialtyCode": "rjb-ch4",
    "sectionCode": "9.3",
    "sectionName": "统计分析案例",
    "summary": "线性回归思想与相关性直观理解。",
    "sortOrder": 10,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  },
  {
    "code": "rjb.9.3.02",
    "name": "统计分析案例阅读",
    "specialtyCode": "rjb-ch4",
    "sectionCode": "9.3",
    "sectionName": "统计分析案例",
    "summary": "阅读案例中的抽样与推断逻辑。",
    "sortOrder": 20,
    "prerequisites": [],
    "qtypes": [
      "single",
      "multi",
      "judge",
      "numeric",
      "application"
    ],
    "methods": [
      "defn"
    ],
    "status": "SEED_DRAFT"
  }
]

export const allKpSeeds = [...existingInDb, ...seedsToInsert]
export const kpByCode = Object.fromEntries(allKpSeeds.map((k) => [k.code, k]))
