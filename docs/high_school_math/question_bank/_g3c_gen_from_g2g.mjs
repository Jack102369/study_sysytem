/**
 * Generate clean G3C runner scripts from G2G templates (one-shot).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const EXPECTED_PNG = {
  'CAND-G3A-048':
    '09cff8070df0c56b93a1214474cb537b8bf0aaf46e383f1cda5e54b1cdd7425a',
  'CAND-G3A-055':
    '663bc9abcc02629ca97d75fd5011159c71274165b90555148ca0c97de1be0a66',
  'CAND-G3A-068':
    'bf53651b03100790ae1356dfae8443d1689cb5a9575d1d644daeb9b4ae0b16af',
  'CAND-G3A-080':
    'ddded6b9b6f0272bf99b49890dfe1b62e26d15c69ac928eb466ef57d436a6ead',
  'CAND-G3A-081':
    '7ab70f1c5c885fb7d289c42233bfad135c5da28081c5c6afc59f1bc360b7c139',
  'CAND-G3A-085':
    '64a58fa3945ef85aad06dc6aff04159200f5e6448ea1318a4f5d65d1b7a1efc7',
  'CAND-G3A-086':
    '384efb58aeaaf1a991c699a763623d42ea332f04502201534955e059c1a09fe3',
}

const ALT = {
  'CAND-G3A-048': '单位圆标准位置角π-π/3示意',
  'CAND-G3A-055': '三角形SSA已知量示意',
  'CAND-G3A-068': '平行四边形对角线示意',
  'CAND-G3A-080': '圆柱叠圆锥组合体示意',
  'CAND-G3A-081': '正四面体示意',
  'CAND-G3A-085': '长方体斜线与底面示意',
  'CAND-G3A-086': '正方体中点MN示意',
}

function baseReplace(t) {
  return t
    .replaceAll('GLOBAL-2G', 'GLOBAL-3C')
    .replaceAll('CAND-G2A-', 'CAND-G3A-')
    .replaceAll('candidates-g2a-100.mjs', 'candidates-g3a-100.mjs')
    .replaceAll('_g2f_adapt_dryrun.mjs', '_g3b_adapt_dryrun.mjs')
    .replaceAll('_g2f_adapted_items.json', '_g3b_adapted_items.json')
    .replaceAll('required_g2a', 'required_g3a')
    .replaceAll('g2g_', 'g3c_')
    .replaceAll('_g2g_import_result.json', '_g3c_import_result.json')
    .replaceAll('_g2g_diagram_upload_result.json', '_g3c_diagram_upload_result.json')
    .replaceAll('_g2g_review_approve_result.json', '_g3c_review_approve_result.json')
    .replaceAll('_g2g_final_verify_ro.json', '_g3c_final_verify_ro.json')
    .replaceAll("LIKE 'CAND-G2A-%'", "LIKE 'CAND-G3A-%'")
    .replaceAll('allG2A', 'allG3A')
}

// ---- import ----
{
  let t = fs.readFileSync(path.join(__dirname, '_g2g_import_run.mjs'), 'utf8')
  t = baseReplace(t)
  t = t.replace(
    /const EXPECTED_PNG = \{[\s\S]*?\n\}/,
    'const EXPECTED_PNG = ' + JSON.stringify(EXPECTED_PNG, null, 2),
  )
  t = t.replace('if (drawable !== 113)', 'if (drawable !== 213)')
  t = t.replace('drawable expected 113', 'drawable expected 213')
  t = t.replace(
    'report.post.drawableNow === 113',
    'report.post.drawableNow === 213',
  )
  t = t.replace(
    'phase: \'HS-MATH-BANK-GLOBAL-3C-IMPORT\'',
    'phase: \'HS-MATH-BANK-GLOBAL-3C-IMPORT\'',
  )
  fs.writeFileSync(path.join(__dirname, '_g3c_import_run.mjs'), t)
  console.log('import ok', t.includes('drawable !== 213'), Object.keys(EXPECTED_PNG).length)
}

// ---- diagram ----
{
  let t = fs.readFileSync(path.join(__dirname, '_g2g_diagram_upload_run.mjs'), 'utf8')
  t = baseReplace(t)
  const expectedArr = Object.entries(EXPECTED_PNG).map(([code, sha256]) => ({
    code,
    sha256,
    altText: ALT[code],
  }))
  t = t.replace(
    /const EXPECTED = \[[\s\S]*?\]\n/,
    'const EXPECTED = ' + JSON.stringify(expectedArr, null, 2) + '\n',
  )
  t = t.replace('const [[g2a]]', 'const [[g3a]]')
  t = t.replace('g2a: Number(g2a.n)', 'g3a: Number(g3a.n)')
  t = t.replace(
    'if (Number(drawable.n) !== 113 || Number(g2a.n) !== 100)',
    'if (Number(drawable.n) !== 213 || Number(g3a.n) !== 100)',
  )
  t = t.replace(
    'baseline mismatch drawable=${drawable.n} g2a=${g2a.n}',
    'baseline mismatch drawable=${drawable.n} g3a=${g3a.n}',
  )
  t = t.replace('Number(drawable2.n) === 113', 'Number(drawable2.n) === 213')
  t = t.replace('CAND-G2A', 'CAND-G3A') // leftover comment
  fs.writeFileSync(path.join(__dirname, '_g3c_diagram_upload_run.mjs'), t)
  console.log('diagram ok', t.includes('663bc9ab'))
}

// ---- review/approve ----
{
  let t = fs.readFileSync(path.join(__dirname, '_g2g_review_approve_run.mjs'), 'utf8')
  t = baseReplace(t)
  t = t.replace(
    /const DIAG_SHA = \{[\s\S]*?\n\}/,
    'const DIAG_SHA = ' + JSON.stringify(EXPECTED_PNG, null, 2),
  )
  t = t.replace(
    /const DEEP = new Set\(\[[\s\S]*?\]\)/,
    `const DEEP = new Set([
  'CAND-G3A-045',
  'CAND-G3A-055',
  'CAND-G3A-084',
  'CAND-G3A-097',
  'CAND-G3A-015',
  'CAND-G3A-027',
  'CAND-G3A-032',
  'CAND-G3A-038',
  'CAND-G3A-041',
  'CAND-G3A-054',
  'CAND-G3A-056',
  'CAND-G3A-058',
  'CAND-G3A-087',
  'CAND-G3A-093',
  ...Object.keys(DIAG_SHA),
])`,
  )
  // replace deep math spot checks block
  t = t.replace(
    /\/\/ deep math spot checks \(author recompute\)[\s\S]*?return \{/,
    `// deep math spot checks (author recompute) — G3B fixes + difficulty linkage
  if (cand.id === 'CAND-G3A-045') {
    const ans = String(cand.answer)
    if (!ans.includes('8+') || !ans.includes('8\\\\pi')) markFail('045 answer')
    else ok('045 perimeter+area')
    if (Number(cand.difficulty) !== 2) markFail('045 d expect 2')
    else ok('045 d=2')
  }
  if (cand.id === 'CAND-G3A-055') {
    if (!String(cand.answer).includes('45') || !String(cand.answer).includes('135'))
      markFail('055 two solutions')
    else ok('055 SSA two solutions')
    if (Number(cand.difficulty) !== 3) markFail('055 d≠3')
    else ok('055 d=3')
  }
  if (cand.id === 'CAND-G3A-084') {
    if (ap?.kind !== 'judge' || ap.value !== false) markFail('084 must be false')
    else ok('084 false')
  }
  if (cand.id === 'CAND-G3A-097') {
    if (String(ap.value) !== '1/3') markFail('097 answer not 1/3')
    else ok('097 =1/3')
  }
  const expectD = {
    'CAND-G3A-015': 2,
    'CAND-G3A-038': 2,
    'CAND-G3A-054': 2,
    'CAND-G3A-056': 2,
    'CAND-G3A-093': 2,
    'CAND-G3A-027': 3,
    'CAND-G3A-032': 3,
    'CAND-G3A-041': 3,
    'CAND-G3A-058': 3,
    'CAND-G3A-087': 3,
  }
  if (expectD[cand.id] != null) {
    if (Number(cand.difficulty) !== expectD[cand.id])
      markFail(cand.id + ' difficulty linkage')
    else ok(cand.id + ' difficulty ok')
  }

  return {`,
  )
  t = t.replace(/old113Codes/g, 'oldNonBatch')
  t = t.replace('drawable0 !== 213', 'drawable0 !== 213') // may still be 113 from baseReplace of CAND only
  // fix drawable baselines that weren't changed by baseReplace
  t = t.replace(
    'if (rows.length !== 100 || drawable0 !== 113 || oldNonBatch.length !== 113)',
    'if (rows.length !== 100 || drawable0 !== 213 || oldNonBatch.length !== 213)',
  )
  // if still 113 after G2A->G3A only:
  t = t.replace(
    'if (rows.length !== 100 || drawable0 !== 113 || oldNonBatch.length !== 113)',
    'if (rows.length !== 100 || drawable0 !== 213 || oldNonBatch.length !== 213)',
  )
  t = t.replace('drawable0 !== 113', 'drawable0 !== 213')
  t = t.replace('oldNonBatch.length !== 113', 'oldNonBatch.length !== 213')
  t = t.replace(/g2aApproved/g, 'g3aApproved')
  t = t.replace(/g2aDraft/g, 'g3aDraft')
  t = t.replace(/g2aPassedReviews/g, 'g3aPassedReviews')
  t = t.replace('g2a: rows.length', 'g3a: rows.length')
  t = t.replace('oldApprovedNonG2A', 'oldApprovedNonG3A')
  t = t.replace('oldApprovedNonG3A', 'oldApprovedNonBatch')
  t = t.replace('drawable1 === 213', 'drawable1 === 313')
  t = t.replace('oldStill === 113', 'oldStill === 213')
  t = t.replace(
    'pre mismatch g2a=${rows.length}',
    'pre mismatch g3a=${rows.length}',
  )
  // comment text
  t = t.replace('GLOBAL-3C 作者侧', 'GLOBAL-3C 作者侧')
  fs.writeFileSync(path.join(__dirname, '_g3c_review_approve_run.mjs'), t)
  console.log(
    'review ok',
    t.includes('drawable0 !== 213'),
    t.includes('drawable1 === 313'),
    t.includes('CAND-G3A-045'),
  )
}

// ---- final verify ----
{
  let t = fs.readFileSync(path.join(__dirname, '_g2g_final_verify_ro.mjs'), 'utf8')
  t = baseReplace(t)
  t = t.replace(/g2aApproved/g, 'g3aApproved')
  t = t.replace(/g2aDraft/g, 'g3aDraft')
  t = t.replace(/\bg2a\b/g, 'g3a')
  t = t.replace('oldNonG2A', 'oldNonBatch')
  t = t.replace('oldNonG3A', 'oldNonBatch')
  t = t.replace(
    'candidates-g3a-100.mjs',
    'candidates-g3a-100.mjs',
  )
  fs.writeFileSync(path.join(__dirname, '_g3c_final_verify_ro.mjs'), t)
  console.log('final ok', t.includes('CAND-G3A'))
}
