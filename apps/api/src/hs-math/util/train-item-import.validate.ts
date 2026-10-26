import { BadRequestException } from '@nestjs/common'
import { HS_MATH_DIFFICULTIES, HS_MATH_QTYPES } from '../hs-math.constants'
import type {
  HsMathImportIssue,
  HsMathImportItemReport,
} from '../types/import-protocol'
import {
  assertNonEmptyStem,
  validateAnswerPayload,
} from './answer-payload.validate'
import { assertValidSourceFields } from './hs-math-source.validate'

const CODE_RE = /^[A-Za-z][A-Za-z0-9._-]{1,62}$/
const FORBIDDEN_CODE_PREFIXES = [
  'HS_MATH_P0_',
  'HS_MATH_IMPORT_DEMO_',
]
const DEMO_CODE_RE = /^(DEMO|EXAMPLE|SAMPLE)\./i

export function isForbiddenTrainItemCode(code: string): boolean {
  const c = code.trim()
  if (DEMO_CODE_RE.test(c)) return true
  return FORBIDDEN_CODE_PREFIXES.some((p) =>
    c.toUpperCase().startsWith(p.toUpperCase()),
  )
}

/**
 * 批准门禁：禁止进入正式训练池的 code 前缀。
 * 允许导入为 draft 的 IT 标记题（HS_MATH_P1_0D1_IT_）亦不可批准。
 */
export function isBlockedFromApprove(code: string): boolean {
  const c = code.trim().toUpperCase()
  if (isForbiddenTrainItemCode(code)) return true
  if (c.startsWith('HS_MATH_P1_0D1_IT_')) return true
  if (c.startsWith('HS_MATH_P1_0D1_')) return true
  if (c.startsWith('HS_MATH_P1_0FC3C1_IT_')) return true
  return false
}

/** 人工审核队列排除：IT/E2E/演示题，避免混入正式待审列表 */
export function isExcludedFromReviewQueue(code: string): boolean {
  const c = code.trim().toUpperCase()
  if (isBlockedFromApprove(code)) return true
  if (c.startsWith('HS_MATH_P1_0FC3C1_IT_')) return true
  if (c.startsWith('HS_MATH_IMPORT_DEMO_')) return true
  return false
}

