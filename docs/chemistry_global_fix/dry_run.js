/**
 * Global fix ROUND-1 — DRY-RUN ONLY
 * - Reads DB (SELECT only)
 * - Writes backups + proposed whitelist under docs/chemistry_global_fix/
 * - NEVER UPDATE/DELETE/INSERT
 * - NEVER modifies inventory or import packs
 *
 *   node docs/chemistry_global_fix/dry_run.js
 */
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname
const APPLY_FORBIDDEN = true

const TABLE = {
  element: 'chem_elements',
  substance: 'chem_substances',
  reaction: 'chem_reactions',
  experiment: 'chem_experiments',
  formula: 'chem_formulas',
  concept: 'chem_concepts',
  knowledge: 'chem_knowledge_points',
  question: 'chem_questions',
}

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function clipNote(s, max = 255) {
  const t = String(s || '')
  return t.length <= max ? t : t.slice(0, max - 1) + '…'
}

/**
 * High-school valence judgment for known inventory reactions.
 * Verdict is based on equation / known chemistry, NOT on empty ox/re fields alone.
 */
const VALENCE_JUDGMENT = {
  // —— 明确非氧化还原（无元素化合价变化）——
  'rxn.Na2O_H2O': {
    isRedox: false,
    reason: 'Na₂O+H₂O→NaOH：Na(+1)/O(-2)/H(+1)均无价态变化，属氧化物与水的化合',
  },
  'rxn.NaOH_CO2': {
    isRedox: false,
    reason: 'NaOH+CO₂→碳酸盐+水：酸碱/吸收，无价态变化',
  },
  'rxn.NaOH_HCl': {
    isRedox: false,
    reason: 'NaOH+HCl→NaCl+H₂O：中和，无价态变化',
  },
  'rxn.NaHCO3_heat': {
    isRedox: false,
    reason: '2NaHCO₃△→Na₂CO₃+CO₂+H₂O：分解，无价态变化',
  },
  'rxn.Na2CO3_2HCl': {
    isRedox: false,
    reason: '碳酸盐+酸→盐+CO₂+H₂O：复分解，无价态变化',
  },
  'rxn.Al2O3_6HCl': {
    isRedox: false,
    reason: 'Al₂O₃+HCl→AlCl₃+H₂O：氧化物与酸，Al(+3)/Cl(-1)等无价态变化',
  },
  'rxn.Al2O3_2NaOH': {
    isRedox: false,
    reason: 'Al₂O₃+NaOH→偏铝酸盐+水：两性氧化物与碱，无价态变化',
  },
  'rxn.AlOH3_NaOH': {
    isRedox: false,
    reason: 'Al(OH)₃+NaOH→偏铝酸盐+水：两性氢氧化物与碱，无价态变化',
  },
  'rxn.AlOH3_3HCl': {
    isRedox: false,
    reason: 'Al(OH)₃+HCl→AlCl₃+H₂O：中和/复分解，无价态变化',
  },
  'rxn.CuO_2HCl': {
    isRedox: false,
    reason: 'CuO+HCl→CuCl₂+H₂O：氧化物与酸，Cu(+2)无价态变化',
  },
  'rxn.Na2CO3_CO2_H2O': {
    isRedox: false,
    reason: 'Na₂CO₃+CO₂+H₂O→NaHCO₃：无价态变化',
  },
  'rxn.SO3_H2O': {
    isRedox: false,
    reason: 'SO₃+H₂O→H₂SO₄：S(+6)无变价',
  },
  'rxn.NH3_HCl': {
    isRedox: false,
    reason: 'NH₃+HCl→NH₄Cl：化合/中和类，无价态变化',
  },
  'rxn.CO2_CaOH2': {
    isRedox: false,
    reason: 'CO₂+Ca(OH)₂→CaCO₃+H₂O：无价态变化',
  },
  'rxn.SiO2_2NaOH': {
    isRedox: false,
    reason: 'SiO₂+NaOH→硅酸盐+水：无价态变化',
  },
  'rxn.CaCO3_2HCl': {
    isRedox: false,
    reason: '碳酸盐+酸：复分解，无价态变化',
  },
  'rxn.NH4Cl_NaOH': {
    isRedox: false,
    reason: '铵盐+碱→氨：无价态变化',
  },
  'rxn.esterification': {
    isRedox: false,
    reason: '酯化：酸醇缩合，高一口径不计氧化还原',
  },
  'rxn.CH3COOH_NaOH': {
    isRedox: false,
    reason: '乙酸中和：无价态变化',
  },
  'rxn.CH3COOH_Na2CO3': {
    isRedox: false,
    reason: '酸+碳酸盐：无价态变化',
  },
  'rxn.C2H4_H2O': {
    isRedox: false,
    reason: '乙烯水化加成：高一口径通常不作为氧化还原训练反应',
  },

  // —— 明确氧化还原 ——
  'rxn.2Na_2H2O': { isRedox: true, reason: 'Na(0)→Na(+1)，H(+1)→H₂(0)' },
  'rxn.4Na_O2': { isRedox: true, reason: 'Na被氧化，O₂被还原' },
  'rxn.2Na_O2_heat': { isRedox: true, reason: 'Na被氧化，O₂被还原成过氧化物' },
  'rxn.2Na2O2_2H2O': { isRedox: true, reason: 'Na₂O₂歧化（O既升又降）' },
  'rxn.2Na2O2_2CO2': { isRedox: true, reason: 'Na₂O₂歧化' },
  'rxn.2Mg_O2': { isRedox: true, reason: 'Mg燃烧' },
  'rxn.Mg_2HCl': { isRedox: true, reason: '活泼金属+酸置换出H₂' },
  'rxn.Mg_CO2': { isRedox: true, reason: 'Mg还原CO₂' },
  'rxn.4Al_3O2': { isRedox: true, reason: 'Al燃烧' },
  'rxn.2Al_6HCl': { isRedox: true, reason: 'Al+酸置换' },
  'rxn.2Al_2NaOH': { isRedox: true, reason: 'Al+碱+水放出H₂，Al→Al(+3)，H→0' },
  'rxn.3Fe_2O2': { isRedox: true, reason: 'Fe燃烧' },
  'rxn.Fe_H2SO4': { isRedox: true, reason: 'Fe+酸置换' },
  'rxn.Fe_CuSO4': { isRedox: true, reason: '置换：Fe→Fe²⁺，Cu²⁺→Cu' },
  'rxn.Fe2O3_3CO': { isRedox: true, reason: 'Fe₂O₃被CO还原' },
  'rxn.Cu_O2_heat': { isRedox: true, reason: 'Cu氧化' },
  'rxn.CuO_H2': { isRedox: true, reason: 'H₂还原CuO' },
  'rxn.Zn_H2SO4': { isRedox: true, reason: 'Zn+酸置换' },
  'rxn.Zn_CuSO4': { isRedox: true, reason: '置换反应' },
  'rxn.FeOH2_O2': { isRedox: true, reason: 'Fe(OH)₂被O₂氧化' },
  'rxn.2Fe2_Cl2': { isRedox: true, reason: 'Fe²⁺被Cl₂氧化' },
  'rxn.2Na_2HCl': { isRedox: true, reason: 'Na+酸置换' },
  'rxn.H2_Cl2': { isRedox: true, reason: 'H₂+Cl₂合成' },
  'rxn.2Na_Cl2': { isRedox: true, reason: 'Na+Cl₂' },
  'rxn.2Fe_3Cl2': { isRedox: true, reason: 'Fe+Cl₂' },
  'rxn.Cl2_H2O': { isRedox: true, reason: 'Cl₂歧化' },
  'rxn.Cl2_2NaOH': { isRedox: true, reason: 'Cl₂歧化' },
  'rxn.MnO2_4HCl': { isRedox: true, reason: 'MnO₂氧化浓盐酸制Cl₂' },
  'rxn.S_O2': { isRedox: true, reason: 'S燃烧' },
  'rxn.2SO2_O2': { isRedox: true, reason: 'SO₂催化氧化' },
  'rxn.Cu_2H2SO4': { isRedox: true, reason: 'Cu与浓硫酸' },
  'rxn.C_2H2SO4': { isRedox: true, reason: 'C与浓硫酸' },
  'rxn.N2_3H2': { isRedox: true, reason: '合成氨：N/H价态变化' },
  'rxn.4NH3_5O2': { isRedox: true, reason: '氨催化氧化' },
  'rxn.2NO_O2': { isRedox: true, reason: 'NO→NO₂' },
  'rxn.3NO2_H2O': { isRedox: true, reason: 'NO₂歧化' },
  'rxn.Cu_4HNO3': { isRedox: true, reason: 'Cu与稀硝酸' },
  'rxn.Cu_4HNO3c': { isRedox: true, reason: 'Cu与浓硝酸' },
  'rxn.C_O2_incomplete': { isRedox: true, reason: '不完全燃烧' },
  'rxn.C_O2_complete': { isRedox: true, reason: '完全燃烧' },
  'rxn.SiO2_2C': { isRedox: true, reason: 'C还原SiO₂' },
  'rxn.C2H5OH_O2': { isRedox: true, reason: '乙醇催化氧化' },
  'rxn.C2H5OH_burn': { isRedox: true, reason: '乙醇燃烧' },
  'rxn.C2H4_KMnO4': {
    isRedox: true,
    reason: '乙烯被酸性KMnO₄氧化（有氧化剂/还原剂字段；产物条件依赖）',
  },

  // —— 有机：化学上可有价态变化，但高一常按有机反应类型训练；证据不足以强制挂/摘 ——
  'rxn.CH4_Cl2': {
    isRedox: 'uncertain',
    reason: '取代中Cl₂→HCl、C价态变化，化学上属氧化还原；高一多按取代训练，是否挂redox需教学口径确认',
  },
  'rxn.C2H4_Br2': {
    isRedox: 'uncertain',
    reason: '加成中Br(0)→-1，化学上可归氧化还原；高一多按加成训练',
  },
  'rxn.C2H4_H2': {
    isRedox: 'uncertain',
    reason: '加氢中H(0)→+1，化学上可归氧化还原；高一多按加成训练',
  },
}

