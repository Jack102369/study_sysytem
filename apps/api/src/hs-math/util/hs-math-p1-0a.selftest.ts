/**
 * P1-0A 静态自检：迁移 SQL / init 种子 / Entity 对照（不连库、不执行迁移）。
 * 运行：pnpm --filter api run hs-math:p1-0a-selftest
 */
import * as fs from 'fs'
import * as path from 'path'

const ROOT = path.resolve(__dirname, '../../../../../')
const MIGRATE = path.join(ROOT, 'db/migrate_hs_math_p1_0.sql')
const INIT = path.join(ROOT, 'db/init.sql')
const ENTITY_KP = path.join(
  ROOT,
  'apps/api/src/hs-math/entities/hs-math-knowledge-point.entity.ts',
)
const ENTITY_ITEM_KP = path.join(
  ROOT,
  'apps/api/src/hs-math/entities/hs-math-train-item-kp.entity.ts',
)
const ENTITY_SESS_ITEM = path.join(
  ROOT,
  'apps/api/src/hs-math/entities/hs-math-train-session-item.entity.ts',
)

const SECTION_EXPECT: Record<string, string[]> = {
  'rja-ch1': ['1.1', '1.2', '1.3', '1.4', '1.5', 'default'],
  'rja-ch2': ['2.1', '2.2', '2.3', 'default'],
  'rja-ch3': ['3.1', '3.2', '3.3', '3.4', 'default'],
  'rja-ch4': ['4.1', '4.2', '4.3', '4.4', '4.5', 'default'],
  'rja-ch5': ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', 'default'],
  'rjb-ch1': ['6.1', '6.2', '6.3', '6.4', 'default'],
  'rjb-ch2': ['7.1', '7.2', '7.3', 'default'],
  'rjb-ch3': ['8.1', '8.2', '8.3', '8.4', '8.5', '8.6', 'default'],
  'rjb-ch4': ['9.1', '9.2', '9.3', 'default'],
  'rjb-ch5': ['10.1', '10.2', '10.3', 'default'],
}

const CH1_KP_CODES = [
  'rja.1.1.01',
  'rja.1.1.02',
  'rja.1.1.03',
  'rja.1.2.01',
  'rja.1.2.02',
  'rja.1.3.01',
  'rja.1.3.02',
  'rja.1.3.03',
  'rja.1.3.04',
  'rja.1.4.01',
  'rja.1.4.02',
  'rja.1.4.03',
  'rja.1.5.01',
  'rja.1.5.02',
  'rja.1.5.03',
]

function fail(msg: string): never {
  console.error('FAIL:', msg)
  process.exit(1)
}

function assert(cond: boolean, msg: string) {
  if (!cond) fail(msg)
  console.log('PASS:', msg)
}

function extractQuotedCodes(sql: string, pattern: RegExp): string[] {
  const out: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
  while ((m = re.exec(sql)) !== null) {
    out.push(m[1])
  }
  return out
}

