import { BadRequestException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { HsMathKnowledgePoint } from '../entities/hs-math-knowledge-point.entity'

/**
 * 校验 parentId：非自引用、同 specialty、无环（沿父链向上，深度上限防无限）。
 */
export async function assertValidKpParent(
  repo: Repository<HsMathKnowledgePoint>,
  opts: {
    kpId: string | null
    parentId: string | null
    specialtyId: string
  },
): Promise<HsMathKnowledgePoint | null> {
  const parentId = opts.parentId
  if (parentId == null || parentId === '') return null

  if (opts.kpId && parentId === opts.kpId) {
    throw new BadRequestException('parentId 不能指向自身')
  }

  const parent = await repo.findOne({ where: { id: parentId } })
  if (!parent) {
    throw new BadRequestException(`父知识点不存在：${parentId}`)
  }
  if (parent.specialtyId !== opts.specialtyId) {
    throw new BadRequestException('父知识点必须与当前知识点同属一章')
  }

  // 若更新已有 KP：父链上不得出现自己（避免环）
  if (opts.kpId) {
    let cursor: string | null = parentId
    const seen = new Set<string>()
    let depth = 0
    while (cursor) {
      if (cursor === opts.kpId) {
        throw new BadRequestException('parentId 会形成循环依赖')
      }
      if (seen.has(cursor) || depth > 32) {
        throw new BadRequestException('知识点父子链异常（疑似环）')
      }
      seen.add(cursor)
      const row: HsMathKnowledgePoint | null = await repo.findOne({
        where: { id: cursor },
        select: ['id', 'parentId'],
      })
      cursor = row?.parentId ?? null
      depth += 1
    }
  }

  return parent
}
