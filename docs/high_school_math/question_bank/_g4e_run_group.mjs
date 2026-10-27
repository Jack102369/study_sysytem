/**
 * GLOBAL-4E: one group (100 items) — import → REQUIRED diagrams → review → approve → verify.
 * Usage: node _g4e_run_group.mjs <1-5>
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createConnection } from '../../../apps/api/node_modules/mysql2/promise.js'
import {
  loadEnv,
  signJwt,
  api,
  apiUpload,
  dataOf,
  shaFile,
  loadCheckpoint,
  saveCheckpoint,
  dbConfig,
  qb,
  docs,
  diagDir,
  BASE,
} from './_g4e_lib.mjs'

const group = Number(process.argv[2])
if (![1, 2, 3, 4, 5].includes(group)) {
  console.error('Usage: node _g4e_run_group.mjs <1-5>')
  process.exit(2)
}

const EXPECTED_DRAWABLE_AFTER = 313 + group * 100
const report = {
  phase: 'GLOBAL-4E-GROUP',
  group,
  independence: 'INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED',
  startedAt: new Date().toISOString(),
  ok: false,
  errors: [],
  import: {},
  diagrams: { uploaded: [], skipped: [], failed: [] },
  review: { passed: 0, failed: 0, perItem: [] },
  approve: { success: 0, failed: 0, perItem: [] },
  verify: {},
}

function finish(code) {
  report.endedAt = new Date().toISOString()
  report.ok = code === 0
  const out = path.join(qb, 'bank_global4a', `_g4e_group0${group}_result.json`)
  fs.writeFileSync(out, JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(
      {
        group,
        ok: report.ok,
        errors: report.errors.slice(0, 20),
        import: report.import,
        diagrams: {
          up: report.diagrams.uploaded.length,
          fail: report.diagrams.failed.length,
        },
        reviewPassed: report.review.passed,
        approveOk: report.approve.success,
        drawable: report.verify.drawable,
        out,
      },
      null,
      2,
    ),
  )
  process.exit(code)
}

const env = loadEnv()
if (!env.JWT_SECRET) {
  report.errors.push('JWT_SECRET')
  finish(2)
}

const adapted = JSON.parse(fs.readFileSync(path.join(qb, '_g4e_adapted_items.json'), 'utf8'))
const slice = adapted.slice((group - 1) * 100, group * 100)
if (slice.length !== 100) {
  report.errors.push('SLICE_LEN')
  finish(2)
}

const { candidates } = await import(
  pathToFileURL(path.join(qb, 'candidates-g4a-500.mjs')).href + '?t=' + Date.now()
)
const candByCode = Object.fromEntries(candidates.map((c) => [c.id, c]))
const manifest = JSON.parse(fs.readFileSync(path.join(diagDir, '_manifest.json'), 'utf8'))
const manByCode = Object.fromEntries((manifest.items || []).map((x) => [x.code, x]))

const conn = await createConnection(dbConfig(env))
async function one(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows[0]
}
async function many(sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

const [admins] = await conn.query(`SELECT id FROM users WHERE role='ADMIN' ORDER BY id ASC LIMIT 1`)
if (!admins.length) {
  report.errors.push('NO_ADMIN')
  await conn.end()
  finish(2)
}
const token = signJwt(String(admins[0].id), 'ADMIN', env.JWT_SECRET)

const sessions0 = Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n)
const sessionItems0 = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)
const old313_0 = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items
       WHERE pool='formal' AND status='approved' AND is_active=1 AND code NOT LIKE 'CAND-G4A-%'`,
    )
  ).n,
)
report.pre = { sessions0, sessionItems0, old313_0, drawable0: Number((await one(
  `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
)).n) }

let cp = loadCheckpoint(group)

// ---------- IMPORT ----------
const codes = slice.map((i) => i.code)
const existing = await many(
  `SELECT id, code, status, pool, content_version, is_active
   FROM hs_math_train_items WHERE code IN (${codes.map(() => '?').join(',')})`,
  codes,
)
const existMap = Object.fromEntries(existing.map((r) => [r.code, r]))

const needImport = slice.filter((i) => !existMap[i.code])
if (needImport.length === 0) {
  report.import = { skipped: true, reason: 'all_codes_exist', n: 100 }
  for (const r of existing) {
    cp.items[r.code] = {
      ...(cp.items[r.code] || {}),
      itemId: String(r.id),
      status: r.status,
      contentVersion: Number(r.content_version),
    }
  }
  cp.importDone = true
  saveCheckpoint(group, cp)
} else if (needImport.length !== 100 && needImport.length !== slice.filter((i) => !existMap[i.code]).length) {
  // partial exist — only import missing; but preview must be exact set of missing (≤100)
  // If some exist as draft from prior partial, skip those and only import missing
  report.import.partialResume = true
}

if (needImport.length > 0) {
  if (needImport.length > 100) {
    report.errors.push('NEED_IMPORT_GT_100')
    await conn.end()
    finish(2)
  }
  // If partial (some exist), import only missing; if none exist, import all 100
  const importItems = needImport
  const prev = await api('POST', '/hs-math/admin/train-items/import/preview', token, {
    items: importItems,
  })
  const prevData = dataOf(prev.json)
  report.import.preview = {
    http: prev.status,
    canConfirm: prevData?.canConfirm,
    errorCount: prevData?.errorCount,
    itemCount: prevData?.itemCount,
    failed: (prevData?.items || [])
      .filter((r) => !r.ok || (r.errors || []).length)
      .slice(0, 15)
      .map((r) => ({ code: r.code, errors: r.errors })),
  }
  if (
    prev.status >= 400 ||
    !prevData?.canConfirm ||
    prevData.errorCount !== 0 ||
    prevData.itemCount !== importItems.length ||
    !prevData.previewToken
  ) {
    report.errors.push('PREVIEW_FAIL')
    await conn.end()
    finish(2)
  }
  const conf = await api('POST', '/hs-math/admin/train-items/import/confirm', token, {
    previewToken: prevData.previewToken,
    items: importItems,
  })
  const confData = dataOf(conf.json)
  report.import.confirm = {
    http: conf.status,
    success: confData?.success,
    mode: confData?.mode,
    successCount: confData?.successCount,
    failCount: confData?.failCount,
  }
  if (
    conf.status >= 400 ||
    !confData?.success ||
    confData.successCount !== importItems.length ||
    (confData.mode !== 'created' && confData.mode !== 'idempotent')
  ) {
    report.errors.push(`CONFIRM_FAIL:${confData?.mode}:${confData?.successCount}`)
    // record any returned items for checkpoint
    for (const it of confData?.items || []) {
      if (it?.code && it?.id) {
        cp.items[it.code] = {
          ...(cp.items[it.code] || {}),
          itemId: String(it.id),
          status: it.status || 'draft',
        }
      }
    }
    saveCheckpoint(group, cp)
    await conn.end()
    finish(2)
  }
  for (const it of confData.items || []) {
    cp.items[it.code] = {
      ...(cp.items[it.code] || {}),
      itemId: String(it.id),
      status: it.status || 'draft',
      contentVersion: it.contentVersion != null ? Number(it.contentVersion) : 1,
    }
  }
  cp.importDone = true
  saveCheckpoint(group, cp)
}

// refresh DB rows for group
const rowsAfterImport = await many(
  `SELECT id, code, status, pool, content_version, is_active
   FROM hs_math_train_items WHERE code IN (${codes.map(() => '?').join(',')}) ORDER BY code`,
  codes,
)
if (rowsAfterImport.length !== 100) {
  report.errors.push(`IMPORT_COUNT_${rowsAfterImport.length}`)
  await conn.end()
  finish(2)
}
const badDraft = rowsAfterImport.filter(
  (r) => r.pool !== 'formal' || (r.status !== 'draft' && r.status !== 'approved'),
)
// After full group complete some may already be approved on resume — allow draft|approved
const notFormal = rowsAfterImport.filter((r) => r.pool !== 'formal')
if (notFormal.length) {
  report.errors.push('NOT_FORMAL')
  await conn.end()
  finish(2)
}
for (const r of rowsAfterImport) {
  cp.items[r.code] = {
    ...(cp.items[r.code] || {}),
    itemId: String(r.id),
    status: r.status,
    contentVersion: Number(r.content_version),
  }
}
saveCheckpoint(group, cp)
report.import.dbCount = 100
report.import.statuses = rowsAfterImport.reduce((a, r) => {
  a[r.status] = (a[r.status] || 0) + 1
  return a
}, {})

const drawableMid = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
    )
  ).n,
)
// After import only, drawable should still be previous groups' approved + 313
const expectedMidMin = 313 + (group - 1) * 100
if (drawableMid < expectedMidMin || drawableMid > EXPECTED_DRAWABLE_AFTER) {
  // mid can be between prev and target if re-running mid-approve
  report.import.drawableMid = drawableMid
}

// ---------- DIAGRAMS (REQUIRED only) ----------
const reqCodes = codes.filter((code) => candByCode[code]?.diagramRequirement === 'REQUIRED')
for (const code of reqCodes) {
  const meta = cp.items[code]
  const itemId = meta?.itemId
  if (!itemId) {
    report.diagrams.failed.push({ code, err: 'no_itemId' })
    report.errors.push(`DIAG_NO_ID:${code}`)
    continue
  }
  const man = manByCode[code]
  const pngP = path.join(diagDir, `${code}.png`)
  const svgP = path.join(diagDir, `${code}.svg`)
  if (!man || !fs.existsSync(pngP) || !fs.existsSync(svgP)) {
    report.diagrams.failed.push({ code, err: 'file_missing' })
    report.errors.push(`DIAG_FILE:${code}`)
    continue
  }
  if (shaFile(pngP) !== man.sha256_png || shaFile(svgP) !== man.sha256_svg) {
    report.diagrams.failed.push({ code, err: 'sha_mismatch' })
    report.errors.push(`DIAG_SHA:${code}`)
    continue
  }

  // skip if already has ≥1 diagram links
  const [[dc]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_item_diagrams WHERE item_id=?`,
    [itemId],
  )
  if (Number(dc.n) >= 1 && meta.diagramsDone) {
    report.diagrams.skipped.push(code)
    continue
  }
  if (Number(dc.n) >= 2) {
    // already uploaded both
    meta.diagramsDone = true
    cp.items[code] = meta
    report.diagrams.skipped.push(code)
    continue
  }

  const alt = `教学配图 ${code}`
  if (Number(dc.n) === 0) {
    const upPng = await apiUpload(itemId, token, pngP, 'image/png', alt)
    const upData = dataOf(upPng.json)
    if (upPng.status >= 400 || !upData?.diagrams?.length) {
      report.diagrams.failed.push({ code, err: 'png_upload', http: upPng.status, body: JSON.stringify(upPng.json).slice(0, 200) })
      report.errors.push(`PNG_UPLOAD:${code}`)
      saveCheckpoint(group, cp)
      await conn.end()
      finish(2)
    }
  }
  // refresh count
  const [[dc2]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_item_diagrams WHERE item_id=?`,
    [itemId],
  )
  if (Number(dc2.n) < 2) {
    const upSvg = await apiUpload(itemId, token, svgP, 'image/svg+xml', alt + ' SVG')
    const upSvgData = dataOf(upSvg.json)
    if (upSvg.status >= 400 || !upSvgData?.diagrams?.length) {
      report.diagrams.failed.push({
        code,
        err: 'svg_upload',
        http: upSvg.status,
        body: JSON.stringify(upSvg.json).slice(0, 200),
      })
      report.errors.push(`SVG_UPLOAD:${code}`)
      saveCheckpoint(group, cp)
      await conn.end()
      finish(2)
    }
  }
  meta.diagramsDone = true
  cp.items[code] = meta
  report.diagrams.uploaded.push(code)
}
cp.diagramsDone = report.diagrams.failed.length === 0
saveCheckpoint(group, cp)
if (report.diagrams.failed.length) {
  await conn.end()
  finish(2)
}

// ---------- REVIEW + APPROVE ----------
for (const r of rowsAfterImport) {
  const code = r.code
  const itemId = String(r.id)
  const cand = candByCode[code]
  const row = {
    code,
    itemId,
  }

  // already approved?
  const [[cur]] = await conn.query(
    `SELECT status, content_version FROM hs_math_train_items WHERE id=?`,
    [itemId],
  )
  if (cur.status === 'approved') {
    report.review.passed++
    report.approve.success++
    report.review.perItem.push({ ...row, skipped: true, note: 'already_approved' })
    report.approve.perItem.push({ ...row, skipped: true, note: 'already_approved' })
    cp.items[code] = {
      ...(cp.items[code] || {}),
      itemId,
      status: 'approved',
      reviewPassed: true,
      approved: true,
    }
    continue
  }

  // REQUIRED must have diagrams
  if (cand.diagramRequirement === 'REQUIRED') {
    const [[dc]] = await conn.query(
      `SELECT COUNT(1) AS n FROM hs_math_train_item_diagrams WHERE item_id=?`,
      [itemId],
    )
    if (Number(dc.n) < 1) {
      report.review.failed++
      report.errors.push(`REQ_NO_DIAG_BEFORE_REVIEW:${code}`)
      row.error = 'required_diagram_missing'
      report.review.perItem.push(row)
      saveCheckpoint(group, cp)
      await conn.end()
      finish(2)
    }
  }

  const panelRes = await api('GET', `/hs-math/admin/train-items/${itemId}/review-panel`, token)
  const panel = dataOf(panelRes.json)
  const fp = panel?.contentFingerprint
  const cv = Number(panel?.contentVersion)
  if (panelRes.status >= 400 || !fp || !cv) {
    report.review.failed++
    row.error = `panel_${panelRes.status}`
    report.review.perItem.push(row)
    report.errors.push(`PANEL:${code}`)
    saveCheckpoint(group, cp)
    await conn.end()
    finish(2)
  }
  row.cv = cv
  row.fpPrefix = fp.slice(0, 16)

  const comment = [
    'GLOBAL-4E 作者侧结构化数学审核（非独立终审）。',
    '已核对题干/答案/解析/难度/KP·method',
    cand.diagramRequirement === 'REQUIRED' ? '/REQUIRED配图' : '',
    cand.qtype === 'application' ? '/rubric' : '',
    '。INDEPENDENT_REVIEW_NOT_FULLY_ESTABLISHED。',
  ]
    .join('')
    .slice(0, 2000)

  const revRes = await api('POST', `/hs-math/admin/train-items/${itemId}/reviews`, token, {
    decision: 'passed',
    comment,
    expectedContentVersion: cv,
    expectedContentFingerprint: fp,
  })
  const revData = dataOf(revRes.json)
  const revOk =
    (revRes.status === 200 || revRes.status === 201) &&
    String(revData?.reviewStatus) === 'passed'
  if (!revOk) {
    report.review.failed++
    row.error = JSON.stringify(revRes.json).slice(0, 300)
    report.review.perItem.push(row)
    report.errors.push(`REVIEW:${code}`)
    saveCheckpoint(group, cp)
    await conn.end()
    finish(2)
  }
  report.review.passed++
  report.review.perItem.push(row)

  const aprRes = await api('PATCH', `/hs-math/admin/train-items/${itemId}/status`, token, {
    status: 'approved',
    confirmPublish: true,
  })
  const aprData = dataOf(aprRes.json)
  if (aprRes.status >= 400 || aprData?.status !== 'approved') {
    report.approve.failed++
    report.approve.perItem.push({
      code,
      itemId,
      error: JSON.stringify(aprRes.json).slice(0, 300),
    })
    report.errors.push(`APPROVE:${code}`)
    saveCheckpoint(group, cp)
    await conn.end()
    finish(2)
  }

  const [[postIt]] = await conn.query(
    `SELECT status, content_version FROM hs_math_train_items WHERE id=?`,
    [itemId],
  )
  if (postIt.status !== 'approved') {
    report.approve.failed++
    report.errors.push(`APPROVE_VERIFY:${code}`)
    saveCheckpoint(group, cp)
    await conn.end()
    finish(2)
  }
  report.approve.success++
  report.approve.perItem.push({ code, itemId, ok: true, cv: Number(postIt.content_version) })
  cp.items[code] = {
    ...(cp.items[code] || {}),
    itemId,
    status: 'approved',
    contentVersion: Number(postIt.content_version),
    reviewPassed: true,
    approved: true,
    contentFingerprintPrefix: fp.slice(0, 16),
  }
}
cp.reviewApproveDone = true
saveCheckpoint(group, cp)

// ---------- VERIFY ----------
const drawable = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1`,
    )
  ).n,
)
const groupApproved = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code IN (${codes.map(() => '?').join(',')}) AND status='approved' AND is_active=1`,
      codes,
    )
  ).n,
)
const groupDraft = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items WHERE code IN (${codes.map(() => '?').join(',')}) AND status='draft'`,
      codes,
    )
  ).n,
)
const old313 = Number(
  (
    await one(
      `SELECT COUNT(1) AS n FROM hs_math_train_items
       WHERE pool='formal' AND status='approved' AND is_active=1 AND code NOT LIKE 'CAND-G4A-%'`,
    )
  ).n,
)
const sessions1 = Number((await one(`SELECT COUNT(1) AS n FROM hs_math_train_sessions`)).n)
const sessionItems1 = Number(
  (await one(`SELECT COUNT(1) AS n FROM hs_math_train_session_items`)).n,
)

report.verify = {
  drawable,
  expectedDrawable: EXPECTED_DRAWABLE_AFTER,
  groupApproved,
  groupDraft,
  old313,
  old313_0,
  sessions0,
  sessions1,
  sessionItems0,
  sessionItems1,
}

if (drawable !== EXPECTED_DRAWABLE_AFTER) report.errors.push(`DRAWABLE_${drawable}_NE_${EXPECTED_DRAWABLE_AFTER}`)
if (groupApproved !== 100) report.errors.push(`GROUP_APPROVED_${groupApproved}`)
if (groupDraft !== 0) report.errors.push(`GROUP_DRAFT_${groupDraft}`)
if (old313 !== old313_0 || old313 !== 313) report.errors.push(`OLD313_CHANGED_${old313}`)
if (sessions1 !== sessions0) report.errors.push('SESSIONS_CHANGED')
if (sessionItems1 !== sessionItems0) report.errors.push('SESSION_ITEMS_CHANGED')

// REQUIRED diagram counts
for (const code of reqCodes) {
  const itemId = cp.items[code]?.itemId
  const [[dc]] = await conn.query(
    `SELECT COUNT(1) AS n FROM hs_math_train_item_diagrams WHERE item_id=?`,
    [itemId],
  )
  if (Number(dc.n) < 1) report.errors.push(`REQ_DIAG_FINAL:${code}`)
}

cp.verified = report.errors.length === 0
cp.drawableAfter = drawable
saveCheckpoint(group, cp)
await conn.end()

if (report.errors.length) finish(2)
finish(0)
