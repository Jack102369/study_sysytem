/**
 * 知识库导入入口（已改为不依赖管理员密码）。
 *
 * 请改用 API 进程内导入（不经 HTTP 登录、不修改任何用户）：
 *
 *   cd apps/api
 *   pnpm chem:import -- ../../docs/chemistry_batch2/import_B2-A.json
 *
 * 本文件保留为说明与转发：若直接 node 执行，会调用上述命令。
 * - 禁止重置/修改用户密码
 * - 禁止硬编码密码
 * - 拒绝 CHEM_ADMIN_PASSWORD 等密码环境变量
 */
const { spawnSync } = require('child_process')
const path = require('path')

const forbidden = ['CHEM_ADMIN_PASSWORD', 'ADMIN_PASSWORD', 'IMPORT_PASSWORD']
for (const key of forbidden) {
  if (process.env[key]) {
    console.error(
      `拒绝环境变量 ${key}：知识库导入不得依赖密码。请使用: cd apps/api && pnpm chem:import -- <json>`,
    )
    process.exit(1)
  }
}

const packs = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const defaults = ['B2-A', 'B2-B', 'B2-C', 'B2-D'].map((p) =>
  path.join(__dirname, `import_${p}.json`),
)
const files = packs.length
  ? packs.map((p) => path.resolve(p))
  : defaults

const apiDir = path.resolve(__dirname, '../../apps/api')

let failed = 0
for (const file of files) {
  console.log('chem:import', file)
  const r = spawnSync(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    ['chem:import', '--', file],
    { cwd: apiDir, stdio: 'inherit', shell: true },
  )
  if (r.status !== 0) failed++
}

process.exit(failed ? 1 : 0)
