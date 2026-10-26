import { BadRequestException } from '@nestjs/common'

/** 纯函数：方法关联列表与主方法规则（至多一个 primary） */
export function assertPrimaryAmongMethodLinks(opts: {
  methodIds: string[]
  primaryMethodId: string | null | undefined
}): { ids: string[]; primaryId: string | null } {
  const ids = [
    ...new Set(
      opts.methodIds.map((x) => String(x).trim()).filter(Boolean),
    ),
  ]
  if (ids.length !== opts.methodIds.length) {
    throw new BadRequestException('方法关联存在重复或空 ID')
  }

  const rawPrimary = opts.primaryMethodId
  const primaryId =
    rawPrimary === undefined || rawPrimary === null || rawPrimary === ''
      ? null
      : String(rawPrimary).trim()

  if (ids.length === 0) {
    if (primaryId) {
      throw new BadRequestException('清空方法关联时不能指定主方法')
    }
    return { ids: [], primaryId: null }
  }

  if (primaryId && !ids.includes(primaryId)) {
    throw new BadRequestException('主方法必须属于关联列表')
  }
  return { ids, primaryId }
}
