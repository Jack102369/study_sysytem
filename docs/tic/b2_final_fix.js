/**
 * Batch2 final fix: 4 published + scope marks on Be/Ar/Fe/I/Cr.
 * Usage: node docs/chemistry_batch2_quality_fix/b2_final_fix.js [--apply]
 */
const fs = require('fs')
const path = require('path')

const APPLY = process.argv.includes('--apply')
const ROOT = path.resolve(__dirname, '../..')
const OUT = __dirname

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

async function main() {
  const env = loadEnv(path.join(ROOT, 'apps/api/.env'))
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

  // Fetch before
  const [els] = await conn.query(
    `SELECT * FROM chem_elements WHERE symbol IN ('O','Cl','Na','Be','Ar','Fe','I','Cr')`,
  )
  const [kps] = await conn.query(
    `SELECT * FROM chem_knowledge_points WHERE id=1 AND name='氧化还原反应' AND parent_id IS NULL`,
  )
  const bySym = Object.fromEntries(els.map((e) => [e.symbol, e]))
  const before = {
    backedUpAt: new Date().toISOString(),
    apply: APPLY,
    elements: bySym,
    kp_redox: kps[0] || null,
  }
  const backupFile = path.join(
    OUT,
    APPLY ? 'backup_before_b2_final_fix_apply.json' : 'backup_before_b2_final_fix_dryrun.json',
  )
  fs.writeFileSync(backupFile, JSON.stringify(before, null, 2), 'utf8')
  fs.writeFileSync(path.join(OUT, 'backup_before_b2_final_fix.json'), JSON.stringify(before, null, 2), 'utf8')

  // Planned updates (field-level)
  const elementUpdates = {
    O: {
      id: bySym.O.id,
      fields: {
        common_valences: '-2(通常);-1(过氧化物);+2(如OF2,拓展不进默认训练)',
        review_note: clipNote(
          '[el.O] 最终整改:补过氧化物-1;OF2中+2标拓展不进默认基础训练',
        ),
      },
    },
    Cl: {
      id: bySym.Cl.id,
      fields: {
        key_properties:
          '卤族典型元素。注意区分元素与单质：单质Cl2为黄绿色有毒气体，具漂白性等（见氯气物质条），不可把Cl2性质直接写成氯元素性质。',
        review_note: clipNote('[el.Cl] 最终整改:区分氯元素与Cl2单质性质'),
      },
    },
    Na: {
      id: bySym.Na.id,
      fields: {
        common_compounds: 'NaOH,NaCl,Na2O,Na2O2,Na2CO3',
        review_note: clipNote('[el.Na] 最终整改:common_compounds删除单质Na'),
      },
    },
    Be: {
      id: bySym.Be.id,
      fields: {
        key_properties: 'IIA族元素；高一以周期表基础了解为主，复杂两性/用途细节作了解',
        common_uses: '合金等（了解，不进默认基础训练）',
        review_note: clipNote(
          '[el.Be] 范围:保留基础信息；复杂性质/用途=了解，不进默认基础训练',
        ),
      },
    },
    Ar: {
      id: bySym.Ar.id,
      fields: {
        review_note: clipNote(
          '[el.Ar] 范围:保留基础信息；相对原子质量待所用教材附录核实(当前库约39.95)',
        ),
      },
    },
    Fe: {
      id: bySym.Fe.id,
      fields: {
        electron_config:
          '高一默认训练以Fe2+/Fe3+及化合物为主；完整[Ar] 3d6 4s2记号不进入默认基础训练（了解/待对教材）',
        review_note: clipNote(
          '[el.Fe] 范围:Fe2+/Fe3+核心；复杂电子排布不进默认高一基础训练',
        ),
      },
    },
    I: {
      id: bySym.I.id,
      fields: {
        common_valences: '-1(必修常见);+5,+7(拓展)',
        key_properties:
          '卤族；I2紫黑、淀粉变蓝可按必修使用；复杂正价作拓展，不进默认基础训练',
        review_note: clipNote(
          '[el.I] 范围:I2/-1/淀粉变蓝可用；复杂正价=拓展，不进默认基础训练',
        ),
      },
    },
    Cr: {
      id: bySym.Cr.id,
      fields: {
        common_compounds: '不锈钢相关(了解)',
        key_properties:
          '保留元素基础；不锈钢了解。重铬酸盐等复杂性质不得进入默认高一专项训练',
        review_note: clipNote(
          '[el.Cr] 范围:基础+不锈钢了解；重铬酸盐不进默认高一专项训练',
        ),
      },
    },
  }

  const kpUpdate = {
    id: 1,
    fields: {
      description:
        '氧化还原反应：有化合价升降（本质是电子转移）的反应。化合价升高、失电子→被氧化，该物质是还原剂；化合价降低、得电子→被还原，该物质是氧化剂。判断方法：看化合价是否变化，再找升/降对应还原剂/氧化剂。注意：氧化剂≠氧化产物，还原剂≠还原产物。属高一必修核心。',
      review_note: clipNote('[kp.redox] 最终整改:完善定义/升降/电子转移/氧化剂还原剂/判断'),
    },
  }

  // Validate varchar lengths
  for (const [sym, u] of Object.entries(elementUpdates)) {
    if (u.fields.common_valences && u.fields.common_valences.length > 64) {
      throw new Error(`common_valences too long for ${sym}: ${u.fields.common_valences.length}`)
    }
    if (u.fields.review_note && u.fields.review_note.length > 255) {
      throw new Error(`review_note too long for ${sym}`)
    }
    if (u.fields.electron_config && u.fields.electron_config.length > 128) {
      throw new Error(`electron_config too long for ${sym}: ${u.fields.electron_config.length}`)
    }
  }

  if (!APPLY) {
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          backupFile,
          planned: { elementUpdates, kpUpdate },
        },
        null,
        2,
      ),
    )
    await conn.end()
    return
  }

  await conn.beginTransaction()
  try {
    for (const u of Object.values(elementUpdates)) {
      const sets = Object.keys(u.fields)
        .map((k) => `${k}=?`)
        .join(', ')
      await conn.query(`UPDATE chem_elements SET ${sets} WHERE id=?`, [
        ...Object.values(u.fields),
        u.id,
      ])
    }
    await conn.query(
      `UPDATE chem_knowledge_points SET description=?, review_note=? WHERE id=? AND parent_id IS NULL`,
      [kpUpdate.fields.description, kpUpdate.fields.review_note, kpUpdate.id],
    )
    await conn.commit()
  } catch (e) {
    await conn.rollback()
    throw e
  }

  const [elsAfter] = await conn.query(
    `SELECT id, symbol, common_valences, key_properties, common_compounds, common_uses, electron_config, status, review_note
     FROM chem_elements WHERE symbol IN ('O','Cl','Na','Be','Ar','Fe','I','Cr')`,
  )
  const [kpAfter] = await conn.query(
    `SELECT id, name, description, status, review_note FROM chem_knowledge_points WHERE id=1`,
  )

  const validate = {
    O_has_minus1: String(bySym.O && elsAfter.find((e) => e.symbol === 'O').common_valences).includes('-1'),
    O_of2_marked: String(elsAfter.find((e) => e.symbol === 'O').common_valences).includes('拓展'),
    Cl_distinguishes: String(elsAfter.find((e) => e.symbol === 'Cl').key_properties).includes('Cl2'),
    Na_no_elemental: !String(elsAfter.find((e) => e.symbol === 'Na').common_compounds)
      .split(',')
      .map((s) => s.trim())
      .includes('Na'),
    kp_has_oxidant: String(kpAfter[0].description).includes('氧化剂'),
    Fe_scope: String(elsAfter.find((e) => e.symbol === 'Fe').electron_config).includes('不进入默认'),
    I_extent: String(elsAfter.find((e) => e.symbol === 'I').common_valences).includes('拓展'),
    Cr_scope: String(elsAfter.find((e) => e.symbol === 'Cr').key_properties).includes('重铬酸'),
    published_still: ['O', 'Cl', 'Na'].every(
      (s) => elsAfter.find((e) => e.symbol === s).status === 'published',
    ),
    kp_published: kpAfter[0].status === 'published',
  }
  validate.allPass = Object.values(validate).every(Boolean)

  const after = {
    appliedAt: new Date().toISOString(),
    elements: elsAfter,
    kp_redox: kpAfter[0],
    validate,
  }
  const afterFile = path.join(OUT, 'after_b2_final_fix.json')
  fs.writeFileSync(afterFile, JSON.stringify(after, null, 2), 'utf8')

  console.log(JSON.stringify({ mode: 'applied', backupFile, afterFile, validate }, null, 2))
  await conn.end()
  if (!validate.allPass) process.exit(2)
}

main().catch((e) => {
  console.error(String(e && e.stack ? e.stack : e))
  process.exit(1)
})
