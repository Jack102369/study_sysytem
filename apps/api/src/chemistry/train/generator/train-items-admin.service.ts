import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import type { ListTrainItemsAdminQueryDto } from './train-items-admin.dto'

function parseGate(note: string) {
  const n = String(note || '')
  const qa = (n.match(/\[qa:([^\]]+)\]/) || [])[1] || null
  const verifyClass = (n.match(/\[verify_class:([^\]]+)\]/) || [])[1] || null
  const trialAccess = (n.match(/\[trial_access:([^\]]+)\]/) || [])[1] || null
  return { qa, verifyClass, trialAccess }
}

@Injectable()
export class TrainItemsAdminService {
  constructor(private readonly dataSource: DataSource) {}

  async list(query: ListTrainItemsAdminQueryDto) {
    const page = query.page || 1
    const pageSize = query.pageSize || 20
    const where: string[] = ['1=1']
    const params: unknown[] = []

    if (query.pool) {
      where.push('i.pool=?')
      params.push(query.pool)
    }
    if (query.specialtyCode) {
      where.push('s.code=?')
      params.push(query.specialtyCode)
    }
    if (query.categoryCode) {
      where.push('c.code=?')
      params.push(query.categoryCode)
    }
    if (query.qa) {
      where.push(`i.gate_note LIKE ?`)
      params.push(`%[qa:${query.qa}]%`)
    }
    if (query.trialFilter === 'allow') {
      where.push(`i.gate_note LIKE '%[trial_access:allow]%'`)
      where.push('i.is_active=1')
      where.push(`i.status='approved'`)
    } else if (query.trialFilter === 'block') {
      where.push(
        `(i.gate_note LIKE '%[trial_access:block]%' OR i.is_active=0)`,
      )
    } else if (query.trialFilter === 'pending_human') {
      where.push(`i.gate_note LIKE '%[verify_class:kb_pending]%'`)
    }
    if (query.q) {
      where.push('(i.code LIKE ? OR i.stem LIKE ?)')
      params.push(`%${query.q}%`, `%${query.q}%`)
    }

    const whereSql = where.join(' AND ')
    // TypeORM DataSource.query 直接返回行数组（不是 mysql2 的 [rows, fields]）
    const countRows: Array<{ total: number | string }> =
      await this.dataSource.query(
        `SELECT COUNT(1) AS total
       FROM chem_train_items i
       JOIN chem_specialties s ON s.id=i.specialty_id
       JOIN chem_categories c ON c.id=i.category_id
       WHERE ${whereSql}`,
        params,
      )
    const total = Number(countRows[0]?.total || 0)
    const offset = (page - 1) * pageSize
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT i.id, i.code, i.pool, i.qtype, i.answer_type, i.stem, i.answer,
              i.difficulty, i.status, i.is_active, i.gate_note, i.ban_default_train,
              i.verify_blocked, i.analysis,
              s.code AS specialty_code, s.name AS specialty_name,
              c.code AS category_code, c.name AS category_name
       FROM chem_train_items i
       JOIN chem_specialties s ON s.id=i.specialty_id
       JOIN chem_categories c ON c.id=i.category_id
       WHERE ${whereSql}
       ORDER BY i.id DESC
       LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
      params,
    )

    const ids = rows.map((r) => String(r.id))
    const links: {
      item_id: string
      entity_type: string
      entity_id: string
    }[] = ids.length
      ? await this.dataSource.query(
          `SELECT item_id, entity_type, entity_id FROM chem_train_item_links
           WHERE item_id IN (${ids.map(() => '?').join(',')})`,
          ids,
        )
      : []
    const linksByItem = new Map<string, typeof links>()
    for (const l of links) {
      const k = String(l.item_id)
      if (!linksByItem.has(k)) linksByItem.set(k, [])
      linksByItem.get(k)!.push(l)
    }

