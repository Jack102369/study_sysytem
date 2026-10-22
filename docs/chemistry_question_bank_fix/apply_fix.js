'use strict'
/**
 * Apply train-item gate/link fixes (does NOT change KB body/status, passwords, or delete items).
 *   node docs/chemistry_question_bank_fix/apply_fix.js
 *   node docs/chemistry_question_bank_fix/apply_fix.js --dry-run
 */
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname
const mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

/** Reliable code → entity links only (inventory-confirmed). */
const LINK_MAP = {
  // seeds
  'train.test.eq.tf.01': [{ type: 'concept', id: 19, code: 'concept.mass_conserve' }],
  'train.test.eq.tf.02': [{ type: 'concept', id: 10, code: 'concept.oxidant_reductant' }],
  'train.test.eq.single.01': [], // 化学变化通识，无单一知识条 → block trial if no link
  'train.test.mem.blank.01': [{ type: 'element', id: null, code: 'el.O', resolve: 'O' }],
  'train.test.sub.single.01': [{ type: 'substance', id: 2, code: 'sub.H2O' }],
  'train.test.exp.judge.01': [], // 安全通识 → allow with note, no fake link
  'train.test.eq.blank.01': [{ type: 'substance', id: null, code: 'sub.NaCl', resolve: 'NaCl' }],
  'train.test.eq.single.02': [{ type: 'concept', id: 19, code: 'concept.mass_conserve' }],
  'train.test.mem.blank.02': [{ type: 'element', id: null, code: 'el.H', resolve: 'H' }],
  // expand
  'train.ai_trial.eq.balance.01': [{ type: 'concept', id: 19, code: 'concept.mass_conserve' }],
  'train.ai_trial.eq.balance.02': [{ type: 'concept', id: 19, code: 'concept.mass_conserve' }],
  'train.ai_trial.eq.balance.03': [{ type: 'concept', id: 19, code: 'concept.mass_conserve' }],
  'train.ai_trial.eq.balance.04': [{ type: 'concept', id: 19, code: 'concept.mass_conserve' }],
  'train.ai_trial.eq.balance.05': [{ type: 'concept', id: 20, code: 'concept.charge_conserve' }],
  'train.ai_trial.eq.condition.01': [
    { type: 'reaction', id: 2, code: 'rxn.4Na_O2' },
    { type: 'reaction', id: 3, code: 'rxn.2Na_O2_heat' },
  ],
  'train.ai_trial.eq.condition.02': [
    { type: 'reaction', id: 2, code: 'rxn.4Na_O2' },
    { type: 'reaction', id: 3, code: 'rxn.2Na_O2_heat' },
  ],
  'train.ai_trial.eq.condition.03': [
    { type: 'reaction', id: 2, code: 'rxn.4Na_O2' },
    { type: 'reaction', id: 3, code: 'rxn.2Na_O2_heat' },
  ],
  'train.ai_trial.eq.write.01': [{ type: 'concept', id: 19, code: 'concept.mass_conserve' }],
  'train.ai_trial.eq.write.02': [{ type: 'substance', id: 2, code: 'sub.H2O' }],
  'train.ai_trial.eq.product.01': [{ type: 'concept', id: 19, code: 'concept.mass_conserve' }],
  'train.ai_trial.eq.reactant.01': [{ type: 'concept', id: 19, code: 'concept.mass_conserve' }],
  'train.ai_trial.eq.ionic_write.01': [{ type: 'concept', id: 8, code: 'concept.ionic_reaction' }],
  'train.ai_trial.eq.ionic_correct.01': [{ type: 'concept', id: 20, code: 'concept.charge_conserve' }],
  'train.ai_trial.eq.redox_analysis.01': [
    { type: 'concept', id: 10, code: 'concept.oxidant_reductant' },
  ],
  'train.ai_trial.eq.conversion.01': [], // 过于笼统，不猜测具体反应
}

/** Codes that may stay trial-eligible without link (safety/generic pedagogy) */
const ALLOW_WITHOUT_LINK = new Set(['train.test.exp.judge.01'])

