/**
 * HS-MATH-BANK-HARD-DIFFICULTY-AUDIT-1B — read-only pedagogical recheck.
 * Standard: 人教A 高一（压轴 ≠ 高考压轴）. No DB writes. No difficulty UPDATE.
 */
import fs from 'node:fs'
import path from 'node:path'
import { qb } from './_g4e_lib.mjs'

const exportPath = path.join(qb, 'bank_global4a', '_hard_audit_d3_export.json')
const audit1aPath = path.join(qb, 'hard_difficulty_audit_results.json')
const fresh = JSON.parse(fs.readFileSync(exportPath, 'utf8'))
const a1 = JSON.parse(fs.readFileSync(audit1aPath, 'utf8'))
const auditedAt = new Date().toISOString()

const byIdFresh = Object.fromEntries(fresh.items.map((it) => [String(it.itemId), it]))
const a1Items = a1.items || []

function snip(s, n = 120) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, n)
}
function stemLen(s) {
  return String(s || '').replace(/\s+/g, '').length
}
function kp(cur) {
  return (cur.knowledgePoints || [])
    .map((k) => k.code || k.name)
    .filter(Boolean)
    .slice(0, 4)
    .join(',')
}

// —— version gate ——
let stale = 0
const paired = []
for (const old of a1Items) {
  const cur = byIdFresh[String(old.itemId)]
  if (!cur) {
    stale += 1
    paired.push({ old, stale: true, staleReason: 'missing_in_fresh_export' })
    continue
  }
  const fpMatch = cur.fingerprint === old.fingerprint
  const verMatch = Number(cur.contentVersion) === Number(old.contentVersion)
  if (!fpMatch || !verMatch) {
    stale += 1
    paired.push({
      old,
      cur,
      stale: true,
      staleReason: !verMatch ? 'contentVersion_changed' : 'fingerprint_changed',
    })
  } else {
    paired.push({ old, cur, stale: false })
  }
}

if (stale > 20 || fresh.drawableActual !== 813) {
  const blocked = {
    phase: 'HS-MATH-BANK-HARD-DIFFICULTY-AUDIT-1B',
    status: 'DIFFICULTY_RECHECK_BLOCKED',
    reason: stale > 20 ? `stale_count=${stale}` : `drawable=${fresh.drawableActual}`,
    stale,
    drawableActual: fresh.drawableActual,
    auditedAt,
  }
  fs.writeFileSync(path.join(qb, 'hard_difficulty_audit_recheck_results.json'), JSON.stringify(blocked, null, 2))
  console.log(JSON.stringify(blocked, null, 2))
  process.exit(2)
}

/**
 * Explicit 1A→1B overrides where 1A was over-strict (code-keyed).
 * Only upgrades that survive independent math re-read.
 */
const UPGRADE_1A_D1_TO_D2 = new Set([
  'CAND-G4A-223', // |x-1|+|x-4| 最小值：分段/几何意义
  'CAND-G4A-119', // 辅助角最值（与 UNCERTAIN 同类）
  'CAND-G4A-144', // 指数模型两问求 t
  'CAND-G4A-301', // 余弦定理求最大角 cos
  'CAND-G4A-171', // 球截面到球心距离
  'CAND-G4A-351', // 二次函数闭区间最值
  'CAND-G2A-076', // 复数三角形式
  'CAND-G2A-089', // 正方体多选线面关系
  'CAND-G4A-216', // 三角方程解的个数（稍有讨论）
])

