/**
 * 将明确的「化学式填空」试运行题标记为 answer_type=chem_formula。
 * 不改正文知识、不改历史 grade_result。
 *
 *   node docs/chemistry_trial_restore/mark_chem_formula_answers.js
 */
'use strict'
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  // ensure column exists
  const [cols] = await conn.query(
    `SHOW COLUMNS FROM chem_train_items LIKE 'answer_type'`,
  )
  if (!cols.length) {
    console.error('answer_type missing — run migrate first')
    process.exit(1)
  }

  const [blanks] = await conn.query(
    `SELECT id, code, stem, answer FROM chem_train_items
     WHERE qtype='blank' AND (code LIKE 'train.ai_trial.%' OR code LIKE 'train.test.%')`,
  )

  const formulaLike = /^[A-Z][a-z]?(?:\d|[A-Z]|\(|\))*$/
  let marked = 0
  const markedCodes = []
  for (const row of blanks) {
    const ans = String(row.answer || '').trim()
    const stem = String(row.stem || '')
    const looksFormula =
      formulaLike.test(ans.replace(/[₀-₉]/g, (d) => '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(d)])) ||
      /化学式/.test(stem)
    // 明确化学式题：答案是合法简式，或题干预含「化学式」
    const simple =
      /^(?:[A-Z][a-z]?\d*)+(?:\((?:[A-Z][a-z]?\d*)+\)\d*)*$/.test(ans) ||
      ans === 'H2O' ||
      ans === 'NaCl' ||
      ans === 'O'
    // O alone is element symbol — also chem_formula for symbol blanks
    if (!looksFormula && !simple && !/化学式/.test(stem) && !/元素符号/.test(stem)) {
      continue
    }
    if (/元素符号/.test(stem) || ans.length <= 3 && /^[A-Z][a-z]?$/.test(ans)) {
      // 元素符号也用化学式规则（大小写严格、无下标时等价）
      await conn.query(
        `UPDATE chem_train_items SET answer_type='chem_formula' WHERE id=?`,
        [row.id],
      )
      marked++
      markedCodes.push(row.code)
      continue
    }
    if (/化学式/.test(stem) || simple) {
      await conn.query(
        `UPDATE chem_train_items SET answer_type='chem_formula' WHERE id=?`,
        [row.id],
      )
      marked++
      markedCodes.push(row.code)
    }
  }

  const [[{ n }]] = await conn.query(
    `SELECT COUNT(*) AS n FROM chem_train_items WHERE answer_type='chem_formula'`,
  )
  await conn.end()
  console.log(JSON.stringify({ marked, totalChemFormula: Number(n), markedCodes }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
