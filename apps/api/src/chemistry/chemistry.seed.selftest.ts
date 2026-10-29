/**
 * 化学专项种子静态自检 + ensureSeeded 分类 upsert 算法隔离模拟（无真实 DB）。
 * 运行：pnpm --filter api run chem:seed-selftest
 *
 * 报告须区分：
 * - 静态种子检查（本文件数组断言）
 * - 算法幂等模拟（内存 Map，非 MySQL）
 * - 真实数据库幂等验证（本脚本不执行）
 */
import { CHEM_SPECIALTY_SEEDS, type ChemCategorySeed } from './chemistry.seed'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const ORIGINAL_12 = [
  'equation',
  'experiment',
  'substance',
  'calculation',
  'ion',
  'redox',
  'periodic',
  'structure',
  'organic',
  'inference',
  'memory',
  'comprehensive',
] as const

/** STEP_03 正式定稿（D029） */
const INDUSTRIAL_CATEGORIES: ReadonlyArray<{
  code: string
  name: string
  sortOrder: number
}> = [
  { code: 'flow_diagram_read', name: '工业流程图识读', sortOrder: 1 },
  { code: 'raw_material_pretreatment', name: '工业原料与预处理', sortOrder: 2 },
  { code: 'industrial_reaction_principle', name: '工业反应原理', sortOrder: 3 },
  { code: 'industrial_reaction_conditions', name: '工业反应条件', sortOrder: 4 },
  { code: 'industrial_separation_purification', name: '工业分离与提纯', sortOrder: 5 },
  { code: 'industrial_gas_preparation', name: '工业气体制备与净化', sortOrder: 6 },
  { code: 'industrial_apparatus_analysis', name: '工业装置分析', sortOrder: 7 },
  { code: 'industrial_yield_calculation', name: '工业产率与计算', sortOrder: 8 },
  { code: 'industrial_resource_recycling', name: '工业资源循环利用', sortOrder: 9 },
  { code: 'industrial_environment_safety', name: '工业环保与安全', sortOrder: 10 },
  { code: 'industrial_production_cases', name: '典型工业生产案例', sortOrder: 11 },
  { code: 'flow_comprehensive', name: '工业流程综合分析', sortOrder: 12 },
]

/**
 * 模拟 ChemistryService.ensureSeeded 对分类的 upsert：
 * key = specialtyCode + ':' + categoryCode；再次运行不新增行、不换 id。
 */
function simulateCategoryUpsertIdempotent(
  specialtyCode: string,
  categories: ChemCategorySeed[],
): { firstCount: number; secondCount: number; idsStable: boolean } {
  type Row = { id: string; specialtyCode: string; code: string; name: string; sortOrder: number }
  const table = new Map<string, Row>()
  let seq = 1

  const applyOnce = () => {
    for (const cat of categories) {
      const key = `${specialtyCode}:${cat.code}`
      const existing = table.get(key)
      if (!existing) {
        table.set(key, {
          id: String(seq++),
          specialtyCode,
          code: cat.code,
          name: cat.name,
          sortOrder: cat.sortOrder,
        })
      } else {
        existing.name = cat.name
        existing.sortOrder = cat.sortOrder
      }
    }
  }

  applyOnce()
  const firstCount = table.size
  const idsAfterFirst = [...table.values()].map((r) => r.id).sort().join(',')
  applyOnce()
  const secondCount = table.size
  const idsAfterSecond = [...table.values()].map((r) => r.id).sort().join(',')
  return {
    firstCount,
    secondCount,
    idsStable: idsAfterFirst === idsAfterSecond,
  }
}

function main() {
  // —— 静态：一级专项 ——
  assert(CHEM_SPECIALTY_SEEDS.length === 13, `期望 13 专项，实际 ${CHEM_SPECIALTY_SEEDS.length}`)
  const codes = CHEM_SPECIALTY_SEEDS.map((s) => s.code)
  assert(new Set(codes).size === codes.length, '专项 code 不得重复')
  for (const c of ORIGINAL_12) {
    assert(codes.includes(c), `原专项缺失：${c}`)
  }

  const industrial = CHEM_SPECIALTY_SEEDS.find((s) => s.code === 'industrial_experiment')
  assert(!!industrial, '缺少 industrial_experiment')
  assert(industrial!.name === '工业实验', `名称错误：${industrial!.name}`)
  assert(industrial!.intro.includes('工业生产流程'), `简介不符合预期`)
  assert(industrial!.sortOrder === 13, `sortOrder 应为 13`)

  // —— 静态：工业实验 12 分类 ——
  assert(industrial!.categories.length === 12, `工业分类应为 12，实际 ${industrial!.categories.length}`)
  const catCodes = industrial!.categories.map((c) => c.code)
  assert(new Set(catCodes).size === 12, '工业分类 code 不得重复')
  for (let i = 0; i < INDUSTRIAL_CATEGORIES.length; i++) {
    const expect = INDUSTRIAL_CATEGORIES[i]
    const actual = industrial!.categories[i]
    assert(actual.sortOrder === expect.sortOrder, `分类排序位置 ${i + 1}`)
    assert(actual.sortOrder === i + 1, `sortOrder 应为 ${i + 1}`)
    assert(actual.code === expect.code, `分类 code 期望 ${expect.code} 实际 ${actual.code}`)
    assert(actual.name === expect.name, `分类 name 期望 ${expect.name} 实际 ${actual.name}`)
    assert(actual.code.length <= 64, `code 超长：${actual.code}`)
  }

  // —— 静态：experiment 16 分类不变 ——
  const experiment = CHEM_SPECIALTY_SEEDS.find((s) => s.code === 'experiment')
  assert(!!experiment, '缺少 experiment')
  assert(
    experiment!.categories.length === 16,
    `experiment 分类数应为 16，实际 ${experiment!.categories.length}`,
  )

  // —— 静态：其他原专项分类数未被清空 ——
  for (const c of ORIGINAL_12) {
    const sp = CHEM_SPECIALTY_SEEDS.find((s) => s.code === c)!
    assert(sp.categories.length > 0, `原专项 ${c} 分类不应为空`)
  }

  // —— 算法幂等模拟（非 MySQL）——
  const sim = simulateCategoryUpsertIdempotent('industrial_experiment', industrial!.categories)
  assert(sim.firstCount === 12, `模拟首次应 12 行，实际 ${sim.firstCount}`)
  assert(sim.secondCount === 12, `模拟二次应仍 12 行，实际 ${sim.secondCount}`)
  assert(sim.idsStable, '模拟二次运行不得更换分类 id')

  // eslint-disable-next-line no-console
  console.log(
    'chemistry.seed.selftest OK: 13 specialties; industrial 12 categories; experiment 16; upsert sim idempotent (no DB)',
  )
}

main()
