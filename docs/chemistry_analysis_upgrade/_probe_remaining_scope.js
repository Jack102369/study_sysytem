'use strict'
const fs = require('fs')
const path = require('path')
const { openDb, isS60 } = require('./lib_common')

async function main() {
  const b1 = new Set(
    JSON.parse(
      fs.readFileSync(path.join(__dirname, 'first_update_whitelist.json'), 'utf8'),
    ).items.map((x) => String(x.id)),
  )
  const b2 = new Set(
    JSON.parse(
      fs.readFileSync(path.join(__dirname, 'batch2/update_whitelist.json'), 'utf8'),
    ).items.map((x) => String(x.id)),
  )
  const { conn } = await openDb()
  const [rows] = await conn.query(
    `SELECT i.id, i.code, i.difficulty, i.gate_note, i.analysis, i.stem,
            s.code AS sp, c.code AS cat
     FROM chem_train_items i
     JOIN chem_specialties s ON s.id=i.specialty_id
     JOIN chem_categories c ON c.id=i.category_id
     WHERE i.pool='test' AND i.status='approved' AND i.is_active=1`,
  )
  const isBlock = (r) => /\[trial_access:block\]/i.test(String(r.gate_note || ''))
  let trainable = 0
  let s60 = 0
  let blocked = 0
  let upgraded = 0
  const remain = []
  const hold4 = []
  for (const r of rows) {
    const id = String(r.id)
    if (isS60(r)) {
      s60++
      continue
    }
    if (isBlock(r)) {
      blocked++
      continue
    }
    trainable++
    if (b1.has(id) || b2.has(id)) {
      upgraded++
      continue
    }
    remain.push(r)
    if (['50', '379', '398', '401'].includes(id)) {
      hold4.push({
        id,
        code: r.code,
        sp: r.sp,
        cat: r.cat,
        diff: r.difficulty,
        stemPreview: String(r.stem || '').slice(0, 80),
        analysisPreview: String(r.analysis || '').slice(0, 80),
      })
    }
  }
  const bySp = {}
  const byDiff = {}
  const byCat = new Set()
  let sourceish = 0
  for (const r of remain) {
    bySp[r.sp] = (bySp[r.sp] || 0) + 1
    byDiff[r.difficulty] = (byDiff[r.difficulty] || 0) + 1
    byCat.add(`${r.sp}.${r.cat}`)
    const a = String(r.analysis || '').trim()
    if (/^来源\s/.test(a) || /字段\s/.test(a) || /「易错」标注/.test(a)) sourceish++
  }
  console.log(
    JSON.stringify(
      {
        bankTestApprovedActive: rows.length,
        trainableNoS60NoBlock: trainable,
        s60,
        blocked,
        upgradedMatchedWhitelists: upgraded,
        b1Size: b1.size,
        b2Size: b2.size,
        remainingCandidates: remain.length,
        remainingCategoryPairs: byCat.size,
        hold4InRemain: hold4,
        bySp,
        byDiff,
        sourceishAmongRemain: sourceish,
        identityCheck: {
          trainablePlusBlockedPlusS60: trainable + blocked + s60,
          upgradedPlusRemain: upgraded + remain.length,
        },
      },
      null,
      2,
    ),
  )
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