    // enrich source codes + kb status
    const items = []
    for (const r of rows) {
      const gate = parseGate(String(r.gate_note || ''))
      const ls = linksByItem.get(String(r.id)) || []
      const sources = []
      for (const l of ls) {
        const table =
          {
            element: 'chem_elements',
            substance: 'chem_substances',
            reaction: 'chem_reactions',
            experiment: 'chem_experiments',
            formula: 'chem_formulas',
            concept: 'chem_concepts',
            knowledge: 'chem_knowledge_points',
          }[l.entity_type] || null
        let kbStatus = null
        let kbNote = ''
        let kbCode = null
        if (table) {
          const kbRows: Array<{ status: string; review_note: string | null }> =
            await this.dataSource.query(
              `SELECT status, review_note FROM ${table} WHERE id=? LIMIT 1`,
              [l.entity_id],
            )
          if (kbRows[0]) {
            kbStatus = kbRows[0].status
            kbNote = String(kbRows[0].review_note || '')
            const m = kbNote.match(/\[inv:([^\]]+)\]/)
            kbCode = m ? m[1] : null
          }
        }
        sources.push({
          entityType: l.entity_type,
          entityId: String(l.entity_id),
          kbCode,
          kbStatus,
          humanUnreviewed: /\[ai_trial\]|human_unreviewed/.test(kbNote),
        })
      }

      const trialAllowed =
        !!r.is_active &&
        r.status === 'approved' &&
        gate.trialAccess === 'allow'
      const formalAllowed = false
      let limitReason = ''
      if (!r.is_active) limitReason = '题目已停用'
      else if (gate.trialAccess === 'block') limitReason = '禁止 AI 试运行抽题'
      else if (gate.verifyClass === 'kb_pending')
        limitReason = '来源知识待人工审核（允许管理员试运行，禁止正式）'
      else if (gate.verifyClass === 'science') limitReason = '科学性待处理'
      else if (gate.verifyClass === 'curriculum') limitReason = '课程范围待核实'
      else if (gate.verifyClass === 'qtype_limit')
        limitReason = '题型/训练价值限制（仍可试运行）'

      items.push({
        id: String(r.id),
        code: r.code,
        stem: r.stem,
        qtype: r.qtype,
        answerType: r.answer_type,
        answer: r.answer,
        difficulty: r.difficulty,
        specialtyCode: r.specialty_code,
        specialtyName: r.specialty_name,
        categoryCode: r.category_code,
        categoryName: r.category_name,
        pool: r.pool,
        status: r.status,
        isActive: !!r.is_active,
        qaConclusion: gate.qa,
        verifyClass: gate.verifyClass,
        trialAccess: gate.trialAccess,
        trialAllowed,
        formalAllowed,
        limitReason,
        sources,
        analysis: r.analysis,
        gateNote: r.gate_note,
      })
    }

    const statsRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT
         SUM(CASE WHEN is_active=1 AND status='approved' AND pool='test'
           AND gate_note LIKE '%[trial_access:allow]%' THEN 1 ELSE 0 END) AS trial_allow,
         SUM(CASE WHEN gate_note LIKE '%[trial_access:block]%' OR is_active=0 THEN 1 ELSE 0 END) AS trial_block,
         SUM(CASE WHEN gate_note LIKE '%[qa:PASS]%' THEN 1 ELSE 0 END) AS qa_pass,
         SUM(CASE WHEN gate_note LIKE '%[qa:NEEDS_FIX]%' THEN 1 ELSE 0 END) AS qa_fix,
         SUM(CASE WHEN gate_note LIKE '%[qa:NEEDS_VERIFICATION]%' THEN 1 ELSE 0 END) AS qa_verify,
         SUM(CASE WHEN gate_note LIKE '%[verify_class:kb_pending]%' THEN 1 ELSE 0 END) AS class_kb_pending,
         SUM(CASE WHEN gate_note LIKE '%[verify_class:science]%' THEN 1 ELSE 0 END) AS class_science,
         SUM(CASE WHEN gate_note LIKE '%[verify_class:qtype_limit]%' THEN 1 ELSE 0 END) AS class_qtype,
         SUM(CASE WHEN gate_note LIKE '%[verify_class:curriculum]%' THEN 1 ELSE 0 END) AS class_curriculum,
         COUNT(1) AS total
       FROM chem_train_items`,
    )

    return {
      total,
      page,
      pageSize,
      items,
      stats: statsRows[0] || {},
    }
  }
}
