/**
 * SVG 生成器自检（无 DB）。
 * pnpm --filter api run chem:industrial-svg-selftest
 */
import {
  ALL_DIAGRAM_FIXTURES,
  buildMetalRecoveryDiagram,
  buildSaltPurificationDiagram,
  buildSaltWithRecycleDiagram,
  buildSeawaterDiagram,
} from './industrial-diagram.fixtures'
import { computePublicContentHash } from './industrial-diagram.hash'
import { projectIndustrialDiagramPublic } from './industrial-diagram.project'
import { INDUSTRIAL_DIAGRAM_SCHEMA_VERSION } from './industrial-diagram.constants'
import type { IndustrialDiagramPublic } from './industrial-diagram.types'
import { validateIndustrialDiagramPublic } from './industrial-diagram.validate'
import { layoutIndustrialDiagram } from './industrial-svg-layout'
import { renderIndustrialDiagramSvg } from './industrial-svg-renderer'
import { INDUSTRIAL_SVG_RENDERER_VERSION } from './industrial-svg-types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

function pubFrom(def: ReturnType<typeof buildSaltPurificationDiagram>): IndustrialDiagramPublic {
  return projectIndustrialDiagramPublic(def)
}

function singleNodePublic(): IndustrialDiagramPublic {
  const draft: Omit<IndustrialDiagramPublic, 'publicContentHash'> = {
    schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
    diagramId: 'diag.single_node_test',
    diagramVersion: '1.0.0',
    orientation: 'left_to_right',
    title: '单节点',
    nodes: [{ id: 'n1', type: 'material', displayLabel: '原料A' }],
    edges: [],
  }
  return { ...draft, publicContentHash: computePublicContentHash(draft) }
}

function linearPublic(): IndustrialDiagramPublic {
  const draft: Omit<IndustrialDiagramPublic, 'publicContentHash'> = {
    schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
    diagramId: 'diag.linear_test',
    diagramVersion: '1.0.0',
    orientation: 'left_to_right',
    title: '线性',
    nodes: [
      { id: 'a', type: 'material', displayLabel: '原料' },
      { id: 'b', type: 'process', displayLabel: '处理' },
      { id: 'c', type: 'product', displayLabel: '产品' },
    ],
    edges: [
      { id: 'e1', from: 'a', to: 'b', type: 'material_flow' },
      { id: 'e2', from: 'b', to: 'c', type: 'material_flow' },
    ],
  }
  return { ...draft, publicContentHash: computePublicContentHash(draft) }
}

function dualRecyclePublic(): IndustrialDiagramPublic {
  const draft: Omit<IndustrialDiagramPublic, 'publicContentHash'> = {
    schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
    diagramId: 'diag.dual_recycle_test',
    diagramVersion: '1.0.0',
    orientation: 'left_to_right',
    title: '双回流',
    nodes: [
      { id: 'a', type: 'material', displayLabel: '原料' },
      { id: 'b', type: 'process', displayLabel: '反应' },
      { id: 'c', type: 'separation', displayLabel: '分离' },
      { id: 'd', type: 'product', displayLabel: '产品' },
      { id: 'r1', type: 'intermediate', displayLabel: '回收1' },
      { id: 'r2', type: 'intermediate', displayLabel: '回收2' },
    ],
    edges: [
      { id: 'e1', from: 'a', to: 'b', type: 'material_flow' },
      { id: 'e2', from: 'b', to: 'c', type: 'material_flow' },
      { id: 'e3', from: 'c', to: 'd', type: 'material_flow' },
      { id: 'rc1', from: 'c', to: 'r1', type: 'recycle' },
      { id: 'rc2', from: 'r1', to: 'b', type: 'recycle' },
      { id: 'rc3', from: 'c', to: 'r2', type: 'recycle' },
      { id: 'rc4', from: 'r2', to: 'a', type: 'recycle' },
    ],
  }
  return { ...draft, publicContentHash: computePublicContentHash(draft) }
}

