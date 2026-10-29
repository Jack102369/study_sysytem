/**
 * PHASE_E2-B6：审核页只读「辅助外链」——ACCESSED ≠ verified_by_admin。
 * 数据来自 B5 SOURCE_REGISTRY 事实登记；禁止在此自动写入核验态。
 */

export type IndustrialEvidenceHelperLink = {
  sourceId: string
  title: string
  publisher: string
  url: string
  accessStatus: 'ACCESSED' | 'ACCESS_FAILED'
  note: string
}

export type IndustrialCaseEvidenceHelpers = {
  caseCode: string
  sourceEvidenceStatus: 'SOURCE_EVIDENCE_PARTIAL' | 'SOURCE_EVIDENCE_INCOMPLETE'
  links: IndustrialEvidenceHelperLink[]
  adminHint: string
}

const SALT_LINKS: IndustrialEvidenceHelperLink[] = [
  {
    sourceId: 'SRC_JSNT_LABLIST',
    title: '高一第一学期化学实验目录（含粗盐提纯 P5）',
    publisher: '江苏省南通第一中学',
    url: 'http://www.jsntyz.edu.cn/jyjx/xkjs/hxjys/xkhd4/content_29997',
    accessStatus: 'ACCESSED',
    note: '仅证实验目录含粗盐提纯；无步骤全文',
  },
  {
    sourceId: 'SRC_ZUST_NACL',
    title: '实验一 NaCl的提纯',
    publisher: '浙江科技学院精品课程',
    url: 'https://zlq.zust.edu.cn/wjfx/info/1012/1120.htm',
    accessStatus: 'ACCESSED',
    note: '高校讲义：不溶杂质过滤 vs 可溶杂质化学沉淀',
  },
  {
    sourceId: 'SRC_FZ_PDF_JUNIOR',
    title: '2023 福州初中化学实验技能考查方案',
    publisher: '福州市政府教育公开 PDF',
    url: 'http://www.fuzhou.gov.cn/zgfzzt/jy/ksxx/hkxx/202303/P020230321421845432529.pdf',
    accessStatus: 'ACCESS_FAILED',
    note: '抓取曾超时；管理员可自备打开',
  },
]

const SEA_LINKS: IndustrialEvidenceHelperLink[] = [
  {
    sourceId: 'SRC_SDUT_SEAWATER',
    title: '「海水晒盐」情境分析及其在课堂教学中的运用',
    publisher: '教学研究公开 PDF 镜像',
    url: 'https://etcnew.sdut.edu.cn/meol/analytics/resPdfShow.do?lid=47932&resId=857025',
    accessStatus: 'ACCESSED',
    note: '蒸发池→结晶池→粗盐/母液；非工业设计手册',
  },
]

const GAS_LINKS: IndustrialEvidenceHelperLink[] = [
  {
    sourceId: 'SRC_SZ_CO2_TEACHER',
    title: '二氧化碳教学（长管进短管出表述）',
    publisher: '苏州市教育科学研究院',
    url: 'https://szteacher.suzhou.edu.cn/news.aspx?id=99060&ntid=105',
    accessStatus: 'ACCESS_FAILED',
    note: '外部洗气证据薄弱；须自备教材装置章节',
  },
  {
    sourceId: 'SRC_TARU_BASIC',
    title: '化学实验基本操作',
    publisher: '塔里木大学化学实验教学示范中心',
    url: 'https://ecc.taru.edu.cn/info/14179/270581.htm',
    accessStatus: 'ACCESS_FAILED',
    note: '过滤等基本操作；与洗气导管方向无直接对应',
  },
]

const BY_CASE: Record<string, IndustrialCaseEvidenceHelpers> = {
  salt_purification_basic: {
    caseCode: 'salt_purification_basic',
    sourceEvidenceStatus: 'SOURCE_EVIDENCE_PARTIAL',
    links: SALT_LINKS,
    adminHint:
      '优先打开 ACCESSED 链接；仍须本人核验后再填 verified_by_admin。ACCESS_FAILED 请自备教材。',
  },
  seawater_resource_basic: {
    caseCode: 'seawater_resource_basic',
    sourceEvidenceStatus: 'SOURCE_EVIDENCE_PARTIAL',
    links: SEA_LINKS,
    adminHint:
      '晒盐链路有已访问支撑；术语「结晶」须对照教材后再批案例。',
  },
  gas_wash_teaching_basic: {
    caseCode: 'gas_wash_teaching_basic',
    sourceEvidenceStatus: 'SOURCE_EVIDENCE_INCOMPLETE',
    links: GAS_LINKS,
    adminHint:
      'SOURCE_EVIDENCE_INCOMPLETE：外部证据不足时勿 approve_for_publish；保留 sources_incomplete / cannot_verify。',
  },
}

export function getIndustrialScientificEvidenceHelpers(
  caseCode: string | null | undefined,
): IndustrialCaseEvidenceHelpers | null {
  if (!caseCode) return null
  return BY_CASE[caseCode] || null
}