function main() {
  assert(fs.existsSync(MIGRATE), 'migrate_hs_math_p1_0.sql 存在')
  assert(fs.existsSync(INIT), 'init.sql 存在')

  const migrate = fs.readFileSync(MIGRATE, 'utf8')
  const init = fs.readFileSync(INIT, 'utf8')
  const entKp = fs.readFileSync(ENTITY_KP, 'utf8')
  const entItemKp = fs.readFileSync(ENTITY_ITEM_KP, 'utf8')
  const entSess = fs.readFileSync(ENTITY_SESS_ITEM, 'utf8')

  const migrateNoComments = migrate
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
  assert(
    !/\bDROP\s+TABLE\b/i.test(migrateNoComments) &&
      !/\bTRUNCATE\b/i.test(migrateNoComments),
    '迁移无 DROP TABLE / TRUNCATE 语句',
  )
  assert(
    !/\bDELETE\s+FROM\s+hs_math_train_sessions\b/i.test(migrateNoComments),
    '迁移不清理历史会话',
  )
  assert(
    !/\bCREATE\s+TABLE\b[^;]*\bchem_/i.test(migrateNoComments) &&
      !/\berror_questions\b/i.test(migrateNoComments),
    '迁移不触及 chem_/error_questions',
  )
  assert(
    migrate.includes('CREATE TABLE IF NOT EXISTS hs_math_knowledge_points'),
    '迁移含 knowledge_points',
  )
  assert(
    migrate.includes('CREATE TABLE IF NOT EXISTS hs_math_train_item_kps'),
    '迁移含 train_item_kps',
  )
  assert(
    migrate.includes('knowledge_point_codes_json'),
    '迁移含 KP codes 快照列',
  )
  assert(
    migrate.includes('primary_knowledge_point_code'),
    '迁移含主 KP code 快照列',
  )

  assert(
    init.includes('CREATE TABLE IF NOT EXISTS hs_math_knowledge_points'),
    'init 含 knowledge_points',
  )
  assert(
    init.includes('CREATE TABLE IF NOT EXISTS hs_math_train_item_kps'),
    'init 含 train_item_kps',
  )
  assert(
    init.includes('knowledge_point_codes_json'),
    'init session_items 含 KP codes 快照',
  )

  // Entity ↔ SQL 字段名
  for (const col of [
    'code',
    'name',
    'specialty_id',
    'category_id',
    'parent_id',
    'summary',
    'sort_order',
    'is_active',
  ]) {
    assert(
      entKp.includes(col) && migrate.includes(col),
      `KP Entity/SQL 含 ${col}`,
    )
  }
  for (const col of ['item_id', 'knowledge_point_id', 'is_primary', 'sort_order']) {
    assert(
      entItemKp.includes(col) && migrate.includes(col),
      `item_kps Entity/SQL 含 ${col}`,
    )
  }
  assert(
    entSess.includes('knowledge_point_codes_json') &&
      entSess.includes('primary_knowledge_point_code'),
    'session_item Entity 含快照字段',
  )

  // 小节 code 出现（migrate）
  for (const [sp, codes] of Object.entries(SECTION_EXPECT)) {
    assert(migrate.includes(`'${sp}'`) || sp === 'default', `迁移提及 ${sp}`)
    for (const code of codes) {
      if (code === 'default') continue
      assert(
        migrate.includes(`'${code}'`) && init.includes(`'${code}'`),
        `小节 ${sp}/${code} 在 migrate+init`,
      )
    }
  }

  // default 保留
  assert(
    migrate.includes("c.code = 'default'") || migrate.includes("code = 'default'"),
    '迁移保留/调整 default 排序',
  )
  assert(init.includes("'default'") && init.includes('综合练习'), 'init 保留 default')

  // 禁止未核实案例名入库
  assert(
    !migrate.includes('公司员工') && !init.includes('公司员工'),
    '未核实案例名「公司员工」未入库',
  )

  // KP code 唯一 + 数量
  const kpInMigrate = CH1_KP_CODES.filter((c) => migrate.includes(`'${c}'`))
  assert(kpInMigrate.length === 15, `第一章 KP 种子 15 个（实际 ${kpInMigrate.length}）`)
  assert(
    CH1_KP_CODES.every((c) => init.includes(`'${c}'`)),
    'init 含全部第一章 KP code',
  )
  const dupCheck = new Set(CH1_KP_CODES)
  assert(dupCheck.size === 15, '第一章 KP code 列表无重复')

  // 归属小节：code 前缀与 section
  const sectionOf: Record<string, string> = {
    'rja.1.1.01': '1.1',
    'rja.1.1.02': '1.1',
    'rja.1.1.03': '1.1',
    'rja.1.2.01': '1.2',
    'rja.1.2.02': '1.2',
    'rja.1.3.01': '1.3',
    'rja.1.3.02': '1.3',
    'rja.1.3.03': '1.3',
    'rja.1.3.04': '1.3',
    'rja.1.4.01': '1.4',
    'rja.1.4.02': '1.4',
    'rja.1.4.03': '1.4',
    'rja.1.5.01': '1.5',
    'rja.1.5.02': '1.5',
    'rja.1.5.03': '1.5',
  }
  for (const [code, sec] of Object.entries(sectionOf)) {
    const mid = sec.split('.')[1]
    assert(
      code.startsWith(`rja.1.${mid}.`),
      `KP ${code} 编码归属小节 ${sec}`,
    )
    assert(migrate.includes(`'${sec}'`), `小节 ${sec} 存在（供 KP 关联）`)
  }

  // FK 约束名出现
  assert(migrate.includes('fk_hs_math_kp_specialty'), 'FK specialty')
  assert(migrate.includes('fk_hs_math_kp_category'), 'FK category')
  assert(migrate.includes('fk_hs_math_item_kp_item'), 'FK item_kps.item')
  assert(migrate.includes('fk_hs_math_item_kp_kp'), 'FK item_kps.kp')

  // 旧会话兼容：快照列可 NULL
  assert(
    /knowledge_point_codes_json\s+JSON\s+NULL/i.test(migrate) ||
      migrate.includes("knowledge_point_codes_json JSON NULL"),
    'KP codes 列允许 NULL',
  )
  assert(
    migrate.includes('primary_knowledge_point_code VARCHAR(64) NULL'),
    '主 KP code 列允许 NULL',
  )

  // 小节总数（不含 default）：43 = 5+3+4+5+7+4+3+6+3+3
  const numbered = Object.values(SECTION_EXPECT)
    .flat()
    .filter((c) => c !== 'default')
  assert(numbered.length === 43, `编号小节共 43（实际 ${numbered.length}）`)
  assert(new Set(numbered).size === numbered.length, '编号小节 code 全局不重复')

  void extractQuotedCodes
  console.log('P1-0A static selftest: ALL PASS')
  console.log('NOTE: DB migrate NOT_RUN（本脚本不连库）')
}

main()
