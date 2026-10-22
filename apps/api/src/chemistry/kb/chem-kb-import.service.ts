import { Injectable } from '@nestjs/common'
import {
  CHEM_ENTITY_TYPES,
  CHEM_KB_STATUSES,
  type ChemEntityType,
  type ChemKbStatus,
} from './kb.constants'
import { ChemKbImportDto } from './dto/kb.dto'
import { ChemKbService } from './chem-kb.service'

type ImportResultItem = {
  index: number
  type: string
  ok: boolean
  id?: string
  errors: string[]
}

const REQUIRED: Record<ChemEntityType, string[]> = {
  element: ['symbol', 'nameZh', 'atomicNumber'],
  substance: ['name', 'canonicalFormula'],
  reaction: ['name', 'canonicalEquation', 'equation'],
  experiment: ['name'],
  formula: ['name', 'expression'],
  concept: ['name'],
  knowledge: ['name'],
  question: ['qtype', 'stem', 'answer'],
}

@Injectable()
export class ChemKbImportService {
  constructor(private readonly kb: ChemKbService) {}

  async importBatch(dto: ChemKbImportDto, userId: string) {
    const results: ImportResultItem[] = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < dto.items.length; i++) {
      const item = dto.items[i]
      const errors: string[] = []
      const typeRaw = item?.type
      const data =
        item?.data && typeof item.data === 'object'
          ? { ...(item.data as Record<string, unknown>) }
          : null

      if (!(CHEM_ENTITY_TYPES as readonly string[]).includes(typeRaw)) {
        errors.push(`不支持的类型：${String(typeRaw)}`)
      }
      if (!data) {
        errors.push('data 必须为对象')
      }

      if (errors.length) {
        failCount++
        results.push({ index: i, type: String(typeRaw ?? ''), ok: false, errors })
        continue
      }

      const type = typeRaw as ChemEntityType
      for (const field of REQUIRED[type]) {
        const v = data![field]
        if (v === undefined || v === null || String(v).trim() === '') {
          errors.push(`缺少必填字段：${field}`)
        }
      }

      try {
        const dupId = await this.kb.findDuplicate(type, data!)
        if (dupId) {
          errors.push(`重复记录已存在（id=${dupId}）`)
        }
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }

      if (errors.length) {
        failCount++
        results.push({ index: i, type, ok: false, errors })
        continue
      }

      // 默认 draft；合法 status 可保留；反应 published 且未验证则强制降级
      data!.status = this.resolveImportStatus(type, data!)

      try {
        const created = (await this.kb.create(type, data!, userId)) as {
          id: string
        }
        successCount++
        results.push({
          index: i,
          type,
          ok: true,
          id: String(created.id),
          errors: [],
        })
      } catch (e) {
        failCount++
        results.push({
          index: i,
          type,
          ok: false,
          errors: [e instanceof Error ? e.message : String(e)],
        })
      }
    }

    return { successCount, failCount, results }
  }

  private resolveImportStatus(
    type: ChemEntityType,
    data: Record<string, unknown>,
  ): ChemKbStatus {
    const raw = data.status
    let status: ChemKbStatus = 'draft'
    if (
      typeof raw === 'string' &&
      (CHEM_KB_STATUSES as readonly string[]).includes(raw)
    ) {
      status = raw as ChemKbStatus
    }

    // AI 导入不得直接放行未验证反应为 published
    if (type === 'reaction' && status === 'published' && !data.isVerified) {
      return 'pending_review'
    }
    return status
  }
}