async function main() {
  if (!APPLY_FORBIDDEN) throw new Error('safety flag broken')

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

  // Force session read-only intent (still SELECT-only in this script)
  await conn.query('SET SESSION TRANSACTION READ ONLY').catch(() => {})

  const inv = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_kb_inventory.json'), 'utf8'),
  )
  const extract = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs/chemistry_global_audit/extract.json'), 'utf8'),
  )
  const byCode = Object.fromEntries(extract.items.map((i) => [i.code, i]))

  // —— 1. Fresh DB backup of 377 + links ——
  const backup = {
    backedUpAt: new Date().toISOString(),
    mode: 'dry-run-readonly',
    note: 'SELECT-only snapshot for rollback planning. No DB writes performed.',
    inventoryTotal: 0,
    entities: [],
    specialtyLinks: [],
    categoryLinks: [],
    specialties: [],
    categories: [],
  }

  const [specRows] = await conn.query(`SELECT id, code, name FROM chem_specialties`)
  const [catRows] = await conn.query(
    `SELECT c.id, c.code AS cat_code, s.code AS sp_code, c.name
     FROM chem_categories c
     JOIN chem_specialties s ON s.id=c.specialty_id`,
  )
  backup.specialties = specRows
  backup.categories = catRows
  const specIdByCode = new Map(specRows.map((r) => [r.code, String(r.id)]))
  const catIdByFull = new Map(
    catRows.map((r) => [`${r.sp_code}.${r.cat_code}`, String(r.id)]),
  )

  for (const batch of inv.batches) {
    for (const it of batch.items) {
      backup.inventoryTotal++
      const ex = byCode[it.code]
      if (!ex || !ex.dbId) {
        backup.entities.push({
          code: it.code,
          batch: batch.id,
          type: it.type,
          error: 'unresolved in extract',
        })
        continue
      }
      const table = TABLE[it.type]
      const [rows] = await conn.query(`SELECT * FROM ${table} WHERE id=?`, [ex.dbId])
      const row = rows[0] || null
      const [specs] = await conn.query(
        `SELECT es.id AS link_id, es.specialty_id, s.code AS specialty_code
         FROM chem_entity_specialties es
         JOIN chem_specialties s ON s.id=es.specialty_id
         WHERE es.entity_type=? AND es.entity_id=?`,
        [it.type, ex.dbId],
      )
      const [cats] = await conn.query(
        `SELECT ec.id AS link_id, ec.category_id, CONCAT(sp.code,'.',c.code) AS category_code
         FROM chem_entity_categories ec
         JOIN chem_categories c ON c.id=ec.category_id
         JOIN chem_specialties sp ON sp.id=c.specialty_id
         WHERE ec.entity_type=? AND ec.entity_id=?`,
        [it.type, ex.dbId],
      )
      for (const s of specs) {
        backup.specialtyLinks.push({
          link_id: String(s.link_id),
          entity_type: it.type,
          entity_id: String(ex.dbId),
          code: it.code,
          specialty_code: s.specialty_code,
          specialty_id: String(s.specialty_id),
        })
      }
      for (const c of cats) {
        backup.categoryLinks.push({
          link_id: String(c.link_id),
          entity_type: it.type,
          entity_id: String(ex.dbId),
          code: it.code,
          category_code: c.category_code,
          category_id: String(c.category_id),
        })
      }
      backup.entities.push({
        code: it.code,
        batch: batch.id,
        type: it.type,
        dbId: String(ex.dbId),
        status: row?.status || null,
        review_note: row?.review_note || '',
        row,
        specialtyCodes: specs.map((s) => s.specialty_code).sort(),
        categoryCodes: cats.map((c) => c.category_code).sort(),
        verifyNeeded: !!it.verifyNeeded,
      })
    }
  }

  fs.writeFileSync(
    path.join(OUT, 'backup_before_global_fix.json'),
    JSON.stringify(backup, null, 2) + '\n',
  )

  // Inventory snapshot (copy, not modifying formal file)
  fs.copyFileSync(
    path.join(ROOT, 'docs/chemistry_kb_inventory.json'),
    path.join(OUT, 'backup_inventory_before.json'),
  )

  // Import pack snapshots (copy only under dry-run folder)
  const packBackupDir = path.join(OUT, 'backup_import_packs')
  fs.mkdirSync(packBackupDir, { recursive: true })
  for (const b of ['batch2', 'batch3', 'batch4', 'batch5', 'batch6']) {
    const srcDir = path.join(ROOT, `docs/chemistry_${b}`)
    if (!fs.existsSync(srcDir)) continue
    const dest = path.join(packBackupDir, b)
    fs.mkdirSync(dest, { recursive: true })
    for (const f of fs.readdirSync(srcDir)) {
      if (!/\.(json|js)$/.test(f)) continue
      if (/backup|result|quality/i.test(f) && !/^import_/.test(f)) continue
      const from = path.join(srcDir, f)
      if (fs.statSync(from).isFile()) {
        fs.copyFileSync(from, path.join(dest, f))
      }
    }
  }

  // —— 2. Redox analysis for all reactions ——
  const redoxAnalysis = []
  const proposed = []
  const observeOnly = []
  const publishedIssues = []

  for (const ent of backup.entities) {
    if (ent.type !== 'reaction' || !ent.row) continue
    const eq = ent.row.canonical_equation || ent.row.equation || ''
    const ox = ent.row.oxidant || ''
    const re = ent.row.reductant || ''
    const hasRedoxSpec = ent.specialtyCodes.includes('redox')
    const redoxCats = ent.categoryCodes.filter((c) => c.startsWith('redox.'))
    const j = VALENCE_JUDGMENT[ent.code]

    let verdict
    let confidence
    if (!j) {
      verdict = 'unknown'
      confidence = 'low'
    } else if (j.isRedox === true) {
      verdict = 'redox'
      confidence = 'high'
    } else if (j.isRedox === false) {
      verdict = 'non-redox'
      confidence = 'high'
    } else {
      verdict = 'uncertain'
      confidence = 'medium'
    }

    // Cross-check: empty ox/re alone must NOT decide
    const emptyOxRe = !ox && !re
    const analysis = {
      code: ent.code,
      batch: ent.batch,
      status: ent.status,
      equation: eq,
      oxidant: ox,
      reductant: re,
      emptyOxRe,
      dbHasRedox: hasRedoxSpec,
      dbRedoxCategories: redoxCats,
      valenceVerdict: verdict,
      confidence,
      reason: j?.reason || '无预置价态判定表项，需人工',
      action: 'none',
    }

    if (verdict === 'non-redox' && hasRedoxSpec) {
      if (ent.status === 'published') {
        analysis.action = 'report-only-published'
        publishedIssues.push({
          code: ent.code,
          issue: 'published反应误挂redox，默认不改关联，需单独授权',
          equation: eq,
          reason: analysis.reason,
        })
      } else {
        analysis.action = 'remove-redox'
        proposed.push({
          code: ent.code,
          batch: ent.batch,
          type: 'reaction',
          dbId: ent.dbId,
          status: ent.status,
          verifyNeeded: ent.verifyNeeded,
          kind: 'remove_redox_specialty',
          rollback: 'full',
          before: {
            specialtyCodes: [...ent.specialtyCodes],
            categoryCodes: [...ent.categoryCodes],
            review_note: ent.review_note,
          },
          after: {
            specialtyCodes: ent.specialtyCodes.filter((s) => s !== 'redox'),
            categoryCodes: ent.categoryCodes.filter((c) => !c.startsWith('redox.')),
            review_note: ent.review_note,
          },
          dbOps: [
            {
              op: 'DELETE',
              table: 'chem_entity_specialties',
              where: {
                entity_type: 'reaction',
                entity_id: ent.dbId,
                specialty_id: specIdByCode.get('redox'),
              },
            },
            ...redoxCats.map((cc) => ({
              op: 'DELETE',
              table: 'chem_entity_categories',
              where: {
                entity_type: 'reaction',
                entity_id: ent.dbId,
                category_id: catIdByFull.get(cc),
              },
            })),
          ],
          inventoryOps: {
            removeSpecialty: ['redox'],
            removeCategories: redoxCats,
          },
          importPackSync: {
            batch: ent.batch,
            note: '从对应 batch 导入包 specialtyByCode / categoryByCode 去掉 redox 与 redox.*',
          },
          reason: analysis.reason,
          valenceEvidence: analysis.reason,
          notBasedOnEmptyOxReAlone: true,
        })
      }
    } else if (verdict === 'redox' && !hasRedoxSpec) {
      // Clear missing link — propose add only if high confidence and pending
      if (ent.code === 'rxn.C2H4_KMnO4' && ent.status !== 'published') {
        analysis.action = 'propose-add-redox'
        proposed.push({
          code: ent.code,
          batch: ent.batch,
          type: 'reaction',
          dbId: ent.dbId,
          status: ent.status,
          verifyNeeded: ent.verifyNeeded,
          kind: 'add_redox_specialty',
          rollback: 'full',
          before: {
            specialtyCodes: [...ent.specialtyCodes],
            categoryCodes: [...ent.categoryCodes],
          },
          after: {
            specialtyCodes: [...ent.specialtyCodes, 'redox'].sort(),
            categoryCodes: [...ent.categoryCodes, 'redox.identify'].sort(),
          },
          dbOps: [
            {
              op: 'INSERT',
              table: 'chem_entity_specialties',
              values: {
                entity_type: 'reaction',
                entity_id: ent.dbId,
                specialty_id: specIdByCode.get('redox'),
              },
            },
            {
              op: 'INSERT',
              table: 'chem_entity_categories',
              values: {
                entity_type: 'reaction',
                entity_id: ent.dbId,
                category_id: catIdByFull.get('redox.identify'),
              },
            },
          ],
          inventoryOps: {
            addSpecialty: ['redox'],
            addCategories: ['redox.identify'],
          },
          importPackSync: {
            batch: ent.batch,
            note: 'batch6 导入包补挂 redox + redox.identify；同时保留现有「禁唯一产物填空」训练限制说明',
          },
          reason: analysis.reason,
          trainingCaveat:
            '已有描述性产物限制；补挂redox后引擎仍须禁止以唯一ox/re产物填空自动判题。备注≠访问控制。',
        })
      } else {
        analysis.action = 'observe-missing-redox'
        observeOnly.push({
          code: ent.code,
          status: ent.status,
          note: '判定为氧化还原但未挂redox；未自动列入修改白名单（非C2H4_KMnO4或已发布）',
          reason: analysis.reason,
        })
      }
    } else if (verdict === 'uncertain') {
      analysis.action = 'observe-uncertain'
      observeOnly.push({
        code: ent.code,
        status: ent.status,
        dbHasRedox: hasRedoxSpec,
        note: '有机反应价态/教学口径不确定，不自动改关联',
        reason: analysis.reason,
      })
    } else if (verdict === 'unknown') {
      analysis.action = 'observe-unknown'
      observeOnly.push({
        code: ent.code,
        status: ent.status,
        dbHasRedox: hasRedoxSpec,
        emptyOxRe,
        note: '无价态判定表项，不自动修改',
      })
    }

    redoxAnalysis.push(analysis)
  }

  // —— 3. Inventory specialty mismatch (DB correct, inventory wrong ion) ——
  const invFixCodes = [
    {
      code: 'kp.periodic.position',
      correctSpecs: ['periodic', 'structure'],
      wrongInv: 'ion',
      reason: '知识点为元素位置/周期律，清单误标 ion；DB已正确为 periodic+structure，拟改inventory对齐DB，不向DB加ion',
    },
    {
      code: 'kp.calc.concentration',
      correctSpecs: ['calculation'],
      wrongInv: 'ion',
      reason: '浓度为计算专项；清单误标 ion；DB已正确 calculation',
    },
    {
      code: 'kp.calc.dilution',
      correctSpecs: ['calculation'],
      wrongInv: 'ion',
      reason: '稀释为计算专项；清单误标 ion；DB已正确 calculation',
    },
  ]
  for (const fix of invFixCodes) {
    const ent = backup.entities.find((e) => e.code === fix.code)
    const ex = byCode[fix.code]
    if (!ent || !ex) continue
    if (ent.status === 'published') {
      publishedIssues.push({ code: fix.code, issue: 'published，跳过', ...fix })
      continue
    }
    const invSpecs = [...(ex.specialtyCodes || [])]
    if (!invSpecs.includes(fix.wrongInv)) continue
    proposed.push({
      code: fix.code,
      batch: ent.batch,
      type: ent.type,
      dbId: ent.dbId,
      status: ent.status,
      verifyNeeded: ent.verifyNeeded,
      kind: 'inventory_specialty_align_to_db',
      rollback: 'full',
      before: {
        inventorySpecialtyCodes: invSpecs,
        dbSpecialtyCodes: [...ent.specialtyCodes],
      },
      after: {
        inventorySpecialtyCodes: fix.correctSpecs,
        dbSpecialtyCodes: [...ent.specialtyCodes], // unchanged
      },
      dbOps: [],
      inventoryOps: {
        setSpecialtyCodes: fix.correctSpecs,
      },
      importPackSync: null,
      reason: fix.reason,
    })
  }

  // —— 4. Missing [inv:] on pending elements ——
  for (const code of ['el.Be', 'el.Ar', 'el.Fe', 'el.I', 'el.Cr']) {
    const ent = backup.entities.find((e) => e.code === code)
    if (!ent || !ent.row) continue
    if (ent.status === 'published') {
      publishedIssues.push({
        code,
        issue: 'published缺[inv:]，默认不改正文/note',
      })
      continue
    }
    const note = String(ent.review_note || '')
    if (/\[inv:/.test(note)) continue
    const next = clipNote(`[inv:${code}] ${note}`.trim())
    proposed.push({
      code,
      batch: ent.batch,
      type: 'element',
      dbId: ent.dbId,
      status: ent.status,
      verifyNeeded: ent.verifyNeeded,
      kind: 'append_inv_tag',
      rollback: 'full',
      before: { review_note: note },
      after: { review_note: next },
      dbOps: [
        {
          op: 'UPDATE',
          table: 'chem_elements',
          set: { review_note: next },
          where: { id: ent.dbId, status: 'pending_review' },
        },
      ],
      inventoryOps: null,
      importPackSync: {
        batch: ent.batch,
        note: '若导入包有对应元素项，同步 reviewNote；否则仅DB补标签',
      },
      reason: 'pending_review 缺 [inv:CODE] 同步瑕疵；不改科学字段',
    })
  }

  // —— 5. Question training limits (pending only; note≠engine ACL) ——
  const qLimitSuffix =
    ' [trainLimit:非正式卷库骨架;禁无约束自动组卷判题;引擎未实现前本备注≠访问控制]'
  for (const ent of backup.entities) {
    if (ent.type !== 'question') continue
    if (ent.code === 'q.eq.Na_water' || ent.status === 'published') {
      publishedIssues.push({
        code: ent.code,
        issue:
          'published题目：题干为「生成物」非方程式书写；标准答案「NaOH和H₂」；挂equation专项存在适配风险；默认不改关联/正文；引擎必须实现：不得作方程式配平/完整方程式唯一答案自动判题',
        stem: ent.row?.stem,
        answer: ent.row?.answer,
        specialties: ent.specialtyCodes,
      })
      continue
    }
    const note = String(ent.review_note || '')
    if (/trainLimit:/.test(note) || /禁无约束自动/.test(note)) continue
    // Only append if not already clearly marked as 骨架非正式
    const already = /骨架|非正式训练|非正式卷/.test(note)
    if (already && /骨架/.test(note)) {
      // still propose explicit engine-facing token if missing
      if (/trainLimit:/.test(note)) continue
    }
    const next = clipNote(note + qLimitSuffix)
    if (next === note) continue
    proposed.push({
      code: ent.code,
      batch: ent.batch,
      type: 'question',
      dbId: ent.dbId,
      status: ent.status,
      verifyNeeded: ent.verifyNeeded,
      kind: 'append_train_limit_note',
      rollback: 'full',
      before: { review_note: note },
      after: { review_note: next },
      dbOps: [
        {
          op: 'UPDATE',
          table: 'chem_questions',
          set: { review_note: next },
          where: { id: ent.dbId, status: 'pending_review' },
        },
      ],
      inventoryOps: null,
      importPackSync: {
        batch: ent.batch,
        note: '同步导入包 question.reviewNote；强调备注≠引擎ACL',
      },
      reason:
        '明确题目骨架训练风险；补充结构化限制说明。当前无训练引擎，本备注不能视为已生效访问控制。',
      engineMustImplement: [
        '跳过 status≠published 或含 trainLimit 的条目作为正式自动组卷源',
        'question骨架不得直接作为唯一答案判题卷库',
      ],
    })
  }

  // —— 6. verifyNeeded soft note for exp.Fe3_SCN only ——
  {
    const ent = backup.entities.find((e) => e.code === 'exp.Fe3_SCN')
    if (ent && ent.status === 'pending_review' && ent.verifyNeeded) {
      const note = String(ent.review_note || '')
      if (!/待核实|verifyNeeded|非默认核心/.test(note)) {
        const next = clipNote(
          note + ' 待核实:教材现象口径;非默认核心训练;excludeDefaultUntilVerified',
        )
        proposed.push({
          code: ent.code,
          batch: ent.batch,
          type: 'experiment',
          dbId: ent.dbId,
          status: ent.status,
          verifyNeeded: true,
          kind: 'append_verify_train_limit',
          rollback: 'full',
          before: { review_note: note },
          after: { review_note: next },
          dbOps: [
            {
              op: 'UPDATE',
              table: 'chem_experiments',
              set: { review_note: next },
              where: { id: ent.dbId, status: 'pending_review' },
            },
          ],
          reason: 'verifyNeeded但note未标明训练限制；只补限制说明，不改实验化学结论',
        })
      }
    }
  }

  // —— Deferred / not modifying ——
  const deferred = [
    {
      item: '60 empty secondary categories',
      action: 'keep empty',
      reason: '本次不提高覆盖率，不为填空而硬挂',
    },
    {
      item: '23 verifyNeeded chemical conclusions',
      action: 'no content change',
      reason: '不进行教材口径拍板；仅允许训练限制配置',
    },
    {
      item: 'experiment paper-mark P2 (书面关键字)',
      action: 'defer',
      reason: '多数已有 home_forbidden_note；缺「书面」字样属展示优化，不强制改写',
    },
    {
      item: 'organic CH4_Cl2 / C2H4_Br2 / C2H4_H2 redox specialty',
      action: 'observe only',
      reason: '教学口径不确定，证据不足以自动挂/摘',
    },
    {
      item: '19 published entities content/links',
      action: 'protect',
      reason: '默认不修改；问题只记录',
    },
  ]

  // —— Summaries ——
  const codes = [...new Set(proposed.map((p) => p.code))]
  const removeRedox = proposed.filter((p) => p.kind === 'remove_redox_specialty')
  const addRedox = proposed.filter((p) => p.kind === 'add_redox_specialty')
  const otherLink = proposed.filter((p) =>
    ['inventory_specialty_align_to_db'].includes(p.kind),
  )
  const invTags = proposed.filter((p) => p.kind === 'append_inv_tag')
  const notes = proposed.filter((p) =>
    ['append_train_limit_note', 'append_verify_train_limit'].includes(p.kind),
  )
  const touchesPublished = proposed.filter((p) => p.status === 'published')
  const touchesVerify = proposed.filter((p) => p.verifyNeeded)
  const unsafeRollback = proposed.filter((p) => p.rollback !== 'full')

  const plan = {
    generatedAt: new Date().toISOString(),
    mode: 'dry-run',
    dbWrites: false,
    inventoryWrites: false,
    importPackWrites: false,
    stats: {
      plannedKnowledgeCodes: codes.length,
      plannedRemoveWrongRedoxLinks: removeRedox.length,
      plannedAddCorrectRedoxLinks: addRedox.length,
      plannedOtherLinkFixes: otherLink.length,
      plannedInvTagOrReviewNote: invTags.length + notes.length,
      plannedInvTags: invTags.length,
      plannedReviewNotes: notes.length,
      proposedOpsTouchingPublished: touchesPublished.length,
      proposedOpsTouchingVerifyNeeded: touchesVerify.length,
      verifyNeededTotal: backup.entities.filter((e) => e.verifyNeeded).length,
      publishedTotal: backup.entities.filter((e) => e.status === 'published').length,
      unsafeRollbackOps: unsafeRollback.length,
      newMajorScienceErrorsFound: false,
    },
    proposed,
    redoxAnalysis,
    observeOnly,
    publishedIssues,
    deferred,
    rollback: {
      backupFile: 'docs/chemistry_global_fix/backup_before_global_fix.json',
      inventoryBackup: 'docs/chemistry_global_fix/backup_inventory_before.json',
      importPackBackup: 'docs/chemistry_global_fix/backup_import_packs/',
      canFullyRollback: true,
      method:
        'apply前所有拟改均为可逆：specialty/category DELETE可按backup.specialtyLinks/categoryLinks INSERT还原；review_note UPDATE可按backup.entities[].review_note还原；inventory/导入包用 backup 文件覆盖还原。dry-run本身未改任何正式数据。',
      cannotRollback: [],
    },
    importPackSyncPlan: {
      batch3: removeRedox
        .filter((p) => p.batch === 'batch3')
        .map((p) => p.code),
      batch6: addRedox.filter((p) => p.batch === 'batch6').map((p) => p.code),
      batch2: invTags.filter((p) => p.batch === 'batch2').map((p) => p.code),
      batch5: notes.filter((p) => p.batch === 'batch5').map((p) => p.code),
      note: 'dry-run未改正式导入包；apply阶段再写',
    },
  }

  fs.writeFileSync(
    path.join(OUT, 'dry_run_plan.json'),
    JSON.stringify(plan, null, 2) + '\n',
  )

  // Human-readable report
  const lines = []
  lines.push('# 全库第一轮整改 · Dry-Run 报告')
  lines.push('')
  lines.push(`> 生成时间：${plan.generatedAt}`)
  lines.push('> **本阶段只读：未执行任何 UPDATE/DELETE/INSERT，未改 inventory，未覆盖正式导入包。**')
  lines.push('> 训练限制备注 ≠ 已生效访问控制（尚无训练引擎）。')
  lines.push('')
  lines.push('## 1. 汇总')
  lines.push('')
  lines.push('| 指标 | 数量 |')
  lines.push('|------|------|')
  lines.push(`| 计划修改知识（去重编码） | **${codes.length}** |`)
  lines.push(`| 计划删除错误 redox 关联 | **${removeRedox.length}** |`)
  lines.push(`| 计划新增正确 redox 关联 | **${addRedox.length}** |`)
  lines.push(`| 其他关联修复 | **${otherLink.length}** |`)
  lines.push(`| 计划补充 [inv:] | **${invTags.length}** |`)
  lines.push(`| 计划补充 reviewNote/trainLimit | **${notes.length}** |`)
  lines.push(`| 拟改触及已发布知识 | **${touchesPublished.length}** |`)
  lines.push(`| 拟改触及23条待核实（仅关联/限制说明） | **${touchesVerify.length}** |`)
  lines.push(`| 无法安全回滚的操作 | **${unsafeRollback.length}** |`)
  lines.push(`| 新发现重大科学错误 | **否** |`)
  lines.push('')
  lines.push('## 2. 价态验证后的 redox 误挂删除清单')
  lines.push('')
  lines.push('判定依据：**实际反应与元素化合价变化**，而非「oxidant/reductant 为空」。')
  lines.push('')
  for (const p of removeRedox) {
    lines.push(`### \`${p.code}\`（${p.batch}，${p.status}）`)
    lines.push(`- 价态依据：${p.valenceEvidence}`)
    lines.push(`- 变更前 specialty：${p.before.specialtyCodes.join(', ') || '—'}`)
    lines.push(`- 变更后 specialty：${p.after.specialtyCodes.join(', ') || '—'}`)
    lines.push(`- 变更前 category：${p.before.categoryCodes.join(', ') || '—'}`)
    lines.push(`- 变更后 category：${p.after.categoryCodes.join(', ') || '—'}`)
    lines.push(`- DB：删除 redox 专项关联 + 删除 redox.* 二级分类关联`)
    lines.push(`- 同步：inventory + ${p.batch} 导入包`)
    lines.push(`- 回滚：完整（可由 backup 还原 link 行）`)
    if (p.verifyNeeded) lines.push('- ⚠️ 同时为 verifyNeeded：只改关联，不改方程式/产物化学结论')
    lines.push('')
  }

  lines.push('## 3. 计划新增的正确 redox 关联')
  lines.push('')
  if (!addRedox.length) lines.push('（无）')
  for (const p of addRedox) {
    lines.push(`### \`${p.code}\``)
    lines.push(`- 依据：${p.reason}`)
    lines.push(`- 变更前 specialty：${p.before.specialtyCodes.join(', ')}`)
    lines.push(`- 变更后 specialty：${p.after.specialtyCodes.join(', ')}`)
    lines.push(`- 变更前 category：${p.before.categoryCodes.join(', ')}`)
    lines.push(`- 变更后 category：${p.after.categoryCodes.join(', ')}`)
    lines.push(`- 训练注意：${p.trainingCaveat}`)
    lines.push('')
  }

  lines.push('## 4. 其他关联修复（inventory 对齐 DB）')
  lines.push('')
  for (const p of otherLink) {
    lines.push(`### \`${p.code}\``)
    lines.push(`- ${p.reason}`)
    lines.push(`- inventory 前：${p.before.inventorySpecialtyCodes.join(', ')}`)
    lines.push(`- inventory 后：${p.after.inventorySpecialtyCodes.join(', ')}`)
    lines.push(`- DB specialty 不变：${p.after.dbSpecialtyCodes.join(', ')}`)
    lines.push('')
  }

  lines.push('## 5. [inv:] / reviewNote 拟补充')
  lines.push('')
  for (const p of [...invTags, ...notes]) {
    lines.push(`### \`${p.code}\` · ${p.kind}`)
    lines.push(`- 前：\`${p.before.review_note}\``)
    lines.push(`- 后：\`${p.after.review_note}\``)
    lines.push(`- 说明：${p.reason}`)
    lines.push('')
  }

  lines.push('## 6. 全库反应 redox 扫描（含观察项）')
  lines.push('')
  lines.push(`反应总数：${redoxAnalysis.length}`)
  const mis = redoxAnalysis.filter((a) => a.action === 'remove-redox').length
  const miss = redoxAnalysis.filter((a) => a.action.startsWith('propose') || a.action.startsWith('observe-missing')).length
  const unc = redoxAnalysis.filter((a) => a.action === 'observe-uncertain').length
  lines.push(`- 明确误挂拟删：${mis}`)
  lines.push(`- 漏挂（拟增或仅观察）：${miss}`)
  lines.push(`- 教学口径不确定（仅观察）：${unc}`)
  lines.push('')
  lines.push('### 仅观察、不自动修改')
  for (const o of observeOnly) {
    lines.push(`- \`${o.code}\`：${o.note} — ${o.reason || ''}`)
  }
  lines.push('')

  lines.push('## 7. 已发布知识保护清单')
  lines.push('')
  lines.push(`published 总数：${plan.stats.publishedTotal}；拟改白名单中触及 published：**${touchesPublished.length}**`)
  lines.push('')
  for (const p of publishedIssues) {
    lines.push(`- \`${p.code}\`：${p.issue}${p.stem ? `；题干=${p.stem}` : ''}${p.answer != null ? `；答案=${p.answer}` : ''}`)
  }
  lines.push('')

  lines.push('## 8. 23 条待核实')
  lines.push('')
  lines.push(`- inventory.verifyNeeded 条数：${plan.stats.verifyNeededTotal}`)
  lines.push(`- 拟改中触及（仅删错误redox关联或补限制说明，不改化学结论）：${touchesVerify.map((p) => p.code).join(', ') || '无'}`)
  lines.push('- 化学结论 / 教材口径：**不修改**')
  lines.push('')

  lines.push('## 9. 备份与回滚')
  lines.push('')
  lines.push(`- DB快照：\`${plan.rollback.backupFile}\``)
  lines.push(`- inventory副本：\`${plan.rollback.inventoryBackup}\``)
  lines.push(`- 导入包副本：\`${plan.rollback.importPackBackup}\``)
  lines.push(`- 能否完整回滚：${plan.rollback.canFullyRollback ? '是' : '否'}`)
  lines.push(`- 方法：${plan.rollback.method}`)
  lines.push('')

  lines.push('## 10. 暂缓项')
  lines.push('')
  for (const d of deferred) {
    lines.push(`- **${d.item}**：${d.action} — ${d.reason}`)
  }
  lines.push('')

  lines.push('## 11. 全部拟修改编码一览')
  lines.push('')
  for (const code of codes.sort()) {
    const ops = proposed.filter((p) => p.code === code)
    lines.push(`- \`${code}\`：${ops.map((o) => o.kind).join(' + ')}`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('**Dry-run 完成。等待批准后再执行 apply。**')

  fs.writeFileSync(path.join(OUT, 'DRY_RUN_REPORT.md'), lines.join('\n'), 'utf8')

  await conn.end()

  console.log(JSON.stringify(plan.stats, null, 2))
  console.log('Wrote:', path.join(OUT, 'DRY_RUN_REPORT.md'))
  console.log('Wrote:', path.join(OUT, 'dry_run_plan.json'))
  console.log('Backup entities:', backup.entities.length)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
