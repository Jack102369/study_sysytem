/**
 * P0 fix: kp.structure.atom / formula.rho_c_M / rxn Na+H2O ox/re products
 * Usage: node docs/chemistry_p0_fix/p0_fix.js [--apply]
 */
const fs = require('fs')
const path = require('path')

const APPLY = process.argv.includes('--apply')
const ROOT = path.resolve(__dirname, '../..')
const BACKUP_DIR = __dirname
const envPath = path.join(ROOT, 'apps/api/.env')

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

const NEW_KP_DESC =
  '原子组成：质子数=核电荷数=原子序数；质量数 A = 质子数 Z + 中子数 N（定义用等号，不是近似）；核外电子数=质子数（原子）。注意：质量数是整数，相对原子质量是加权平均值，二者不可混淆。离子的电子数随所带电荷变化。'

const NEW_FM = {
  expression: 'c = 1000ρω/M',
  variables:
    'ρ:溶液密度；ω:溶质质量分数（小数）；M:溶质摩尔质量；c:物质的量浓度',
  units:
    '当 ρ 取 g/cm³（或 g/mL，二者数值相同）且 ω 为小数时：c 单位为 mol/L，M 单位为 g/mol。若密度改用 g/L，则公式改为 c = ρω/M（不再乘 1000）。',
  applicableConditions:
    '由溶液密度与溶质质量分数换算物质的量浓度；ω 必须用小数（如 98% 写作 0.98），不能直接代入百分数；ρ 与公式系数必须匹配（g/cm³ 用含 1000 的式，g/L 用不含 1000 的式）。',
  examples:
    '浓硫酸标签：ρ=1.84 g/cm³，ω=0.98，M(H2SO4)=98 g/mol，则 c=1000×1.84×0.98/98≈18.4 mol/L。',
  commonMistakes:
    '把 ω 直接写成 98；ρ 用 g/L 却仍乘 1000；混淆溶剂体积与溶液体积；把相对分子质量数值当摩尔质量却漏写单位 g/mol。',
  reviewNote:
    '[inv:formula.rho_c_M] P0已修:明确 ρ(g/cm³)+ω(小数)+1000 系数；g/L 时用 c=ρω/M',
}