function main() {
  // 1 单节点
  {
    const r = renderIndustrialDiagramSvg(singleNodePublic())
    assert(r.renderReport.valid, `single: ${r.renderReport.errors.join(',')}`)
    assert(r.svg.includes('viewBox'), 'viewBox')
    assert(r.svg.includes('xmlns="http://www.w3.org/2000/svg"'), 'xmlns')
  }

  // 2 线性
  {
    const r = renderIndustrialDiagramSvg(linearPublic())
    assert(r.renderReport.metrics.drawnNodeCount === 3, 'linear nodes')
    assert(r.renderReport.metrics.drawnEdgeCount === 2, 'linear edges')
  }

  // 3–7 fixtures: 分支/试剂/条件/副产/recycle
  for (const def of ALL_DIAGRAM_FIXTURES) {
    const pub = pubFrom(def)
    assert(validateIndustrialDiagramPublic(pub).valid, `public valid ${def.diagramId}`)
    const r = renderIndustrialDiagramSvg(pub)
    assert(r.renderReport.valid, `${def.diagramId}: ${r.renderReport.errors.join('|')}`)
    assert(
      r.renderReport.metrics.drawnNodeCount === pub.nodes.length,
      `nodes ${def.diagramId}`,
    )
    assert(
      r.renderReport.metrics.drawnEdgeCount === pub.edges.length,
      `edges ${def.diagramId}`,
    )
    assert(!r.svg.includes('answerLabel'), 'no answerLabel')
    assert(!r.svg.includes('reviewMetadata'), 'no review')
    assert(!r.svg.includes('unknownKey'), 'no unknownKey')
    assert(!r.svg.includes('<script'), 'no script')
    assert(r.renderReport.metrics.rendererVersion === INDUSTRIAL_SVG_RENDERER_VERSION, 'ver')
  }

  // 8 双 recycle
  {
    const r = renderIndustrialDiagramSvg(dualRecyclePublic())
    assert(r.renderReport.metrics.drawnEdgeCount === 7, 'dual recycle edges')
    assert(r.svg.includes('data-edge-type="recycle"'), 'recycle drawn')
  }

  // 9–11 中文/英文/化学式
  {
    const draft: Omit<IndustrialDiagramPublic, 'publicContentHash'> = {
      schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
      diagramId: 'diag.long_labels',
      diagramVersion: '1.0.0',
      orientation: 'left_to_right',
      title: '长标签测试',
      nodes: [
        {
          id: 'zh',
          type: 'process',
          displayLabel: '较长中文工艺处理步骤说明文字示例',
        },
        {
          id: 'en',
          type: 'process',
          displayLabel: 'LongEnglishProcessStepNameHere',
        },
        { id: 'chem', type: 'material', displayLabel: 'H2SO4 / FeCl3 / NaCl' },
        { id: 'unk', type: 'unknown', displayLabel: '操作①' },
      ],
      edges: [
        { id: 'e1', from: 'zh', to: 'en', type: 'material_flow' },
        { id: 'e2', from: 'en', to: 'chem', type: 'material_flow' },
        { id: 'e3', from: 'chem', to: 'unk', type: 'material_flow' },
      ],
    }
    const pub = { ...draft, publicContentHash: computePublicContentHash(draft) }
    const r = renderIndustrialDiagramSvg(pub)
    assert(r.renderReport.valid, `labels: ${r.renderReport.errors.join(',')}`)
    assert(r.svg.includes('H2SO4'), 'chem formula preserved')
    assert(r.svg.includes('操作①') || r.svg.includes('操作'), 'unknown op')
  }

  // 12–13 两种方向
  {
    const base = pubFrom(buildSeawaterDiagram())
    const draft: Omit<IndustrialDiagramPublic, 'publicContentHash'> = {
      schemaVersion: base.schemaVersion,
      diagramId: 'diag.seawater_ttb_test',
      diagramVersion: base.diagramVersion,
      orientation: 'top_to_bottom',
      title: base.title,
      nodes: base.nodes,
      edges: base.edges,
    }
    const ttb: IndustrialDiagramPublic = {
      ...draft,
      publicContentHash: computePublicContentHash(draft),
    }
    const layout = layoutIndustrialDiagram(ttb)
    const r = renderIndustrialDiagramSvg(ttb)
    assert(r.renderReport.valid, `ttb: ${r.renderReport.errors.join(',')}`)
    assert(layout.width > 0 && layout.height > 0, 'ttb layout size')
    assert(layoutIndustrialDiagram(base).width > 0, 'ltr layout size')
  }

  // 14 接近上限节点（不强制满 40，取 20）
  {
    const nodes = Array.from({ length: 20 }, (_, i) => ({
      id: `n${i}`,
      type: (i % 2 === 0 ? 'process' : 'material') as 'process' | 'material',
      displayLabel: `节点${i}`,
    }))
    const edges = Array.from({ length: 19 }, (_, i) => ({
      id: `e${i}`,
      from: `n${i}`,
      to: `n${i + 1}`,
      type: 'material_flow' as const,
    }))
    const draft: Omit<IndustrialDiagramPublic, 'publicContentHash'> = {
      schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
      diagramId: 'diag.near_limit',
      diagramVersion: '1.0.0',
      orientation: 'left_to_right',
      title: '近上限',
      nodes,
      edges,
    }
    const pub = { ...draft, publicContentHash: computePublicContentHash(draft) }
    const r = renderIndustrialDiagramSvg(pub)
    assert(r.renderReport.valid, `near limit: ${r.renderReport.errors.join(',')}`)
  }

  // 15 非法哈希
  {
    const pub = clone(pubFrom(buildSaltPurificationDiagram()))
    pub.publicContentHash = '0'.repeat(64)
    assert(!validateIndustrialDiagramPublic(pub).valid, 'bad hash')
    let threw = false
    try {
      renderIndustrialDiagramSvg(pub)
    } catch {
      threw = true
    }
    assert(threw, 'reject bad hash')
  }

  // 16 恶意文本转义
  {
    const draft: Omit<IndustrialDiagramPublic, 'publicContentHash'> = {
      schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
      diagramId: 'diag.xss_test',
      diagramVersion: '1.0.0',
      orientation: 'left_to_right',
      title: '安全',
      nodes: [
        {
          id: 'x',
          type: 'material',
          displayLabel: 'A & B <script>alert(1)</script>',
        },
      ],
      edges: [],
    }
    // CONTROL_OR_HTML 会拒绝含 <> 的标签——应拒绝而非渲染
    const pub = { ...draft, publicContentHash: computePublicContentHash(draft) }
    const v = validateIndustrialDiagramPublic(pub)
    assert(!v.valid, 'malicious label rejected by public validate')
  }

  // 17 特殊字符转义（合法标签）
  {
    const draft: Omit<IndustrialDiagramPublic, 'publicContentHash'> = {
      schemaVersion: INDUSTRIAL_DIAGRAM_SCHEMA_VERSION,
      diagramId: 'diag.amp_test',
      diagramVersion: '1.0.0',
      orientation: 'left_to_right',
      title: '转义',
      nodes: [{ id: 'x', type: 'material', displayLabel: 'NaCl & H2O' }],
      edges: [],
    }
    const pub = { ...draft, publicContentHash: computePublicContentHash(draft) }
    const r = renderIndustrialDiagramSvg(pub)
    assert(r.svg.includes('NaCl &amp; H2O'), 'amp escaped')
    assert(!r.svg.includes('NaCl & H2O'), 'raw amp not present')
  }

  // 18 稳定输出
  {
    const pub = pubFrom(buildMetalRecoveryDiagram())
    const a = renderIndustrialDiagramSvg(pub).svg
    const b = renderIndustrialDiagramSvg(pub).svg
    assert(a === b, 'stable svg')
  }

  // 19 内容变化输出变化
  {
    const pub = pubFrom(buildSaltPurificationDiagram())
    const a = renderIndustrialDiagramSvg(pub).svg
    const draft = {
      ...pub,
      title: `${pub.title}-v2`,
      publicContentHash: '',
    }
    draft.publicContentHash = computePublicContentHash(draft)
    const b = renderIndustrialDiagramSvg(draft).svg
    assert(a !== b, 'changed content changes svg')
  }

  // 20 Definition 不得直接喂给渲染器（有 internal 应被拒）
  {
    const def = buildSaltWithRecycleDiagram() as unknown as Record<string, unknown>
    let threw = false
    try {
      renderIndustrialDiagramSvg(def)
    } catch {
      threw = true
    }
    assert(threw, 'definition rejected')
  }

  // 21 不把 Definition 内部字段画进 SVG
  {
    const pub = pubFrom(buildSaltPurificationDiagram())
    const svg = renderIndustrialDiagramSvg(pub).svg
    assert(!svg.includes('caseCode'), 'no caseCode')
    assert(!svg.includes('internal'), 'no internal')
  }

  // eslint-disable-next-line no-console
  console.log('industrial-svg-selftest: OK')
}

main()
