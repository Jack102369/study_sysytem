import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { Logger } from '@nestjs/common'

export type AdvModelEntry = {
  id: string
  name?: string
  specialtyCode?: string
  knowledgePoints?: string[]
  abilities?: string[]
  breakthrough?: string
  coreMethods?: string[]
  commonErrors?: string[]
  reasoningSteps?: string[]
  variableConditions?: string[]
  stemStructure?: string
  variantDirections?: Record<string, string[]>
  dedupRules?: string[]
}

type CatalogFile = {
  models?: AdvModelEntry[]
}

let cached: {
  ok: boolean
  byId: Map<string, AdvModelEntry>
  pathTried: string[]
  error?: string
} | null = null

const logger = new Logger('ChemModelCatalog')

function candidatePaths(): string[] {
  const cwd = process.cwd()
  return [
    join(cwd, 'docs', 'chemistry_advanced_model', 'models_catalog.json'),
    join(cwd, '..', '..', 'docs', 'chemistry_advanced_model', 'models_catalog.json'),
    join(cwd, '..', 'docs', 'chemistry_advanced_model', 'models_catalog.json'),
    join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'docs',
      'chemistry_advanced_model',
      'models_catalog.json',
    ),
  ]
}

/** 安全加载；失败返回空目录，不抛错 */
export function loadAdvModelCatalog(forceReload = false) {
  if (cached && !forceReload) return cached
  const pathTried: string[] = []
  try {
    for (const p of candidatePaths()) {
      pathTried.push(p)
      if (!existsSync(p)) continue
      const raw = JSON.parse(readFileSync(p, 'utf8')) as CatalogFile
      const byId = new Map<string, AdvModelEntry>()
      for (const m of raw.models || []) {
        if (m?.id) byId.set(String(m.id), m)
      }
      cached = { ok: true, byId, pathTried }
      logger.log(`题型模型目录已加载 models=${byId.size} path=${p}`)
      return cached
    }
    cached = {
      ok: false,
      byId: new Map(),
      pathTried,
      error: 'models_catalog.json not found',
    }
    logger.warn(`题型模型目录未找到，变式匹配将退化为纯知识链接`)
    return cached
  } catch (e) {
    cached = {
      ok: false,
      byId: new Map(),
      pathTried,
      error: e instanceof Error ? e.message : String(e),
    }
    logger.warn(`题型模型目录读取失败: ${cached.error}`)
    return cached
  }
}

/** 两模型是否「相关」：共享 knowledgePoints 或 abilities；不得仅凭 specialty 前缀 */
export function modelsAreRelated(
  a: AdvModelEntry | undefined,
  b: AdvModelEntry | undefined,
): boolean {
  if (!a?.id || !b?.id) return false
  if (a.id === b.id) return true
  const kpA = new Set((a.knowledgePoints || []).map((x) => String(x).trim()).filter(Boolean))
  const kpB = (b.knowledgePoints || []).map((x) => String(x).trim()).filter(Boolean)
  if (kpB.some((x) => kpA.has(x))) return true
  const abA = new Set((a.abilities || []).map((x) => String(x).trim()).filter(Boolean))
  const abB = (b.abilities || []).map((x) => String(x).trim()).filter(Boolean)
  return abB.some((x) => abA.has(x))
}
