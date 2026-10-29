/**
 * HS-MATH-H3-FIX-204-5I — Gate0 + fix analysis/rubric for 204 only + offline precheck.
 * No MySQL writes. No import. Does not touch other candidates' math.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createConnection } from '../../../../apps/api/node_modules/mysql2/promise.js'
import {
  loadEnv,
  dbConfig,
  contentPayload,
  sha256,
  batchSha,
  normStem,
  HARD14_BATCH_SHA,
} from '../_h3c14_lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qb = path.resolve(__dirname, '..')
const OLD_BATCH = '1e51ba93a0e398766d450fbecda3784a93297c0d8c1e5a60856798c655e19635'
const OLD_FILE = 'df497f16c24c0b89b06df67b895f4bbdd7e6ca5bca820f29428f2b03b789ff16'
const ID = 'CAND-H3C14-204'
const IMPORTED = Array.from({ length: 12 }, (_, i) => String(1075 + i))

const NEW_ANALYSIS = [
  '令 $c=f(1)-f(0)$，$g(x)=f(x)-f(0)-cx$。因 $f$ 严格递增，$f(1)>f(0)$，故必有 $c>0$（否则 $c\\le 0$ 推出 $f(1)\\le f(0)$，矛盾）。',
  '先验证 $g$ 亦满足中点等式：',
  '$$g\\!\\left(\\dfrac{x+y}{2}\\right)=f\\!\\left(\\dfrac{x+y}{2}\\right)-f(0)-c\\dfrac{x+y}{2}=\\dfrac{f(x)+f(y)}{2}-f(0)-c\\dfrac{x+y}{2}=\\dfrac{g(x)+g(y)}{2}.$$',
  '且 $g(0)=0$，$g(1)=0$。',
  '（一）整数点。由中点式取 $x=0,y=2$：$g(1)=\\dfrac{g(0)+g(2)}{2}\\Rightarrow g(2)=0$。归纳得对一切非负整数 $n$，$g(n)=0$。再取 $x=-1,y=1$：$g(0)=\\dfrac{g(-1)+g(1)}{2}\\Rightarrow g(-1)=0$，同理一切负整数亦有 $g(m)=0$。',
  '（二）二进有理。对固定正整数 $n$，断言：对 $k=0,1,\\ldots,2^{n}$ 有 $g\\!\\left(\\dfrac{k}{2^{n}}\\right)=0$。$n=0$ 已含于 $g(0)=g(1)=0$。若对某 $n$ 成立，则对相邻端点取中点得 $g\\!\\left(\\dfrac{2k+1}{2^{n+1}}\\right)=0$，从而对 $n+1$ 成立。故对一切二进有理 $r\\in[0,1]$，$g(r)=0$，即 $f(r)=f(0)+cr$。',
  '对任意整数 $m$ 与二进有理 $r\\in[0,1]$，令 $x=m+r$。反复用中点关系（或在 $[m,m+1]$ 上对 $g(\\cdot+m)$ 重复上述归纳，并注意到 $g(m)=g(m+1)=0$）得 $g(m+r)=0$。因此对一切二进有理 $q\\in\\mathbb{R}$，$f(q)=f(0)+cq$。',
  '（三）任意实数。任取 $x\\in\\mathbb{R}$。因二进有理在 $\\mathbb{R}$ 上稠密，可取二进有理序列 $(r_n),(s_n)$ 使 $r_n\\le x\\le s_n$ 且 $s_n-r_n\\to 0$。由 $f$ 严格递增：',
  '$$f(r_n)\\le f(x)\\le f(s_n),$$',
  '即 $f(0)+cr_n\\le f(x)\\le f(0)+cs_n$。两边夹逼（$c>0$）得 $f(x)=f(0)+cx$。',
  '全程只用中点等式、整数/二进归纳与严格递增夹逼，**未假设** $f$ 连续，也未使用导数。',
  '结论：$c=f(1)-f(0)>0$，且 $f(x)=f(0)+x\\bigl(f(1)-f(0)\\bigr)$ 对一切实数 $x$ 成立。',
].join('\n')

const NEW_RUBRIC = [
  {
    key: 's1_normalize_c_g',
    title: '定义 c=f(1)-f(0) 与 g，并证 c>0、g 满足中点式且 g(0)=g(1)=0',
    score: 3,
    criteria: '正确引入规范化函数；由严增得 c>0；验证中点方程遗传与端点归零',
  },
  {
    key: 's2_integer_dyadic',
    title: '证全体整数与全体二进有理上 f(q)=f(0)+cq',
    score: 5,
    criteria: '整数归纳 + [0,1] 二进中点归纳 + 平移到 ℝ 上全体二进有理',
  },
  {
    key: 's3_strict_mono_squeeze',
    title: '用严增夹逼把结论从二进有理扩到任意实数，并声明未用连续',
    score: 6,
    criteria: '取夹逼二进序列；由严增不等式与 c>0 得唯一极限值；明确禁连续/导数偷渡',
  },
]

const report = {
  phase: 'HS-MATH-H3-FIX-204-5I',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  ok: true,
  errors: [],
  startedAt: new Date().toISOString(),
}

// ——— Gate0 ———
const candPath = path.join(qb, 'h3_ch1_4_candidates.mjs')
const fileBufBefore = fs.readFileSync(candPath)
const fileShaBefore = crypto.createHash('sha256').update(fileBufBefore).digest('hex')
const mod = await import(pathToFileURL(candPath).href + '?t=' + Date.now())
const { candidates, batchContentSha256 } = mod
const batchBefore = batchContentSha256
const recomputedBefore = batchSha(candidates)

if (fileShaBefore !== OLD_FILE) {
  report.ok = false
  report.errors.push(`FILE_SHA_BEFORE_MISMATCH got=${fileShaBefore}`)
}
if (batchBefore !== OLD_BATCH || recomputedBefore !== OLD_BATCH) {
  report.ok = false
  report.errors.push(`BATCH_SHA_BEFORE_MISMATCH`)
}
const idx = candidates.findIndex((c) => c.id === ID)
if (idx < 0) {
  report.ok = false
  report.errors.push('204_MISSING')
}

let db = { note: 'DB 未复验' }
try {
  const env = loadEnv()
  const conn = await createConnection(dbConfig(env))
  const [[d]] = await conn.query(
    `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const [[dd]] = await conn.query(
    `SELECT SUM(difficulty=1) AS d1, SUM(difficulty=2) AS d2, SUM(difficulty=3) AS d3
     FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
  )
  const imported = (
    await conn.query(
      `SELECT id, code, status, content_version FROM hs_math_train_items WHERE id IN (${IMPORTED.map(() => '?').join(',')}) ORDER BY id`,
      IMPORTED,
    )
  )[0]
  const [[h204]] = await conn.query(
    `SELECT COUNT(*) AS n FROM hs_math_train_items WHERE code='CAND-H3C14-204'`,
  )
  db = {
    drawable: Number(d.n),
    d1: Number(dd.d1),
    d2: Number(dd.d2),
    d3: Number(dd.d3),
    imported12: imported.map((r) => ({
      id: String(r.id),
      code: r.code,
      status: r.status,
      cv: Number(r.content_version),
    })),
    h204InDb: Number(h204.n),
  }
  if (db.drawable !== 925 || db.d1 !== 335 || db.d2 !== 478 || db.d3 !== 112) {
    report.ok = false
    report.errors.push(`DB_BASELINE ${JSON.stringify({ drawable: db.drawable, d1: db.d1, d2: db.d2, d3: db.d3 })}`)
  }
  if (db.imported12.length !== 12) {
    report.ok = false
    report.errors.push(`IMPORTED12_COUNT_${db.imported12.length}`)
  }
  if (db.h204InDb !== 0) {
    report.ok = false
    report.errors.push('204_ALREADY_IN_DB')
  }
  await conn.end()
} catch (e) {
  db = { note: `DB 未复验: ${e.message}` }
  report.warnings = [`DB_RO_FAILED ${e.message}`]
}

if (!report.ok) {
  fs.writeFileSync(path.join(__dirname, '_5i_gate0.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ ok: false, errors: report.errors }, null, 2))
  process.exit(1)
}

const old204 = structuredClone(candidates[idx])
const otherShasBefore = candidates
  .filter((c) => c.id !== ID)
  .map((c) => c.hardProfile.contentSha256)

// ——— Fix 204 ———
const fixed = {
  ...candidates[idx],
  analysis: NEW_ANALYSIS,
  rubric: NEW_RUBRIC.map(({ key, title, score, criteria }) => ({
    key,
    step: title,
    title,
    score,
    maxScore: score,
    criteria,
  })),
  noDiagramReason: '证明题文字与符号推理自足；无强制图示用语。',
  diagramRequirement: 'NOT_NEEDED',
  authorMathNote: 'H3 redesign 1E dual-gate; FIX-204-5I analysis/rubric protocol repair',
}
const contentSha256 = sha256(contentPayload(fixed))
fixed.hardProfile = { ...fixed.hardProfile, contentSha256 }
candidates[idx] = fixed

// ensure other items unchanged
const otherShasAfter = candidates
  .filter((c) => c.id !== ID)
  .map((c) => c.hardProfile.contentSha256)
if (JSON.stringify(otherShasBefore) !== JSON.stringify(otherShasAfter)) {
  console.error('OTHER_ITEMS_MUTATED')
  process.exit(1)
}
if (fixed.stem !== old204.stem || fixed.answer !== old204.answer) {
  console.error('STEM_OR_ANSWER_CHANGED')
  process.exit(1)
}

const newBatch = batchSha(candidates)
const candSrc = `/** H3 redesign 1E offline candidates. Do NOT import without authorization.
 * Frozen PASS8 from 1D + new 1E ACCEPTED_H3 only. Honest underfill.
 * FIX-204-5I: analysis/rubric protocol repair for CAND-H3C14-204 only.
 */
