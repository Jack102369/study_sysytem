/**
 * 集成测试安全门禁：禁止对业务库 study_system 做写入验收。
 */
export const HS_MATH_IT_DB_NAME = 'study_system_hs_math_it'

export function assertSafeIntegrationDatabase(dbName: string | undefined): string {
  const name = String(dbName || '').trim()
  if (!name) {
    throw new Error(
      '[HS_MATH_IT] 未指定测试库。请设置 HS_MATH_IT_DB_NAME=study_system_hs_math_it',
    )
  }
  if (name === 'study_system') {
    throw new Error(
      '[HS_MATH_IT] 拒绝连接业务库 study_system。必须使用独立测试库 study_system_hs_math_it',
    )
  }
  if (name !== HS_MATH_IT_DB_NAME) {
    throw new Error(
      `[HS_MATH_IT] 测试库名必须为 ${HS_MATH_IT_DB_NAME}，当前：${name}`,
    )
  }
  return name
}

export function loadApiEnv(): Record<string, string> {
  const fs = require('fs') as typeof import('fs')
  const path = require('path') as typeof import('path')
  const envPath = path.join(__dirname, '../../../.env')
  const env: Record<string, string> = { ...process.env } as Record<string, string>
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m && env[m[1].trim()] === undefined) {
        env[m[1].trim()] = m[2].trim()
      }
    }
  }
  return env
}