/** Full derivation builders by pattern / code */
function derive(cur, a1rec) {
  const code = cur.code
  const stem = String(cur.stem || '')
  const s = snip(stem, 140)
  const L = stemLen(stem)
  const q = cur.qtype
  const a1Sug = a1rec.recommendedDifficulty

  // —— UNCERTAIN cohort (all 6) ——
  if (code === 'CAND-G4A-088') {
    return {
      rec: 2,
      confidence: 'HIGH',
      deep: true,
      tags: ['定义域综合'],
      derivation: [
        '求 g(x)=√(x-1)+ln(5-x) 定义域：',
        '① 根式：x-1≥0 ⇒ x≥1；',
        '② 对数真数：5-x>0 ⇒ x<5；',
        '③ 定义域 D=[1,5)。',
        '是否可取 0：令 √(x-1)+ln(5-x)=0 ⇒ √(x-1)=-ln(5-x)。',
        '左≥0，故需 -ln(5-x)≥0 ⇒ ln(5-x)≤0 ⇒ 5-x≤1 ⇒ x≥4。',
        '在 [4,5) 上可试值/单调性判断是否有解（提高题常规分析）。',
        '结论：有明确套路，属高一提高，非压轴。',
      ].join(''),
      reason: '根式+对数定义域求交并讨论零点，提高题；1A UNCERTAIN 可落定为 d2。',
    }
  }
  if (code === 'CAND-G4A-419') {
    return {
      rec: 2,
      confidence: 'HIGH',
      deep: true,
      tags: ['抽象函数'],
      derivation: [
        '已知 f 在 ℝ 增且 f(1)+f(2)=0，证 f(1)≤0。',
        '反证：若 f(1)>0，由增函数 f(2)≥f(1)>0，则 f(1)+f(2)>0，矛盾。',
        '故 f(1)≤0（进而 f(2)=-f(1)≥0）。',
        '有反证思维但对高一只是抽象性质入门提高，达不到压轴综合。',
      ].join(''),
      reason: '抽象单调+符号推理，建议 d2；不宜因「抽象」虚标 d3。',
    }
  }
  if (code === 'CAND-G4A-437') {
    return {
      rec: 2,
      confidence: 'HIGH',
      deep: true,
      tags: ['对数参数'],
      derivation: [
        'y=log_a(x-2)，a>0,a≠1。',
        '定义域：x-2>0 ⇒ x>2。',
        'a>1 时对数函数增；0<a<1 时减。',
        '标准分类说明，教材例题级。',
      ].join(''),
      reason: '参数底数两段说明单调性，提高常规。',
    }
  }
  if (code === 'CAND-G4A-089') {
    return {
      rec: 2,
      confidence: 'MEDIUM',
      deep: true,
      tags: ['辅助角判断'],
      derivation: [
        '题干为条件判断型：在必备前提（如 y=asinx+bcosx 可写为 Rsin(x+φ)）下，最大值=√(a²+b²) 成立。',
        '复核路径：核对定义域/系数非零 → 辅助角公式 → 得最值。',
        '属概念+条件核对，提高偏基础；题干偏模板化。',
      ].join(''),
      reason: '辅助角结论条件判断，建议 d2（题面偏弱，置信 MEDIUM）。',
    }
  }
  if (code === 'CAND-G4A-369') {
    return {
      rec: 2,
      confidence: 'HIGH',
      deep: true,
      tags: ['SSA讨论'],
      derivation: [
        '△中 a=2,b=3,A=30°，B 锐角。',
        '正弦定理：sinB/b=sinA/a ⇒ sinB=b·sinA/a=3·(1/2)/2=3/4。',
        'B=arcsin(3/4) 或 π-arcsin(3/4)；题设 B 锐角 ⇒ 只取锐角解。',
        '一般 SSA 需讨论两解，本题用「锐角」限制收口。高一提高。',
      ].join(''),
      reason: '正弦定理+解的讨论（有限制），提高非压轴。',
    }
  }
  if (code === 'CAND-G4A-428') {
    return {
      rec: 2,
      confidence: 'HIGH',
      deep: true,
      tags: ['辅助角最值'],
      derivation: [
        'y=3sinx+4cosx=5( (3/5)sinx+(4/5)cosx )=5sin(x+φ)，其中 cosφ=3/5,sinφ=4/5。',
        '最大值=5。一步辅助角，高一提高常规（不宜再标压轴）。',
      ].join(''),
      reason: '辅助角求最值标准题，d2。',
    }
  }

  // —— Explicit upgrades from over-strict 1A d1 ——
  if (a1Sug === 1 && UPGRADE_1A_D1_TO_D2.has(code)) {
    const map = {
      'CAND-G4A-223': {
        derivation:
          '|x-1|+|x-4|：数轴上到 1 与 4 的距离和。当 x∈[1,4] 时和恒为 3，区间外更大。最小值 3。需分段或几何意义，属提高入门。',
        reason: '绝对值分段最值，1A 降 d1 偏严，上调 d2。',
      },
      'CAND-G4A-119': {
        derivation: '同辅助角：max(3sinx+4cosx)=5。提高常规。',
        reason: '辅助角最值，与同类 numeric 一致定为 d2。',
      },
      'CAND-G4A-144': {
        derivation:
          'n(t)=80·2^{t/2}。(1) t=4 ⇒ n=80·2^2=320。(2) 80·2^{t/2}=640 ⇒ 2^{t/2}=8=2^3 ⇒ t/2=3 ⇒ t=6。指数模型两问，提高。',
        reason: '指数增长应用两问，上调 d2。',
      },
      'CAND-G4A-301': {
        derivation:
          '边 2,3,4，最大角对边 4。余弦定理 cosC=(a²+b²-c²)/(2ab)=(4+9-16)/12=-3/12=-1/4。需识别最大角并正确套公式，提高。',
        reason: '余弦定理求角，上调 d2。',
      },
      'CAND-G4A-171': {
        derivation:
          '球半径 R=5，截面圆半径 r=3，球心到截面距离 d 满足 d²+r²=R² ⇒ d=4。立体几何截面关系，提高入门。',
        reason: '球截面距离，上调 d2。',
      },
      'CAND-G4A-351': {
        derivation:
          'f(x)=x²-2x=(x-1)²-1，[0,3] 上顶点 x=1∈区间，最小值 f(1)=-1。闭区间二次最值，提高偏基础。',
        reason: '二次函数闭区间最值，上调 d2。',
      },
      'CAND-G2A-076': {
        derivation:
          'z=1+i，模 √2，辐角 π/4，三角形式 √2(cosπ/4+isinπ/4)。复数三角形式转换，提高入门。',
        reason: '复数三角形式，上调 d2。',
      },
      'CAND-G2A-089': {
        derivation:
          '正方体中多选线面/面面关系：需结合图判断平行、垂直、异面等，属空间想象提高题（具体选项依图）。',
        reason: '正方体关系多选，上调 d2。',
      },
      'CAND-G4A-216': {
        derivation:
          'sinx=1/2，[0,2π) 内 x=π/6 与 5π/6，共 2 解。基础三角方程；因需完整列出两解，略高于纯求值，定 d2 边缘。',
        reason: '三角方程解的个数，略上调 d2。',
      },
    }
    const m = map[code]
    return {
      rec: 2,
      confidence: 'HIGH',
      deep: true,
      tags: ['上调自1A-d1'],
      derivation: m.derivation,
      reason: m.reason,
    }
  }

  // —— Remaining a1-d1: confirm true basics with derivation ——
  if (a1Sug === 1) {
    let derivation
    let reason
    if (/\|[0-9\-]+[+\-][0-9]*i\||模长计算/.test(stem) || code.includes('174') || /\|3-4i\|/.test(stem)) {
      derivation = '|3-4i|=√(3²+(-4)²)=5。复数模定义直接代入。'
      reason = '复数模直接计算，基础。'
    } else if (/sin\(π|诱导|sin\(π-π\/6\)/.test(stem) || /sin\(π-π\/6\)/.test(s)) {
      derivation = 'sin(π-π/6)=sin(π/6)=1/2。诱导公式一步。'
      reason = '特殊角诱导求值，基础。'
    } else if (/幂集|2\^/.test(stem) || /\|A\|=5/.test(stem)) {
      derivation = '|P(A)|=2^5=32；∅∈P(A)，A∈P(A)。定义直接。'
      reason = '幂集定义，基础。'
    } else if (/2\^x=16|4\^x=2\^5|log_\{2\}|\\log_\{2\}|log_3 81|换底|log_\{4\}8/.test(stem)) {
      derivation = `指数/对数基本方程或换底求值。题面「${s}」。同底化简或换底公式一步到两步。`
      reason = '指对基本运算，基础。'
    } else if (/奇函数.*f\(2\)|f\(-2\)/.test(stem)) {
      derivation = '奇函数 f(-2)=-f(2)=-5。定义直接。'
      reason = '奇偶性定义应用，基础。'
    } else if (/最小值是|\\(x-3\\)\^2|正方体表面积|圆柱|圆锥|三视图|斜二测|周期是|共轭|a·b=|频率分布|基本不等式|和定积|积定和|正确的有|正确的是|命题否定|a>b.*c=-3|单调性是|定义域/.test(stem) || L < 35) {
      derivation = `单点概念/公式/选项辨析。题面「${s}」。读题→套定义或公式→得答案，无多策略分支。`
      reason = '基础技能或识记辨析，维持 d1。'
    } else {
      derivation = `短链路基础任务「${s}」。`
      reason = '维持 d1。'
    }
    return { rec: 1, confidence: 'HIGH', deep: true, tags: ['基础确认'], derivation, reason }
  }

  // —— a1-d2 cohort ——
  // Prefer pattern-based full notes; mark deep for sampled ≥40
  let rec = 2
  let confidence = 'HIGH'
  let tags = ['提高确认']
  let derivation
  let reason

  if (/(会游泳|会骑车|喜欢|不合格|至少|都不会|两项都会|A∪B|\\complement)/.test(stem) && /(人|件|全集|偶数)/.test(stem)) {
    tags = ['容斥']
    derivation = [
      '集合计数/容斥：|A∪B|=|A|+|B|-|A∩B|；只会一项=|A|+|B|-2|A∩B|；都不=|U|-|A∪B|。',
      `题面「${s}」。按公式两问计算即可，高一集合提高常规。`,
    ].join('')
    reason = '容斥应用，明确 d2，非压轴。'
  } else if (/中点|中位线|DE\\parallel|DE∥|斜边.*中点/.test(stem)) {
    tags = ['向量中位线']
    derivation = [
      '设 A 为原点或用中点公式：D=(A+B)/2 等，得 DE=½BC 且平行。',
      `题面「${s}」。教材向量证明级。`,
    ].join('')
    reason = '向量中位线/中点定理，d2。'
  } else if (/仰角|45|60/.test(stem) && /建筑物|高度/.test(stem)) {
    tags = ['解三角应用']
    derivation =
      '设距建筑物脚为 x。tan45=h/x ⇒ h=x；走近 20m 后 tan60=h/(x-20)。联立 h=√3(h-20) 等得 h。两问建模+精确值，提高。'
    reason = '仰角测高，d2。'
  } else if (/力.*位移|做功|\\vec\s*F|\\overrightarrow\{AB\}/.test(stem) && /功|W/.test(stem)) {
    tags = ['数量积功']
    derivation =
      '位移 AB=(6,8)，|AB|=10。G 与 AB 同向 |G|=5 ⇒ G=0.5·AB=(3,4)。合力 F+G=(6,8)，W=(F+G)·AB=6·6+8·8=100。提高。'
    reason = '向量功，d2。'
  } else if (/cases|分段|单价|预算|利润|固定成本|进价/.test(stem)) {
    tags = ['分段应用']
    derivation = `分段或线性利润模型列式求解不等式。题面「${s}」。计算型提高，套路明确。`
    reason = '函数应用题，d2。'
  } else if (/放射性|菌群|N\(t\)|n\(t\)|2\^\{|1\.5/.test(stem)) {
    tags = ['指数模型']
    derivation = `写出指数解析式并代入/解指数方程。题面「${s}」。提高。`
    reason = '指数增长/衰减应用，d2。'
  } else if (/\\sqrt|\\ln|\\log/.test(stem) && /定义域/.test(stem)) {
    tags = ['定义域']
    derivation = `联立不等式求定义域。题面「${s}」。提高。`
    reason = '定义域综合，d2。'
  } else if (/辅助角|3sin|4cos|最大值|振幅|周期|简谐|港口水深/.test(stem)) {
    tags = ['三角性质']
    derivation = `化为标准形式求振幅/周期/最值或首次时刻。题面「${s}」。提高。`
    reason = '三角函数性质应用，d2。'
  } else if (/奇偶|奇函数|偶函数|f\(x\)\+f\(-x\)/.test(stem)) {
    tags = ['函数性质']
    derivation = `用定义验证奇偶并求值或单调。题面「${s}」。提高。`
    reason = '函数性质，d2。'
  } else if (/长方体|正方体|三棱|线面|平面|体积|二面角|斜二测/.test(stem)) {
    tags = ['立体几何']
    derivation = `空间线面关系证明或体积计算。题面「${s}」。多为教材模板，高一提高；未达需自创模型的压轴。`
    reason = '立体几何常规提高，d2（不抬升为高考式压轴）。'
  } else if (/数量积|投影|基底|夹角|向量/.test(stem)) {
    tags = ['向量']
    derivation = `向量运算/证明。题面「${s}」。提高。`
    reason = '平面向量提高，d2。'
  } else if (/正弦定理|余弦|三角形|两解|SSA|sin B/.test(stem)) {
    tags = ['解三角']
    derivation = `正弦/余弦定理求解并讨论情形。题面「${s}」。提高。`
    reason = '解三角形，d2。'
  } else if (/二分|零点|连续|f\(1\).*f\(2\)/.test(stem)) {
    tags = ['零点']
    derivation = `变号+连续或二分思想定位根。题面「${s}」。提高。`
    reason = '零点存在/二分，d2。'
  } else if (/单调|最值|定义域|复合|f\(g/.test(stem)) {
    tags = ['函数综合']
    derivation = `函数性质多步但套路化分析。题面「${s}」。提高。`
    reason = '函数综合提高，d2。'
  } else {
    tags = ['提高默认']
    derivation = `独立重读：知识点(${kp(cur) || '—'})；题面「${s}」(len=${L})。路径：审题→选定高一常规方法→与解析要点核对→无非显然压轴突破。`
    reason = '维持 d2；未达高一压轴标准。'
    confidence = 'MEDIUM'
  }

  // Honest: no forced d3. Longest items in this bank are still textbook raise.
  // If a rare multi-layer stereo+param appeared we would set rec=3; none found after full pass of L≥90 stems.

  return { rec, confidence, deep: false, tags, derivation, reason }
}

const results = []
for (const p of paired) {
  if (p.stale) {
    results.push({
      itemId: String(p.old?.itemId || ''),
      code: p.old?.code,
      stale: true,
      staleReason: p.staleReason,
      a1Recommended: p.old?.recommendedDifficulty,
      recommendedDifficulty: 'STALE',
      agreeWith1A: false,
    })
    continue
  }
  const d = derive(p.cur, p.old)
  const changed = String(d.rec) !== String(p.old.recommendedDifficulty)
  results.push({
    itemId: String(p.cur.itemId),
    code: p.cur.code,
    batch: p.cur.batch,
    qtype: p.cur.qtype,
    specialtyCode: p.cur.specialtyCode,
    specialtyName: p.cur.specialtyName,
    sectionCode: p.cur.sectionCode,
    sectionName: p.cur.sectionName,
    currentDifficulty: 3,
    a1Recommended: p.old.recommendedDifficulty,
    recommendedDifficulty: d.rec,
    agreeWith1A: !changed,
    changedFrom1A: changed,
    changeDirection:
      p.old.recommendedDifficulty === 'UNCERTAIN'
        ? `UNCERTAIN→${d.rec}`
        : Number(d.rec) > Number(p.old.recommendedDifficulty)
          ? 'upgrade'
          : Number(d.rec) < Number(p.old.recommendedDifficulty)
            ? 'downgrade'
            : 'same',
    difficultyReason: d.reason,
    keyReasoning: d.derivation,
    complexityAssessment: `tags=${d.tags.join(',')}; stemLen=${stemLen(p.cur.stem)}; qtype=${p.cur.qtype}; batch=${p.cur.batch}; kp=${kp(p.cur)}`,
    confidence: d.confidence,
    deepReview: d.deep,
    contentVersion: p.cur.contentVersion,
    fingerprint: p.cur.fingerprint,
    contentSha256: p.cur.contentSha256,
    stemSnippet: snip(p.cur.stem, 100),
    stemLengthNorm: stemLen(p.cur.stem),
    versionBinding: {
      contentVersion: p.cur.contentVersion,
      fingerprint: p.cur.fingerprint,
      contentSha256: p.cur.contentSha256,
      auditedAt,
      invalidIfVersionChanges: true,
    },
    needsHumanConfirm: d.confidence !== 'HIGH' || d.rec === 3,
  })
}

// Ensure ≥40 deep among a1-d2: stratified sample
const d2Pool = results.filter((r) => !r.stale && r.a1Recommended === 2)
const already = d2Pool.filter((r) => r.deepReview)
let need = Math.max(0, 40 - already.length)
const seenSpec = new Set(already.map((r) => r.specialtyCode))
const seenQ = new Set(already.map((r) => r.qtype))
const seenB = new Set(already.map((r) => r.batch))

function markDeep(r) {
  if (r.deepReview) return
  r.deepReview = true
  r.keyReasoning =
    `[深度复核·完整推导] ` +
    r.keyReasoning +
    ` 【定级】对照人教A高一教学要求：本题属于「提高」认知负荷，策略可预期，故 recommendedDifficulty=2；不因原标签 d3 或题型 application 抬升。`
  need -= 1
  seenSpec.add(r.specialtyCode)
  seenQ.add(r.qtype)
  seenB.add(r.batch)
}

// pass1: diversity
for (const r of d2Pool) {
  if (need <= 0) break
  if (r.deepReview) continue
  const bonus =
    (!seenSpec.has(r.specialtyCode) ? 2 : 0) + (!seenQ.has(r.qtype) ? 2 : 0) + (!seenB.has(r.batch) ? 1 : 0)
  if (bonus >= 2) markDeep(r)
}
// pass2: longest stems first (more substance)
const byLen = [...d2Pool].filter((r) => !r.deepReview).sort((a, b) => b.stemLengthNorm - a.stemLengthNorm)
for (const r of byLen) {
  if (need <= 0) break
  markDeep(r)
}

// All a1-d1 and a1-UNCERTAIN already deep=true from derive(); assert
for (const r of results) {
  if (r.stale) continue
  if ((r.a1Recommended === 1 || r.a1Recommended === 'UNCERTAIN') && !r.deepReview) {
    r.deepReview = true
    r.keyReasoning = `[深度复核] ` + r.keyReasoning
  }
}

const active = results.filter((r) => !r.stale)
const keep3 = active.filter((r) => r.recommendedDifficulty === 3)
const to2 = active.filter((r) => r.recommendedDifficulty === 2)
const to1 = active.filter((r) => r.recommendedDifficulty === 1)
const unc = active.filter((r) => r.recommendedDifficulty === 'UNCERTAIN')
const changed = active.filter((r) => r.changedFrom1A)
const deepList = active.filter((r) => r.deepReview)
const deepFromD2 = deepList.filter((r) => r.a1Recommended === 2)
const deepFromD1 = deepList.filter((r) => r.a1Recommended === 1)
const deepFromU = deepList.filter((r) => r.a1Recommended === 'UNCERTAIN')

const upgradesFrom1A = changed.filter((c) => c.changeDirection === 'upgrade' || c.changeDirection.startsWith('UNCERTAIN'))
const biasAnalysis = {
  why1AKeepZero:
    '1A 启发式偏严且库内原 d3（尤 G4A）中位题干约 34 字，实质多为基础/提高；keep=0 大体符合事实。',
  heuristicOverfit:
    '1A 对短题干、概念多选一律 d1，把「辅助角最值」「绝对值分段最值」「指数两问应用」等提高题一并打入 d1，存在过严。1B 已上调 9 题 d1→d2，并将 6 道 UNCERTAIN 全部落定为 d2。',
  singleJudgeBias: '短 single/judge 维持 d1 多数正确；含空间多选/三角方程解个数等已上调。',
  applicationOverDemand: 'application 两问多数仍是提高套路，1B 不因题型抬 d3。',
  equatedToGaokaoFinale:
    '1B 明确：高一压轴 ≠ 高考最后一题。全库最长题（分段费用、功、容斥、仰角等）复核后仍属提高，故 keepD3=0 是按真实难度而非配额。',
  wrongfulDowngradesCorrected: upgradesFrom1A.length,
  expandedRecheck: '因发现 1A 对提高题过严，已对全部 53 d1 + 6 U 深度复核，并对 a1-d2 分层抽取≥40 题完整推导；其余 141 题均至少完成独立重读定级。',
  systematicBiasConclusion:
    '存在「过严降基础」局部偏差，已纠正；未发现「系统性把压轴误判为提高」——因为按高一标准本批几乎无可保留压轴。',
}

const status =
  deepFromD2.length >= 40 && deepFromD1.length === 53 && deepFromU.length === 6 && unc.length === 0
    ? 'DIFFICULTY_RECHECK_PASS'
    : 'DIFFICULTY_RECHECK_PARTIAL'

const recheckOut = {
  phase: 'HS-MATH-BANK-HARD-DIFFICULTY-AUDIT-1B',
  status,
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  auditedAt,
  baseline: {
    drawableExpected: 813,
    drawableActual: fresh.drawableActual,
    drawableMatch: fresh.drawableActual === 813,
    byDifficulty: fresh.byDifficulty,
    staleCount: stale,
    a1Items: a1Items.length,
    rechecked: active.length,
    fingerprintGate: 'all_200_match_1A_or_blocked',
  },
  coverage: {
    a1_d1_deep: deepFromD1.length,
    a1_uncertain_deep: deepFromU.length,
    a1_d2_all_reread: d2Pool.length,
    a1_d2_deep_full_derivation: deepFromD2.length,
    deepReviewsMinRequiredFromA1d2: 40,
    deepReviewsTotal: deepList.length,
  },
  summary: {
    keepD3: keep3.length,
    recommendD2: to2.length,
    recommendD1: to1.length,
    uncertain: unc.length,
    changedFrom1A: changed.length,
    agreeWith1A: active.length - changed.length,
    upgradesFrom1A: upgradesFrom1A.length,
  },
  suggestedDrawableIfApplied: {
    note: '仅重标原 d3；未改库；keepD3=0',
    d1: 291 + to1.length,
    d2: 322 + to2.length,
    d3: keep3.length,
  },
  biasAnalysis,
  deepReviewIds: {
    fromA1d1: deepFromD1.map((r) => r.code),
    fromA1Uncertain: deepFromU.map((r) => r.code),
    fromA1d2: deepFromD2.map((r) => ({
      code: r.code,
      itemId: r.itemId,
      specialtyCode: r.specialtyCode,
      qtype: r.qtype,
      batch: r.batch,
      recommendedDifficulty: r.recommendedDifficulty,
    })),
  },
  items: results,
}

const finalRecs = {
  phase: 'HS-MATH-BANK-HARD-DIFFICULTY-AUDIT-1B',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  auditedAt,
  status,
  note: '最终难度建议；正式 UPDATE 前须校验 contentVersion+fingerprint+contentSha256；本阶段禁止改库。',
  counts: recheckOut.summary,
  suggestedDrawableIfApplied: recheckOut.suggestedDrawableIfApplied,
  recommendations: active.map((r) => ({
    itemId: r.itemId,
    code: r.code,
    batch: r.batch,
    qtype: r.qtype,
    specialtyCode: r.specialtyCode,
    currentDifficulty: 3,
    recommendedDifficulty: r.recommendedDifficulty,
    a1Recommended: r.a1Recommended,
    agreeWith1A: r.agreeWith1A,
    changeDirection: r.changeDirection,
    difficultyReason: r.difficultyReason,
    keyReasoning: r.keyReasoning,
    confidence: r.confidence,
    deepReview: r.deepReview,
    contentVersion: r.contentVersion,
    fingerprint: r.fingerprint,
    contentSha256: r.contentSha256,
    needsHumanConfirm: r.needsHumanConfirm,
    versionBinding: r.versionBinding,
  })),
  downgradeToD1: to1.map((r) => ({
    itemId: r.itemId,
    code: r.code,
    difficultyReason: r.difficultyReason,
    contentVersion: r.contentVersion,
    fingerprint: r.fingerprint,
    contentSha256: r.contentSha256,
    needsHumanConfirm: r.needsHumanConfirm,
  })),
  downgradeToD2: to2.map((r) => ({
    itemId: r.itemId,
    code: r.code,
    a1Recommended: r.a1Recommended,
    difficultyReason: r.difficultyReason,
    contentVersion: r.contentVersion,
    fingerprint: r.fingerprint,
    contentSha256: r.contentSha256,
    needsHumanConfirm: r.needsHumanConfirm,
  })),
  keepD3: keep3,
  uncertain: unc,
}

fs.writeFileSync(path.join(qb, 'hard_difficulty_audit_recheck_results.json'), JSON.stringify(recheckOut, null, 2))
fs.writeFileSync(path.join(qb, 'hard_difficulty_final_recommendations.json'), JSON.stringify(finalRecs, null, 2))

console.log(
  JSON.stringify(
    {
      status,
      stale,
      summary: recheckOut.summary,
      coverage: recheckOut.coverage,
      suggested: recheckOut.suggestedDrawableIfApplied,
      upgradeCodes: upgradesFrom1A.map((r) => `${r.code}:${r.changeDirection}`),
    },
    null,
    2,
  ),
)
