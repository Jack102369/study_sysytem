/**
 * 工业正式入库真实写库开关。
 * - 默认 / 缺失 / 空值 → false
 * - 不得因 NODE_ENV=development 或管理员登录自动开启
 * - 本阶段 .env 不得开启；仅代码路径准备
 */
export function isIndustrialFormalRealPublishEnabled(): boolean {
  const v = String(process.env.INDUSTRIAL_FORMAL_REAL_PUBLISH || '')
    .trim()
    .toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export const INDUSTRIAL_FORMAL_REAL_PUBLISH_NOTE =
  'INDUSTRIAL_FORMAL_REAL_PUBLISH defaults false; confirmRealPublish+dryRun=false required; E2-B2 prepares path only — do not enable in this phase.'
