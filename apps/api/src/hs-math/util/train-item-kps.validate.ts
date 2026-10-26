import { BadRequestException } from '@nestjs/common'

/** 纯函数：关联列表与主 KP 规则（便于 selftest） */
export function assertPrimaryAmongLinks(opts: {
  knowledgePointIds: string[]
  primaryKnowledgePointId: string | null | undefined
}): { ids: string[]; primaryId: string | null } {
  const ids = [...new Set(opts.knowledgePointIds.map((x) => String(x).trim()).filter(Boolean))]
  if (ids.length !== opts.knowledgePointIds.length) {
    throw new BadRequestException('知识点关联存在重复或空 ID')
  }

  const rawPrimary = opts.primaryKnowledgePointId
  const primaryId =
    rawPrimary === undefined || rawPrimary === null || rawPrimary === ''
      ? null
      : String(rawPrimary).trim()

  if (ids.length === 0) {
    if (primaryId) {
      throw new BadRequestException('清空关联时不能指定主知识点')
    }
    return { ids: [], primaryId: null }
  }

  if (!primaryId) {
    throw new BadRequestException('有知识点关联时必须指定主知识点')
  }
  if (!ids.includes(primaryId)) {
    throw new BadRequestException('主知识点必须属于关联列表')
  }
  return { ids, primaryId }
}

export function assertSameSpecialty(
  itemSpecialtyId: string,
  kpSpecialtyId: string,
  kpCode: string,
) {
  if (String(itemSpecialtyId) !== String(kpSpecialtyId)) {
    throw new BadRequestException(
      `知识点 ${kpCode} 不属于题目所在章节（P1-0C 不允许跨章节关联）`,
    )
  }
}
