#!/usr/bin/env node
/**
 * 打包发布目录到 release/study-system
 * 用法：pnpm pack:release
 * 同域反代：$env:VITE_API_BASE_URL=""; pnpm pack:release
 */
import { execSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  readdirSync,
} from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'release', 'study-system')
const apiBase = process.env.VITE_API_BASE_URL

function safeCp(src, dest, recursive = false, filter) {
  if (!existsSync(src)) throw new Error(`missing: ${src}`)
  cpSync(src, dest, { recursive, force: true, filter })
  console.log('  copied', src.replace(root, ''), '->', dest.replace(root, ''))
}

/** 复制 OCR 等旁路服务：排除 venv / 缓存 */
function copyServiceDir(name) {
  const src = join(root, 'services', name)
  const dest = join(out, 'services', name)
  if (!existsSync(src)) {
    console.warn(`  skip missing services/${name}`)
    return
  }
  mkdirSync(dest, { recursive: true })
  safeCp(src, dest, true, (srcPath) => {
    const base = basename(srcPath)
    if (base === '.venv' || base === '__pycache__' || base === '.git') return false
    if (base.endsWith('.pyc')) return false
    return true
  })
}

console.log('==> clean release')
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

console.log('==> build api')
execSync('pnpm --filter api build', { cwd: root, stdio: 'inherit', shell: true })

console.log('==> build web')
const webEnv = { ...process.env }
if (apiBase !== undefined) {
  webEnv.VITE_API_BASE_URL = apiBase
  console.log(`    VITE_API_BASE_URL=${apiBase || '(empty / same-origin)'}`)
}
execSync('pnpm --filter web build', {
  cwd: root,
  stdio: 'inherit',
  env: webEnv,
  shell: true,
})

console.log('==> copy artifacts')
mkdirSync(join(out, 'api'), { recursive: true })
mkdirSync(join(out, 'web'), { recursive: true })
mkdirSync(join(out, 'db'), { recursive: true })
mkdirSync(join(out, 'deploy'), { recursive: true })
mkdirSync(join(out, 'docs'), { recursive: true })
mkdirSync(join(out, 'services'), { recursive: true })

safeCp(join(root, 'apps', 'api', 'dist'), join(out, 'api', 'dist'), true)
safeCp(join(root, 'apps', 'api', 'package.json'), join(out, 'api', 'package.json'))
safeCp(join(root, 'apps', 'api', '.env.example'), join(out, 'api', '.env.example'))

for (const name of readdirSync(join(root, 'apps', 'web', 'dist'))) {
  safeCp(
    join(root, 'apps', 'web', 'dist', name),
    join(out, 'web', name),
    true,
  )
}

for (const name of readdirSync(join(root, 'db'))) {
  safeCp(join(root, 'db', name), join(out, 'db', name), true)
}

safeCp(
  join(root, 'deploy', 'nginx.conf.example'),
  join(out, 'deploy', 'nginx.conf.example'),
)
if (existsSync(join(root, 'nginx', 'nginx.conf'))) {
  safeCp(join(root, 'nginx', 'nginx.conf'), join(out, 'deploy', 'nginx.conf'))
}
safeCp(join(root, 'DEPLOY.md'), join(out, 'DEPLOY.md'))
if (existsSync(join(root, 'SERVER_UPDATE_CHECKLIST.md'))) {
  safeCp(
    join(root, 'SERVER_UPDATE_CHECKLIST.md'),
    join(out, 'SERVER_UPDATE_CHECKLIST.md'),
  )
}

// 化学内容数据 + 模型目录（变式匹配）
if (existsSync(join(root, 'chem_content_sync.sql'))) {
  safeCp(join(root, 'chem_content_sync.sql'), join(out, 'db', 'chem_content_sync.sql'))
}
const modelCatalog = join(root, 'docs', 'chemistry_advanced_model', 'models_catalog.json')
if (existsSync(modelCatalog)) {
  mkdirSync(join(out, 'docs', 'chemistry_advanced_model'), { recursive: true })
  safeCp(modelCatalog, join(out, 'docs', 'chemistry_advanced_model', 'models_catalog.json'))
}
// 本地出题器白名单（API 运行时读取）
const whitelist = join(root, 'docs', 'chemistry_deepseek_audit', 'publish_whitelist.json')
if (existsSync(whitelist)) {
  mkdirSync(join(out, 'docs', 'chemistry_deepseek_audit', 'second_review'), {
    recursive: true,
  })
  safeCp(whitelist, join(out, 'docs', 'chemistry_deepseek_audit', 'publish_whitelist.json'))
  const second = join(
    root,
    'docs',
    'chemistry_deepseek_audit',
    'second_review',
    'second_review_results.json',
  )
  if (existsSync(second)) {
    safeCp(
      second,
      join(
        out,
        'docs',
        'chemistry_deepseek_audit',
        'second_review',
        'second_review_results.json',
      ),
    )
  }
}

console.log('==> copy OCR services + docs')
copyServiceDir('ocr')
copyServiceDir('ocr-formula')
writeFileSync(
  join(out, 'services', 'ocr', 'start.bat'),
  `@echo off
cd /d "%~dp0"
if not exist ".venv\\Scripts\\python.exe" (
  echo Creating venv ...
  python -m venv .venv
  .venv\\Scripts\\python.exe -m pip install -U pip
  .venv\\Scripts\\python.exe -m pip install -r requirements.txt
)
.venv\\Scripts\\python.exe -m uvicorn main:app --host 127.0.0.1 --port 9100
`,
)
if (existsSync(join(root, 'docs', 'paddleocr-windows.md'))) {
  safeCp(
    join(root, 'docs', 'paddleocr-windows.md'),
    join(out, 'docs', 'paddleocr-windows.md'),
  )
}
if (existsSync(join(root, 'docs', 'piper-windows.md'))) {
  safeCp(
    join(root, 'docs', 'piper-windows.md'),
    join(out, 'docs', 'piper-windows.md'),
  )
}

const apiPkg = JSON.parse(readFileSync(join(out, 'api', 'package.json'), 'utf8'))
delete apiPkg.devDependencies
apiPkg.scripts = {
  start: 'node dist/main.js',
  'start:prod': 'node dist/main.js',
}
writeFileSync(join(out, 'api', 'package.json'), JSON.stringify(apiPkg, null, 2) + '\n')

writeFileSync(
  join(out, 'api', 'start.sh'),
  `#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -f .env ]; then
  echo "请先复制 .env.example 为 .env 并填写数据库/JWT"
  exit 1
fi
exec node dist/main.js
`,
)

writeFileSync(
  join(out, 'VERSION.txt'),
  `builtAt=${new Date().toISOString()}
viteApiBase=${apiBase !== undefined ? apiBase || '(empty / same-origin)' : '(from .env.production)'}
includesOcrServices=true
`,
)

console.log('')
console.log('打包完成:', out)
console.log('下一步见 release/study-system/DEPLOY.md')
