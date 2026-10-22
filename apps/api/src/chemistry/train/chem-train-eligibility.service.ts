import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { ChemTrainItem } from './entities/chem-train-item.entity'
import { ChemTrainItemLink } from './entities/chem-train-item-link.entity'
import { ChemTrainTestGrant } from './entities/chem-train-test-grant.entity'
import { User } from '../../users/user.entity'
import { KB_TABLE_BY_TYPE } from './train.constants'

export type EligibilityFailReason =
  | 'not_approved'
  | 'inactive'
  | 'ban_default'
  | 'verify_blocked'
  | 'curriculum_not_ok'
  | 'no_kb_links'
  | 'kb_missing'
  | 'kb_not_published'
  | 'kb_verify_or_limit'
  | 'pool_mismatch'
  | 'trial_blocked'

@Injectable()
export class ChemTrainEligibilityService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ChemTrainItemLink)
    private readonly linksRepo: Repository<ChemTrainItemLink>,
    @InjectRepository(ChemTrainTestGrant)
    private readonly grantsRepo: Repository<ChemTrainTestGrant>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  /**
   * 个人化学试运行权限：ADMIN 默认可用；普通 USER 必须存在 chem_train_test_grants 记录。
   * 不因 role=USER 默认开放。
   */
  async canUseTestPool(userId: string): Promise<boolean> {
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user || user.isDisabled) return false
    if (user.role === 'ADMIN') return true
    const grant = await this.grantsRepo.findOne({ where: { userId } })
    return !!grant
  }

  /**
   * 正式题准入（服务端硬规则，不依赖 reviewNote 文本作唯一 ACL）。
   * 测试题（AI试运行）：pool/status/active + 未标记 [trial_access:block]。
   * 来源知识仅 AI 初审、尚未人工审核 → 仍允许管理员试运行（gate 为 allow）。
   * 停用 filler / 无可靠来源 / 科学性阻断 → trial_access:block，不进入抽题。
   */
  async isItemEligible(
    item: ChemTrainItem,
    poolMode: 'formal' | 'test',
  ): Promise<{ ok: boolean; reason?: EligibilityFailReason; detail?: string }> {
    if (item.pool !== poolMode) {
      return { ok: false, reason: 'pool_mismatch' }
    }
    if (item.status !== 'approved') {
      return { ok: false, reason: 'not_approved' }
    }
    if (!item.isActive) {
      return { ok: false, reason: 'inactive' }
    }

    if (poolMode === 'test') {
      const note = String(item.gateNote || '')
      if (/\[trial_access:block\]/.test(note)) {
        return {
          ok: false,
          reason: 'trial_blocked',
          detail: '题目标记为禁止 AI 试运行抽题',
        }
      }
      return { ok: true }
    }

    // —— formal ——
    if (item.banDefaultTrain) {
      return { ok: false, reason: 'ban_default' }
    }
    if (item.verifyBlocked) {
      return { ok: false, reason: 'verify_blocked' }
    }
    if (!item.curriculumOk) {
      return { ok: false, reason: 'curriculum_not_ok' }
    }

    const links = await this.linksRepo.find({ where: { itemId: item.id } })
    if (!links.length) {
      return { ok: false, reason: 'no_kb_links', detail: '正式题必须关联已审核知识' }
    }

    for (const link of links) {
      const gate = await this.checkKbEntity(link.entityType, link.entityId)
      if (!gate.ok) return gate
    }
    return { ok: true }
  }

  async filterEligibleItems(
    items: ChemTrainItem[],
    poolMode: 'formal' | 'test',
  ): Promise<ChemTrainItem[]> {
    const out: ChemTrainItem[] = []
    for (const item of items) {
      const r = await this.isItemEligible(item, poolMode)
      if (r.ok) out.push(item)
    }
    return out
  }

  private async checkKbEntity(
    entityType: string,
    entityId: string,
  ): Promise<{ ok: boolean; reason?: EligibilityFailReason; detail?: string }> {
    const table = KB_TABLE_BY_TYPE[entityType]
    if (!table) {
      return { ok: false, reason: 'kb_missing', detail: `未知类型 ${entityType}` }
    }
    const rows = await this.dataSource.query(
      `SELECT id, status, review_note FROM ${table} WHERE id=? LIMIT 1`,
      [entityId],
    )
    const row = rows[0] as
      | { id: string; status: string; review_note: string }
      | undefined
    if (!row) {
      return { ok: false, reason: 'kb_missing', detail: `${entityType}:${entityId}` }
    }
    if (row.status !== 'published') {
      return {
        ok: false,
        reason: 'kb_not_published',
        detail: `${entityType}:${entityId} status=${row.status}`,
      }
    }
    const note = String(row.review_note || '')
    // 结构化禁令标记（补充字段检查之外的硬过滤）
    if (
      /verifyNeeded|待核实|excludeDefault|trainLimit:|禁默认|非默认核心/i.test(
        note,
      )
    ) {
      return {
        ok: false,
        reason: 'kb_verify_or_limit',
        detail: `${entityType}:${entityId}`,
      }
    }
    return { ok: true }
  }

  /** 批量：按 ids 取 links */
  async linksByItemIds(itemIds: string[]) {
    if (!itemIds.length) return []
    return this.linksRepo.find({ where: { itemId: In(itemIds) } })
  }
}