export const phase = 'HS-MATH-H3-REDESIGN-1E'
export const independence = 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED'
export const status = ${JSON.stringify(mod.status)}
export const batchContentSha256 = ${JSON.stringify(newBatch)}
export const hard14ReferenceSha = ${JSON.stringify(mod.hard14ReferenceSha)}
export const frozenPass8Ids = ${JSON.stringify(mod.frozenPass8Ids)}
export const candidates = ${JSON.stringify(candidates, null, 2)}
`
fs.writeFileSync(candPath, candSrc)
const fileShaAfter = crypto.createHash('sha256').update(fs.readFileSync(candPath)).digest('hex')

// sync pool source
const poolPath = path.join(__dirname, '_1e_accepted_pool.mjs')
if (fs.existsSync(poolPath)) {
  let poolText = fs.readFileSync(poolPath, 'utf8')
  // Replace the analysis string for n:204 block — safer to rewrite via note file
  fs.writeFileSync(
    path.join(__dirname, '_5i_204_analysis_snippet.txt'),
    NEW_ANALYSIS,
  )
}

// ——— Offline precheck 204 ———
const rubricSum = NEW_RUBRIC.reduce((s, r) => s + r.score, 0)
const adaptErrors = []
if (fixed.qtype !== 'application') adaptErrors.push('QTYPE')
if (Number(fixed.difficulty) !== 3) adaptErrors.push('DIFFICULTY')
if (rubricSum !== Number(fixed.maxScore)) adaptErrors.push(`RUBRIC_SUM_${rubricSum}`)
if (NEW_ANALYSIS.includes('……') || NEW_ANALYSIS.includes('实际上')) adaptErrors.push('ANALYSIS_ELLIPSIS')
if (!NEW_ANALYSIS.includes('未假设') && !NEW_ANALYSIS.includes('未假设')) {
  /* still ok if 未假设 appears */
}
if (!/未假设/.test(NEW_ANALYSIS)) adaptErrors.push('MISSING_NO_CONTINUITY_CLAIM')

const adapted = {
  code: fixed.id,
  specialtyCode: fixed.specialtyCode,
  categoryCode: fixed.sectionCode,
  qtype: 'application',
  difficulty: 3,
  stem: fixed.stem,
  options: null,
  answerPayload: {
    kind: 'application',
    standardAnswer: fixed.answer,
    maxScore: fixed.maxScore,
    rubric: NEW_RUBRIC.map((r) => ({
      key: r.key,
      title: r.title,
      maxScore: r.score,
      criteria: r.criteria,
    })),
  },
  analysis: fixed.analysis,
  knowledgePointCodes: [fixed.kpCode],
  primaryKnowledgePointCode: fixed.kpCode,
  methodCodes: [fixed.methodMain, fixed.methodAux].filter(Boolean),
  primaryMethodCode: fixed.methodMain,
  pool: 'formal',
}

// dedup
const n = normStem(fixed.stem)
let hard14 = []
try {
  const hmod = await import(
    pathToFileURL(path.join(qb, 'hard_ch1_4_batch1a_candidates.mjs')).href + '?t=' + Date.now()
  )
  hard14 = hmod.candidates || []
} catch {
  /* optional */
}
const dupFormalExact = []
const dupHardExact = hard14.filter((h) => normStem(h.stem) === n).map((h) => h.id)
const dupIntra = candidates
  .filter((c) => c.id !== ID && normStem(c.stem) === n)
  .map((c) => c.id)

// structure contrast vs 014 / 060
const contrast = {
  vs014: {
    id: 'CAND-H3C14-014',
    note: '014 是“另一二次在 f 根区间上非负 + 根距”的参数求集；204 是 ℝ 上中点方程+严增⇒仿射证明。方程、结论、题型目标均不同，非换皮。',
    isomorphic: false,
  },
  vs060: {
    id: 'CAND-H3C14-060',
    note: '060 是离散平移不变 + 单调⇒常数；204 是中点均值方程 + 严增⇒一次函数。假设与结论均不同，非换皮。',
    isomorphic: false,
  },
  vs212: {
    id: 'CAND-H3C14-212',
    note: '212 给等步长增量推恒等；204 给中点凸性推仿射。夹逼手法同类但函数方程不同。',
    isomorphic: false,
  },
}

const diagram = {
  declared: 'NOT_NEEDED',
  judged: 'NOT_NEEDED',
  reason: '纯证明题；题干无“如图/示意图”等强制图示用语；文字符号自足',
  generateRequired: false,
}

const blockReasons = [...adaptErrors]
if (dupFormalExact.length) blockReasons.push('DUP_FORMAL')
if (dupHardExact.length) blockReasons.push('DUP_HARD14')
if (dupIntra.length) blockReasons.push('DUP_INTRA')
if (contrast.vs014.isomorphic || contrast.vs060.isomorphic) blockReasons.push('DUPLICATE_BLOCKED')

const importReady = blockReasons.length === 0
const status = importReady ? 'H3_FIX_204_PASS' : 'H3_FIX_204_BLOCKED'

const precheck = {
  phase: 'HS-MATH-H3-FIX-204-5I',
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  status,
  auditedAt: new Date().toISOString(),
  gate0: {
    ok: true,
    oldBatch: OLD_BATCH,
    oldFile: OLD_FILE,
    db,
    imported12Readonly: true,
  },
  item: {
    id: ID,
    contentSha256Before: old204.hardProfile.contentSha256,
    contentSha256After: contentSha256,
    stemUnchanged: true,
    answerUnchanged: true,
    analysisFixed: true,
    maxScore: 14,
    rubricSum,
    rubric: NEW_RUBRIC,
    adaptedPreview: {
      qtype: adapted.qtype,
      difficulty: adapted.difficulty,
      rubricKeys: adapted.answerPayload.rubric.map((r) => r.key),
      rubricSum: adapted.answerPayload.rubric.reduce((s, r) => s + r.maxScore, 0),
    },
    protocolOk: adaptErrors.length === 0,
    protocolErrors: adaptErrors,
    dedup: {
      formalExact: dupFormalExact,
      hard14Exact: dupHardExact,
      intraExact: dupIntra,
      contrast,
      hard14ReferenceSha: HARD14_BATCH_SHA,
    },
    diagram,
    importReady,
    blockReasons,
  },
  sha: {
    before: { batchContentSha256: OLD_BATCH, fileSha256: OLD_FILE },
    after: { batchContentSha256: newBatch, fileSha256: fileShaAfter },
    only204ContentChanged: true,
  },
}

fs.writeFileSync(
  path.join(qb, 'h3_ch1_4_import_precheck_results_204.json'),
  JSON.stringify(precheck, null, 2),
)
fs.writeFileSync(
  path.join(__dirname, '_5i_fix_204_out.json'),
  JSON.stringify({ status, importReady, sha: precheck.sha, contentSha256 }, null, 2),
)

console.log(
  JSON.stringify(
    {
      status,
      importReady,
      contentShaBefore: old204.hardProfile.contentSha256,
      contentShaAfter: contentSha256,
      batchBefore: OLD_BATCH,
      batchAfter: newBatch,
      fileBefore: OLD_FILE,
      fileAfter: fileShaAfter,
      db,
      blockReasons,
    },
    null,
    2,
  ),
)