export function normalizeStemForDedupe(stem: string): string {
  return String(stem || '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

function push(
  list: HsMathImportIssue[],
  level: 'error' | 'warning',
  code: string,
  message: string,
) {
  list.push({ level, code, message })
}

/** 单题结构校验（不查库）；返回 errors/warnings */
export function validateImportItemStructure(
  raw: unknown,
  index: number,
): HsMathImportItemReport {
  const errors: HsMathImportIssue[] = []
  const warnings: HsMathImportIssue[] = []
  const codeHint =
    raw && typeof raw === 'object' && typeof (raw as any).code === 'string'
      ? String((raw as any).code).trim() || `index-${index}`
      : `index-${index}`

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    push(errors, 'error', 'NOT_OBJECT', '题目必须为对象')
    return { index, code: codeHint, ok: false, errors, warnings }
  }
  const o = raw as Record<string, unknown>

  if ('status' in o) {
    push(errors, 'error', 'STATUS_FORBIDDEN', '不允许指定 status')
  }
  if ('contentVersion' in o || 'content_version' in o) {
    push(errors, 'error', 'VERSION_FORBIDDEN', '不允许指定 contentVersion')
  }

  const code = typeof o.code === 'string' ? o.code.trim() : ''
  if (!code) push(errors, 'error', 'CODE_REQUIRED', '缺少 code')
  else if (!CODE_RE.test(code)) {
    push(errors, 'error', 'CODE_FORMAT', 'code 格式非法')
  } else if (isForbiddenTrainItemCode(code)) {
    push(
      errors,
      'error',
      'CODE_FORBIDDEN',
      '禁止导入测试/演示前缀（HS_MATH_P0_ / DEMO. / EXAMPLE. / SAMPLE.）',
    )
  }

  const specialtyCode =
    typeof o.specialtyCode === 'string' ? o.specialtyCode.trim() : ''
  const categoryCode =
    typeof o.categoryCode === 'string' ? o.categoryCode.trim() : ''
  if (!specialtyCode) {
    push(errors, 'error', 'SPECIALTY_REQUIRED', '缺少 specialtyCode')
  }
  if (!categoryCode) {
    push(errors, 'error', 'CATEGORY_REQUIRED', '缺少 categoryCode')
  }

  const qtype = o.qtype
  if (typeof qtype !== 'string' || !(HS_MATH_QTYPES as readonly string[]).includes(qtype)) {
    push(errors, 'error', 'QTYPE', '题型必须是 single|multi|judge|numeric')
  }

  const difficulty = o.difficulty
  if (
    typeof difficulty !== 'number' ||
    !(HS_MATH_DIFFICULTIES as readonly number[]).includes(difficulty)
  ) {
    push(errors, 'error', 'DIFFICULTY', '难度必须是 1|2|3')
  }

  const pool = o.pool
  if (pool !== undefined && pool !== 'formal') {
    push(
      errors,
      'error',
      'POOL',
      '批量导入仅允许 formal（或不传）；禁止导入 test 池',
    )
  }

  let stem = ''
  try {
    stem = assertNonEmptyStem(o.stem)
  } catch (e: any) {
    push(errors, 'error', 'STEM', e?.message || '题干非法')
  }
  if (stem && /HS_MATH_P0_E2E/i.test(stem)) {
    push(errors, 'error', 'STEM_TEST', '题干含测试标识 HS_MATH_P0_E2E')
  }

  const analysis = typeof o.analysis === 'string' ? o.analysis.trim() : ''
  if (!analysis) {
    push(errors, 'error', 'ANALYSIS_REQUIRED', '解析 analysis 不能为空')
  }

  const kpCodesRaw = o.knowledgePointCodes
  const kpCodes = Array.isArray(kpCodesRaw)
    ? kpCodesRaw.map((x) => String(x || '').trim()).filter(Boolean)
    : []
  if (!Array.isArray(kpCodesRaw) || kpCodes.length === 0) {
    push(errors, 'error', 'KP_REQUIRED', '至少关联一个知识点 code')
  } else if (new Set(kpCodes).size !== kpCodes.length) {
    push(errors, 'error', 'KP_DUP', '知识点 code 重复')
  }

  const primary =
    typeof o.primaryKnowledgePointCode === 'string'
      ? o.primaryKnowledgePointCode.trim()
      : ''
  if (!primary) {
    push(errors, 'error', 'PRIMARY_KP_REQUIRED', '缺少 primaryKnowledgePointCode')
  } else if (kpCodes.length && !kpCodes.includes(primary)) {
    push(errors, 'error', 'PRIMARY_KP_NOT_IN_LIST', '主知识点必须属于关联列表')
  }

  if (qtype && (HS_MATH_QTYPES as readonly string[]).includes(String(qtype))) {
    try {
      validateAnswerPayload({
        qtype: qtype as any,
        optionsJson: o.options ?? null,
        answerPayload: o.answerPayload,
      })
    } catch (e: any) {
      push(errors, 'error', 'ANSWER', e?.message || '答案协议非法')
    }
  }

  // LaTeX 基础：去掉转义 \$ 后，奇数个 $ 视为 warning
  if (stem) {
    const dollars = (stem.replace(/\\\$/g, '').match(/\$/g) || []).length
    if (dollars % 2 === 1) {
      push(warnings, 'warning', 'LATEX_DOLLAR', '题干中 $ 数量为奇数，请检查 LaTeX')
    }
  }
  if (stem && /<\s*script/i.test(stem)) {
    push(errors, 'error', 'STEM_HTML', '题干不允许包含 script 标签')
  }

  // CORE-1A：可选来源字段（结构级；库内 method code 存在性在 enrich 阶段校验）
  try {
    assertValidSourceFields(
      {
        sourceType: o.sourceType as string | undefined,
        sourceYear: o.sourceYear as number | null | undefined,
        sourceExamName: o.sourceExamName as string | undefined,
        sourceQuestionNo: o.sourceQuestionNo as string | undefined,
        sourceReference: o.sourceReference as string | undefined,
        sourceAdaptationNote: o.sourceAdaptationNote as string | undefined,
        sourceVerificationStatus: o.sourceVerificationStatus as
          | string
          | undefined,
        sourceLicenseStatus: o.sourceLicenseStatus as string | undefined,
      },
      'persist',
    )
  } catch (e: any) {
    let msg = '来源字段非法'
    if (e instanceof BadRequestException) {
      const r = e.getResponse()
      if (typeof r === 'string') msg = r
      else if (r && typeof r === 'object' && 'message' in r) {
        const m = (r as { message: unknown }).message
        msg = Array.isArray(m) ? m.join('; ') : String(m)
      }
    } else if (e?.message) {
      msg = String(e.message)
    }
    push(errors, 'error', 'SOURCE', msg)
  }

  const methodCodesRaw = o.methodCodes
  if (methodCodesRaw !== undefined) {
    if (!Array.isArray(methodCodesRaw)) {
      push(errors, 'error', 'METHODS', 'methodCodes 须为数组')
    } else {
      const methodCodes = methodCodesRaw
        .map((x) => String(x || '').trim())
        .filter(Boolean)
      if (new Set(methodCodes).size !== methodCodes.length) {
        push(errors, 'error', 'METHOD_DUP', 'methodCodes 重复')
      }
      const primaryMethod =
        typeof o.primaryMethodCode === 'string'
          ? o.primaryMethodCode.trim()
          : o.primaryMethodCode == null
            ? ''
            : String(o.primaryMethodCode).trim()
      if (primaryMethod && methodCodes.length && !methodCodes.includes(primaryMethod)) {
        push(
          errors,
          'error',
          'PRIMARY_METHOD_NOT_IN_LIST',
          'primaryMethodCode 必须属于 methodCodes',
        )
      }
      if (primaryMethod && methodCodes.length === 0) {
        push(
          errors,
          'error',
          'PRIMARY_METHOD_EMPTY',
          '清空方法时不能指定 primaryMethodCode',
        )
      }
    }
  }

  push(
    warnings,
    'warning',
    'MATH_HUMAN_REVIEW',
    '结构合法不等于数学正确；批准前须人工核对题干/答案/解析',
  )

  return {
    index,
    code: code || codeHint,
    ok: errors.length === 0,
    errors,
    warnings,
  }
}