function stripGateTags(note) {
  return String(note || '')
    .replace(/\[qa:[^\]]+\]/g, '')
    .replace(/\[verify_class:[^\]]+\]/g, '')
    .replace(/\[trial_access:[^\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function setTags(note, tags) {
  const base = stripGateTags(note)
  const parts = [base, ...tags].filter(Boolean)
  return parts.join(' ').slice(0, 255)
}

function classifyVerify(itemResult) {
  const issues = itemResult.issues || []
  const probs = issues.map((i) => i.problem || '').join(' ')
  // Class 1: science / answer ambiguity on the item itself
  if (
    issues.some((i) => i.level === 'P0' || i.level === 'P1') ||
    /标准答案|科学性|多个正确|答案不唯一|不得标正确/.test(probs)
  ) {
    return { verifyClass: 'science', trialAccess: 'block' }
  }
  // Class 3: qtype / meta / grading limit
  if (
    /元认知|记载正误|禁止随意挖空|方程式填空|判题器|answer_type/.test(probs) &&
    !/二审为待核实/.test(probs)
  ) {
    // tautology P3 alone → still allow trial
    if (/元认知判断题/.test(probs)) {
      return { verifyClass: 'qtype_limit', trialAccess: 'allow' }
    }
  }
  // Class 4: curriculum
  if (/超纲|课程|必修|选修|口径/.test(probs)) {
    return { verifyClass: 'curriculum', trialAccess: 'block' }
  }
  // Class 2: source KB pending human / second-review VERIFY only
  if (
    /二审为待核实|verifyNeeded|human_unreviewed|来源知识.*待核实|乙醇氧化|KMnO4|有机氧化/.test(
      probs,
    ) ||
    itemResult.conclusion === 'NEEDS_VERIFICATION'
  ) {
    return { verifyClass: 'kb_pending', trialAccess: 'allow' }
  }
  return { verifyClass: 'none', trialAccess: 'allow' }
}

;(async () => {
  const dryRun = process.argv.includes('--dry-run')
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
    multipleStatements: true,
  })

  const audit = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'docs/chemistry_question_quality_audit/per_item_results.json'),
      'utf8',
    ),
  )
  const auditByCode = new Map((audit.results || []).map((r) => [r.code, r]))

  // resolve element/substance by symbol/formula when needed
  async function resolveEntity(spec) {
    if (spec.id != null) return { type: spec.type, id: String(spec.id), code: spec.code }
    if (spec.resolve && spec.type === 'element') {
      const [rows] = await conn.query(
        `SELECT id FROM chem_elements WHERE symbol=? LIMIT 1`,
        [spec.resolve],
      )
      if (!rows[0]) return null
      return { type: 'element', id: String(rows[0].id), code: spec.code }
    }
    if (spec.resolve && spec.type === 'substance') {
      const [rows] = await conn.query(
        `SELECT id FROM chem_substances WHERE canonical_formula=? LIMIT 1`,
        [spec.resolve],
      )
      if (!rows[0]) return null
      return { type: 'substance', id: String(rows[0].id), code: spec.code }
    }
    return null
  }

  const report = {
    dryRun,
    appliedAt: new Date().toISOString(),
    linkFixed: [],
    linkUnresolvedBlocked: [],
    linkAllowNoSource: [],
    fillerConfirmed: 0,
    chemFormulaFixed: [],
    verifyClassCounts: {
      science: 0,
      kb_pending: 0,
      qtype_limit: 0,
      curriculum: 0,
      none: 0,
      pass_tagged: 0,
    },
    trialAllow: 0,
    trialBlock: 0,
    modifiedItemIds: [],
  }

  const [allItems] = await conn.query(`SELECT * FROM chem_train_items ORDER BY id`)

  if (!dryRun) await conn.beginTransaction()
  try {
    // 1) filler keep inactive + block trial
    for (const it of allItems.filter((i) => String(i.code).includes('.cov.'))) {
      const note = setTags(it.gate_note, [
        '[qa:NEEDS_FIX]',
        '[verify_class:none]',
        '[trial_access:block]',
      ])
      report.fillerConfirmed++
      report.modifiedItemIds.push(String(it.id))
      if (!dryRun) {
        await conn.query(
          `UPDATE chem_train_items SET is_active=0, ban_default_train=1, verify_blocked=1, gate_note=? WHERE id=?`,
          [note, it.id],
        )
      }
    }

    // 2) fix 25 missing links
    for (const [code, specs] of Object.entries(LINK_MAP)) {
      const [rows] = await conn.query(`SELECT * FROM chem_train_items WHERE code=?`, [code])
      const it = rows[0]
      if (!it) continue

      const resolved = []
      for (const s of specs) {
        const e = await resolveEntity(s)
        if (e) resolved.push(e)
      }

      let trialAccess = 'allow'
      let qa = 'PASS'
      let vclass = 'none'
      if (resolved.length) {
        for (const e of resolved) {
          if (!dryRun) {
            await conn.query(
              `INSERT IGNORE INTO chem_train_item_links (item_id, entity_type, entity_id) VALUES (?,?,?)`,
              [it.id, e.type, e.id],
            )
          }
        }
        report.linkFixed.push({
          code,
          links: resolved.map((e) => `${e.type}:${e.id}:${e.code}`),
        })
      } else if (ALLOW_WITHOUT_LINK.has(code)) {
        report.linkAllowNoSource.push(code)
        qa = 'PASS'
        vclass = 'none'
        trialAccess = 'allow'
      } else {
        // cannot reliably link → keep row, block trial
        trialAccess = 'block'
        qa = 'NEEDS_FIX'
        vclass = 'none'
        report.linkUnresolvedBlocked.push(code)
      }

      // chem_formula for formula/symbol blanks
      let answerType = it.answer_type
      if (
        (code === 'train.ai_trial.eq.write.02' ||
          code === 'train.test.mem.blank.02' ||
          code === 'train.test.eq.blank.01') &&
        answerType !== 'chem_formula'
      ) {
        answerType = 'chem_formula'
        report.chemFormulaFixed.push(code)
      }

      const note = setTags(it.gate_note, [
        `[qa:${qa}]`,
        `[verify_class:${vclass}]`,
        `[trial_access:${trialAccess}]`,
      ])
      report.modifiedItemIds.push(String(it.id))
      if (!dryRun) {
        await conn.query(
          `UPDATE chem_train_items SET answer_type=?, ban_default_train=?, verify_blocked=?, gate_note=? WHERE id=?`,
          [
            answerType,
            trialAccess === 'block' ? 1 : it.ban_default_train,
            trialAccess === 'block' ? 1 : it.verify_blocked,
            note,
            it.id,
          ],
        )
      }
    }

    // 3) classify all items from audit + set trial gates
    for (const it of allItems) {
      const code = it.code
      if (String(code).includes('.cov.')) continue
      if (LINK_MAP[code]) continue // already handled

      const ar = auditByCode.get(code)
      let qa = ar?.conclusion || 'PASS'
      let verifyClass = 'none'
      let trialAccess = 'allow'

      if (ar?.conclusion === 'NEEDS_FIX') {
        // missing-link already handled; other FIX → block
        qa = 'NEEDS_FIX'
        trialAccess = 'block'
        verifyClass = 'none'
      } else if (ar?.conclusion === 'NEEDS_VERIFICATION') {
        const c = classifyVerify(ar)
        verifyClass = c.verifyClass
        trialAccess = c.trialAccess
        qa = 'NEEDS_VERIFICATION'
      } else {
        qa = 'PASS'
        // P3 tautology still allow
        if (ar?.issues?.some((i) => /元认知判断题/.test(i.problem))) {
          verifyClass = 'qtype_limit'
        }
        trialAccess = 'allow'
      }

      // science block always
      if (ar?.issues?.some((i) => i.level === 'P0' || i.level === 'P1')) {
        trialAccess = 'block'
        verifyClass = 'science'
      }

      report.verifyClassCounts[verifyClass] =
        (report.verifyClassCounts[verifyClass] || 0) + 1
      if (qa === 'PASS') report.verifyClassCounts.pass_tagged++

      if (trialAccess === 'allow') report.trialAllow++
      else report.trialBlock++

      const note = setTags(it.gate_note, [
        `[qa:${qa}]`,
        `[verify_class:${verifyClass}]`,
        `[trial_access:${trialAccess}]`,
      ])
      report.modifiedItemIds.push(String(it.id))
      if (!dryRun) {
        await conn.query(
          `UPDATE chem_train_items SET
             ban_default_train=IF(?='block', 1, ban_default_train),
             verify_blocked=IF(?='block', 1, verify_blocked),
             gate_note=?
           WHERE id=?`,
          [trialAccess, trialAccess, note, it.id],
        )
        // If allow, clear previous false blocks only when we set allow and item was blocked solely for trial
        if (trialAccess === 'allow') {
          await conn.query(
            `UPDATE chem_train_items SET ban_default_train=0, verify_blocked=0 WHERE id=? AND is_active=1`,
            [it.id],
          )
        }
      }
    }

    // Re-count allow after logic: filler blocked separately
    if (!dryRun) {
      const [[{ allowN }]] = await conn.query(
        `SELECT COUNT(1) AS allowN FROM chem_train_items
         WHERE pool='test' AND status='approved' AND is_active=1
           AND gate_note LIKE '%[trial_access:allow]%'`,
      )
      const [[{ blockN }]] = await conn.query(
        `SELECT COUNT(1) AS blockN FROM chem_train_items
         WHERE gate_note LIKE '%[trial_access:block]%'`,
      )
      report.trialAllowFinal = Number(allowN)
      report.trialBlockFinal = Number(blockN)
      await conn.commit()
    }

    fs.writeFileSync(
      path.join(OUT, 'apply_fix_result.json'),
      JSON.stringify(report, null, 2),
    )
    console.log(
      JSON.stringify(
        {
          dryRun,
          linkFixed: report.linkFixed.length,
          linkUnresolvedBlocked: report.linkUnresolvedBlocked,
          linkAllowNoSource: report.linkAllowNoSource,
          fillerConfirmed: report.fillerConfirmed,
          chemFormulaFixed: report.chemFormulaFixed,
          verifyClassCounts: report.verifyClassCounts,
          trialAllowFinal: report.trialAllowFinal,
          trialBlockFinal: report.trialBlockFinal,
        },
        null,
        2,
      ),
    )
  } catch (e) {
    if (!dryRun) await conn.rollback()
    throw e
  } finally {
    await conn.end()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
