/**
 * 受控知识库导入：进程内调用 ChemKbImportService，不经 HTTP 登录。
 *
 * 用法（在 apps/api 目录）：
 *   pnpm chem:import -- ../../docs/chemistry_batch2/import_B2-A.json
 *
 * - 不读取、不要求、不修改任何用户密码
 * - 仅只读选取一名启用中的 ADMIN 的 id，写入 createdBy/updatedBy 审计字段
 * - 禁止对本脚本传入密码相关环境变量作为认证手段
 */
import { NestFactory } from '@nestjs/core'
import { getRepositoryToken } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { AppModule } from '../../../app.module'
import { User } from '../../../users/user.entity'
import { ChemSpecialty } from '../../chem-specialty.entity'
import { ChemCategory } from '../../chem-category.entity'
import { ChemKbImportService } from '../chem-kb-import.service'
import { ChemKbService } from '../chem-kb.service'
import * as fs from 'fs'
import * as path from 'path'

type ImportFile = {
  items: Array<{ type: string; data: Record<string, unknown> }>
  meta?: {
    inventoryCodes?: string[]
    specialtyByCode?: Record<string, string[]>
    categoryByCode?: Record<string, string[]>
  }
}

function assertNoPasswordEnv() {
  const forbidden = [
    'CHEM_ADMIN_PASSWORD',
    'ADMIN_PASSWORD',
    'IMPORT_PASSWORD',
  ]
  for (const key of forbidden) {
    if (process.env[key]) {
      throw new Error(
        `拒绝使用环境变量 ${key}：知识库导入不得依赖或携带密码。请使用 pnpm chem:import。`,
      )
    }
  }
}

async function resolveActorAdminId(usersRepo: Repository<User>): Promise<string> {
  const admins = await usersRepo.find({
    where: { role: 'ADMIN', isDisabled: false },
    order: { id: 'ASC' },
    take: 1,
  })
  const admin = admins[0]
  if (!admin) {
    throw new Error(
      '未找到启用中的 ADMIN 用户，无法写入审计字段 createdBy（未修改任何账号）',
    )
  }
  return String(admin.id)
}

async function main() {
  assertNoPasswordEnv()

  const fileArg = process.argv.slice(2).find((a) => !a.startsWith('-'))
  if (!fileArg) {
    console.error('用法: pnpm chem:import -- <import.json路径>')
    process.exit(1)
  }
  const filePath = path.resolve(process.cwd(), fileArg)
  if (!fs.existsSync(filePath)) {
    console.error('文件不存在:', filePath)
    process.exit(1)
  }

  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8')) as ImportFile
  if (!Array.isArray(payload.items)) {
    console.error('JSON 需包含 items 数组')
    process.exit(1)
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  })

  try {
    const usersRepo = app.get<Repository<User>>(getRepositoryToken(User))
    const specialtiesRepo = app.get<Repository<ChemSpecialty>>(
      getRepositoryToken(ChemSpecialty),
    )
    const categoriesRepo = app.get<Repository<ChemCategory>>(
      getRepositoryToken(ChemCategory),
    )
    const importer = app.get(ChemKbImportService)
    const kb = app.get(ChemKbService)

    const actorId = await resolveActorAdminId(usersRepo)
    console.log(
      JSON.stringify({
        mode: 'in-process',
        file: filePath,
        itemCount: payload.items.length,
        actorAdminId: actorId,
        note: '只读使用 ADMIN id 作审计，未读取/修改密码',
      }),
    )

    const result = await importer.importBatch(
      { items: payload.items as any },
      actorId,
    )

    const specialties = await specialtiesRepo.find({ where: { isActive: true } })
    const specMap = new Map(specialties.map((s) => [s.code, String(s.id)]))
    const categories = await categoriesRepo.find({ where: { isActive: true } })
    const catByKey = new Map<string, string>()
    const specById = new Map(specialties.map((s) => [String(s.id), s.code]))
    for (const c of categories) {
      const spCode = specById.get(String(c.specialtyId))
      if (spCode) catByKey.set(`${spCode}.${c.code}`, String(c.id))
    }

    const metaCodes = payload.meta?.inventoryCodes || []
    const specialtyByCode = payload.meta?.specialtyByCode || {}
    const categoryByCode = payload.meta?.categoryByCode || {}
    let linkOk = 0
    let linkFail = 0

    for (const r of result.results) {
      if (!r.ok || !r.id) continue
      const invCode = metaCodes[r.index]
      if (!invCode) continue
      const specialtyIds = (specialtyByCode[invCode] || [])
        .map((c) => specMap.get(c))
        .filter((x): x is string => !!x)
      const categoryIds = (categoryByCode[invCode] || [])
        .map((c) => catByKey.get(c))
        .filter((x): x is string => !!x)
      try {
        await kb.setLinks(r.type, String(r.id), { specialtyIds, categoryIds })
        linkOk++
      } catch {
        linkFail++
      }
    }

    const out = {
      successCount: result.successCount,
      failCount: result.failCount,
      linkOk,
      linkFail,
      results: result.results.map((r) => ({
        index: r.index,
        type: r.type,
        ok: r.ok,
        id: r.id,
        inventoryCode: metaCodes[r.index] ?? null,
        errors: r.errors,
      })),
    }

    const outPath = filePath.replace(/\.json$/i, '.import-result.json')
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8')
    console.log(
      JSON.stringify(
        {
          successCount: out.successCount,
          failCount: out.failCount,
          linkOk,
          linkFail,
          resultFile: outPath,
        },
        null,
        2,
      ),
    )
  } finally {
    await app.close()
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