async function main() {
  const env = loadEnv(envPath)
  let mysql
  try {
    mysql = require(path.join(ROOT, 'apps/api/node_modules/mysql2/promise'))
  } catch {
    mysql = require('mysql2/promise')
  }

  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  })

  const [kpRows] = await conn.query(
    `SELECT id, name, description, status, review_note AS reviewNote
     FROM chem_knowledge_points WHERE id = ?`,
    [14],
  )
  const [fmRows] = await conn.query(
    `SELECT id, name, expression, variables, units,
            applicable_conditions AS applicableConditions,
            examples, common_mistakes AS commonMistakes,
            status, review_note AS reviewNote
     FROM chem_formulas WHERE id = ?`,
    [7],
  )
  const [rxRows] = await conn.query(
    `SELECT id, name, canonical_equation AS canonicalEquation, equation,
            oxidant, reductant, ox_product AS oxProduct, re_product AS reProduct,
            electron_transfer AS electronTransfer, status
     FROM chem_reactions
     WHERE canonical_equation = '2Na+2H2O=2NaOH+H2'`,
  )

  const [kpMass] = await conn.query(
    `SELECT id, name, description FROM chem_knowledge_points
     WHERE description LIKE '%质量数%'`,
  )
  const [fmDens] = await conn.query(
    `SELECT id, name, expression, variables, units FROM chem_formulas
     WHERE name LIKE '%密度%' OR expression LIKE '%1000%'`,
  )

  const backup = {
    backedUpAt: new Date().toISOString(),
    apply: APPLY,
    knowledge: kpRows,
    formula: fmRows,
    reaction: rxRows,
    references: { knowledgeWithMassNumber: kpMass, densityRelatedFormulas: fmDens },
  }
  const backupFile = path.join(
    BACKUP_DIR,
    `backup_before_p0_${APPLY ? 'apply' : 'dryrun'}.json`,
  )
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8')

  if (!kpRows.length || !fmRows.length || !rxRows.length) {
    console.error(
      JSON.stringify(
        {
          error: 'missing rows',
          kp: kpRows.length,
          fm: fmRows.length,
          rx: rxRows.length,
        },
        null,
        2,
      ),
    )
    await conn.end()
    process.exit(1)
  }

  const checksBefore = {
    kpHasApprox: String(kpRows[0].description || '').includes('质量数≈'),
    fmUnitsThin: String(fmRows[0].units || '') === 'c:mol/L',
    rxSwapped:
      rxRows[0].oxProduct === 'H2' && rxRows[0].reProduct === 'NaOH',
    oxidantOk: rxRows[0].oxidant === 'H2O',
    reductantOk: rxRows[0].reductant === 'Na',
  }

  if (!APPLY) {
    console.log(
      JSON.stringify(
        { mode: 'dry-run', backupFile, checksBefore, backup },
        null,
        2,
      ),
    )
    await conn.end()
    return
  }

  await conn.beginTransaction()
  try {
    await conn.query(
      `UPDATE chem_knowledge_points
       SET description = ?,
           review_note = CONCAT(IFNULL(review_note,''), ?)
       WHERE id = ?`,
      [NEW_KP_DESC, ' | P0fix:质量数改用A=Z+N等号，区分相对原子质量', 14],
    )

    await conn.query(
      `UPDATE chem_formulas
       SET expression = ?, variables = ?, units = ?,
           applicable_conditions = ?, examples = ?, common_mistakes = ?,
           review_note = ?
       WHERE id = ?`,
      [
        NEW_FM.expression,
        NEW_FM.variables,
        NEW_FM.units,
        NEW_FM.applicableConditions,
        NEW_FM.examples,
        NEW_FM.commonMistakes,
        NEW_FM.reviewNote,
        7,
      ],
    )

    await conn.query(
      `UPDATE chem_reactions
       SET ox_product = 'NaOH', re_product = 'H2'
       WHERE id = ? AND canonical_equation = '2Na+2H2O=2NaOH+H2'`,
      [rxRows[0].id],
    )

    await conn.commit()
  } catch (e) {
    await conn.rollback()
    throw e
  }

  const [kpAfter] = await conn.query(
    `SELECT id, name, description, status, review_note AS reviewNote
     FROM chem_knowledge_points WHERE id = 14`,
  )
  const [fmAfter] = await conn.query(
    `SELECT id, name, expression, variables, units,
            applicable_conditions AS applicableConditions,
            examples, common_mistakes AS commonMistakes,
            status, review_note AS reviewNote
     FROM chem_formulas WHERE id = 7`,
  )
  const [rxAfter] = await conn.query(
    `SELECT id, name, oxidant, reductant, ox_product AS oxProduct,
            re_product AS reProduct, electron_transfer AS electronTransfer, status
     FROM chem_reactions WHERE id = ?`,
    [rxRows[0].id],
  )

  const validate = {
    kpEquals: /质量数\s*A\s*=\s*质子数/.test(kpAfter[0].description),
    kpNoApprox: !String(kpAfter[0].description).includes('质量数≈'),
    kpDistinguishesAr: String(kpAfter[0].description).includes('相对原子质量'),
    fmExpression: fmAfter[0].expression === 'c = 1000ρω/M',
    fmOmegaDecimal: String(fmAfter[0].applicableConditions).includes('小数'),
    fmGcm3: String(fmAfter[0].units).includes('g/cm'),
    fmGLAlt: String(fmAfter[0].units).includes('g/L'),
    rxOxidant: rxAfter[0].oxidant === 'H2O',
    rxReductant: rxAfter[0].reductant === 'Na',
    rxOxProduct: rxAfter[0].oxProduct === 'NaOH',
    rxReProduct: rxAfter[0].reProduct === 'H2',
  }
  validate.allPass = Object.values(validate).every(Boolean)

  const afterFile = path.join(BACKUP_DIR, 'backup_after_p0_apply.json')
  fs.writeFileSync(
    afterFile,
    JSON.stringify({ appliedAt: new Date().toISOString(), kpAfter, fmAfter, rxAfter, validate }, null, 2),
    'utf8',
  )

  console.log(
    JSON.stringify(
      { mode: 'applied', backupFile, afterFile, checksBefore, validate },
      null,
      2,
    ),
  )
  await conn.end()
  if (!validate.allPass) process.exit(2)
}

main().catch((e) => {
  console.error(String(e && e.stack ? e.stack : e))
  process.exit(1)
})
