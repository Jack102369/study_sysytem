/**
 * 工业流程图协议自检（无 DB）。
 * pnpm --filter api run chem:industrial-diagram-selftest
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { CASE_SALT_PURIFICATION } from './industrial-case.fixtures'
import { computeIndustrialCaseContentHash } from './industrial-case.hash'
import {
  ALL_DIAGRAM_FIXTURES,
  buildMetalRecoveryDiagram,
  buildSaltPurificationDiagram,
  buildSaltWithRecycleDiagram,
  buildSeawaterDiagram,
  fileNameForDiagram,
} from './industrial-diagram.fixtures'
import {
  computeDiagramContentHash,
  computePublicContentHash,
} from './industrial-diagram.hash'
import {
  projectIndustrialDiagramPublic,
  scanPublicForLeakRisk,
} from './industrial-diagram.project'
import {
  validateIndustrialDiagramAgainstCase,
  validateIndustrialDiagramDefinition,
} from './industrial-diagram.validate'
import type { IndustrialDiagramDefinition } from './industrial-diagram.types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

function withHash(d: Omit<IndustrialDiagramDefinition, 'diagramContentHash'>): IndustrialDiagramDefinition {
  return { ...d, diagramContentHash: computeDiagramContentHash(d) }
}

function diagramsDir(): string | null {
  const cwd = process.cwd()
  for (const root of [cwd, join(cwd, '..'), join(cwd, '..', '..')]) {
    const p = join(root, 'docs', 'chemistry_industrial_experiment', 'diagrams')
    if (existsSync(join(p, 'salt_purification_basic.diagram.json'))) return p
  }
  return null
}

function main() {
  // 1–3 合法线性 / 多分支 / recycle
  for (const [name, d] of [
    ['linear+unknown', buildSaltPurificationDiagram()],
    ['branch', buildSeawaterDiagram()],
    ['recycle', buildSaltWithRecycleDiagram()],
    ['reaction', buildMetalRecoveryDiagram()],
  ] as const) {
    const r = validateIndustrialDiagramDefinition(d)
    assert(r.valid, `${name} should valid: ${r.errors.map((e) => e.code).join(',')}`)
  }

  // 4 重复节点
  {
    const d = clone(buildSaltPurificationDiagram())
    d.nodes.push({ ...d.nodes[0] })
    d.diagramContentHash = computeDiagramContentHash(d)
    assert(!validateIndustrialDiagramDefinition(d).valid, 'dup node')
  }

  // 5 重复边
  {
    const d = clone(buildSaltPurificationDiagram())
    d.edges.push({ ...d.edges[0], id: d.edges[0].id })
    d.diagramContentHash = computeDiagramContentHash(d)
    assert(!validateIndustrialDiagramDefinition(d).valid, 'dup edge')
  }

  // 6–7 不存在起终点
  {
    const d = clone(buildSaltPurificationDiagram())
    d.edges[0].from = 'missing'
    d.diagramContentHash = computeDiagramContentHash(d)
    assert(
      validateIndustrialDiagramDefinition(d).errors.some((e) => e.code === 'UNKNOWN_EDGE_SOURCE'),
      'bad from',
    )
  }
  {
    const d = clone(buildSaltPurificationDiagram())
    d.edges[0].to = 'missing'
    d.diagramContentHash = computeDiagramContentHash(d)
    assert(
      validateIndustrialDiagramDefinition(d).errors.some((e) => e.code === 'UNKNOWN_EDGE_TARGET'),
      'bad to',
    )
  }

  // 8–9 非法类型
  {
    const d = clone(buildSaltPurificationDiagram())
    ;(d.nodes[0] as { type: string }).type = 'magic'
    d.diagramContentHash = computeDiagramContentHash(d)
    assert(!validateIndustrialDiagramDefinition(d).valid, 'bad node type')
  }
  {
    const d = clone(buildSaltPurificationDiagram())
    ;(d.edges[0] as { type: string }).type = 'teleport'
    d.diagramContentHash = computeDiagramContentHash(d)
    assert(!validateIndustrialDiagramDefinition(d).valid, 'bad edge type')
  }

  // 10 schemaVersion
  {
    const d = clone(buildSaltPurificationDiagram())
    d.schemaVersion = '9.9'
    d.diagramContentHash = computeDiagramContentHash(d)
    assert(
      validateIndustrialDiagramDefinition(d).errors.some((e) => e.code === 'INVALID_SCHEMA_VERSION'),
      'schema',
    )
  }

  // 11 普通流环路
  {
    const d = clone(buildSaltPurificationDiagram())
    d.edges.push({
      id: 'e_bad_cycle',
      from: 'n_product',
      to: 'n_raw',
      type: 'material_flow',
    })
    d.diagramContentHash = computeDiagramContentHash(d)
    assert(
      validateIndustrialDiagramDefinition(d).errors.some((e) => e.code === 'UNEXPECTED_FLOW_CYCLE'),
      'cycle',
    )
  }

  // 12 recycle 合法
  assert(validateIndustrialDiagramDefinition(buildSaltWithRecycleDiagram()).valid, 'recycle ok')

  // 13 过长标签
  {
    const d = clone(buildSaltPurificationDiagram())
    d.nodes[0].displayLabel = 'x'.repeat(50)
    d.diagramContentHash = computeDiagramContentHash(d)
    assert(!validateIndustrialDiagramDefinition(d).valid, 'long label')
  }

  // 14–15 过多节点/边
  {
    const d = clone(buildSaltPurificationDiagram())
    while (d.nodes.length <= 40) {
      const id = `n_extra_${d.nodes.length}`
      d.nodes.push({
        id,
        type: 'material',
        displayLabel: `M${d.nodes.length}`,
        displayRole: 'other',
        internal: {},
      })
    }
    d.diagramContentHash = computeDiagramContentHash(d)
    assert(
      validateIndustrialDiagramDefinition(d).errors.some((e) => e.code === 'TOO_MANY_NODES'),
      'too many nodes',
    )
  }

  // 16 非法 presentation
  {
    const d = clone(buildSaltPurificationDiagram())
    d.nodes[0].presentation = { shapeHint: 'rect', ...( { style: 'color:red' } as object) } as never
    d.diagramContentHash = computeDiagramContentHash(d)
    assert(!validateIndustrialDiagramDefinition(d).valid, 'bad presentation')
  }

  // 17 恶意 HTML 标签
  {
    const d = clone(buildSaltPurificationDiagram())
    d.nodes[0].displayLabel = '<script>alert(1)</script>'
    d.diagramContentHash = computeDiagramContentHash(d)
    assert(!validateIndustrialDiagramDefinition(d).valid, 'html label')
  }

  // 18–20 安全投影
  {
    const pub = projectIndustrialDiagramPublic(buildSaltPurificationDiagram())
    const leaks = scanPublicForLeakRisk(pub)
    assert(leaks.length === 0, `leaks: ${leaks.join(',')}`)
    const raw = JSON.stringify(pub)
    assert(!raw.includes('answerLabel'), 'no answerLabel')
    assert(!raw.includes('unknownKey'), 'no unknownKey')
    assert(!raw.includes('reviewMetadata'), 'no reviewMetadata')
    assert(!raw.includes('internalReferences'), 'no internalReferences')
    assert(!raw.includes('filtering') && !raw.includes('"过滤"'), 'no Chinese answer in public')
  }

  // 21–23 哈希
  {
    const a = buildSaltPurificationDiagram()
    const b = buildSaltPurificationDiagram()
    assert(a.diagramContentHash === b.diagramContentHash, 'stable diagram hash')
    const mutated = clone(a)
    mutated.title = `${mutated.title}!`
    assert(computeDiagramContentHash(mutated) !== a.diagramContentHash, 'diagram hash changes')
    const p1 = projectIndustrialDiagramPublic(a)
    const p2 = projectIndustrialDiagramPublic(a)
    assert(p1.publicContentHash === p2.publicContentHash, 'stable public hash')
    const pBad = clone(p1)
    pBad.title = `${pBad.title}!`
    assert(computePublicContentHash(pBad) !== p1.publicContentHash, 'public hash changes')
  }

  // 24–27 案例引用
  {
    const d = buildSaltPurificationDiagram()
    assert(validateIndustrialDiagramAgainstCase(d, CASE_SALT_PURIFICATION).valid, 'against case')
    const badVer = clone(d)
    badVer.caseVersion = '9.9.9'
    badVer.diagramContentHash = computeDiagramContentHash(badVer)
    assert(
      validateIndustrialDiagramAgainstCase(badVer, CASE_SALT_PURIFICATION).errors.some(
        (e) => e.code === 'CASE_VERSION_MISMATCH',
      ),
      'version mismatch',
    )
    const badHash = clone(d)
    badHash.caseContentHash = '0'.repeat(64)
    badHash.diagramContentHash = computeDiagramContentHash(badHash)
    assert(
      validateIndustrialDiagramAgainstCase(badHash, CASE_SALT_PURIFICATION).errors.some(
        (e) => e.code === 'CASE_HASH_MISMATCH',
      ),
      'hash mismatch',
    )
    const badMat = clone(d)
    badMat.nodes[0].internal.materialId = 'm_nope'
    badMat.diagramContentHash = computeDiagramContentHash(badMat)
    assert(
      validateIndustrialDiagramAgainstCase(badMat, CASE_SALT_PURIFICATION).errors.some(
        (e) => e.code === 'UNKNOWN_MATERIAL_REF',
      ),
      'bad material',
    )
    const badStep = clone(d)
    badStep.nodes[1].internal.stepId = 's_nope'
    badStep.diagramContentHash = computeDiagramContentHash(badStep)
    assert(
      validateIndustrialDiagramAgainstCase(badStep, CASE_SALT_PURIFICATION).errors.some(
        (e) => e.code === 'UNKNOWN_STEP_REF',
      ),
      'bad step',
    )
  }

  // 28 示例文件
  const dir = diagramsDir()
  assert(!!dir, 'diagrams dir missing')
  for (const d of ALL_DIAGRAM_FIXTURES) {
    const path = join(dir!, fileNameForDiagram(d))
    const raw = JSON.parse(readFileSync(path, 'utf8'))
    assert(validateIndustrialDiagramDefinition(raw).valid, `file ${path}`)
  }

  // 29 未审核
  assert(
    ALL_DIAGRAM_FIXTURES.every((d) => d.reviewMetadata.chemicallyReviewed === false),
    'not chemically reviewed',
  )
  assert(CASE_SALT_PURIFICATION.reviewStatus === 'draft', 'case still draft')
  assert(
    CASE_SALT_PURIFICATION.contentHash ===
      computeIndustrialCaseContentHash(CASE_SALT_PURIFICATION),
    'case hash intact',
  )

  // 30 无 DB — 本脚本无写入除只读文件
  void withHash

  // eslint-disable-next-line no-console
  console.log('industrial-diagram.selftest OK (no DB writes)')
}

main()
