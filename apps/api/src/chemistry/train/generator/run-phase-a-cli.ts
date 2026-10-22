/**
 * 阶段A本地出题 CLI（管理员预览确认的批处理版）。
 *
 * 用法（在 apps/api 目录）：
 *   pnpm exec ts-node --transpile-only src/chemistry/train/generator/run-phase-a-cli.ts --preview
 *   pnpm exec ts-node --transpile-only src/chemistry/train/generator/run-phase-a-cli.ts --apply --confirm
 *
 * 默认：targetCount=300，kbTypes=substance,knowledge,reaction,element,concept,formula,experiment
 * 必须带 --confirm 才会写库；--preview 只输出计划 JSON。
 */
import { NestFactory } from '@nestjs/core'
import { getRepositoryToken } from '@nestjs/typeorm'
import * as fs from 'fs'
import * as path from 'path'
import type { Repository } from 'typeorm'
import { AppModule } from '../../../app.module'
import { User } from '../../../users/user.entity'
import { LocalGeneratorService } from './local-generator.service'

async function resolveAdminId(usersRepo: Repository<User>): Promise<string> {
  const admins = await usersRepo.find({
    where: { role: 'ADMIN', isDisabled: false },
    order: { id: 'ASC' },
    take: 1,
  })
  if (!admins[0]) throw new Error('未找到 ADMIN 用户')
  return String(admins[0].id)
}

async function main() {
  const args = process.argv.slice(2)
  const doPreview = args.includes('--preview') || !args.includes('--apply')
  const doApply = args.includes('--apply') && args.includes('--confirm')
  const targetArg = args.find((a) => a.startsWith('--target='))
  const targetCount = targetArg ? Number(targetArg.split('=')[1]) : 300

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  })
  const usersRepo = app.get<Repository<User>>(getRepositoryToken(User))
  const gen = app.get(LocalGeneratorService)
  const adminId = await resolveAdminId(usersRepo)

  const before = await gen.meta()
  const utilBefore = await gen.utilization()

  const preview = await gen.preview(adminId, {
    targetCount,
    kbTypes: [
      'substance',
      'knowledge',
      'reaction',
      'element',
      'concept',
      'formula',
      'experiment',
    ],
    difficulties: [1, 2],
  })

  const outDir = path.resolve(
    process.cwd(),
    '../../docs/chemistry_trial_restore/local_generator_phase_a',
  )
  fs.mkdirSync(outDir, { recursive: true })
  const planPath = path.join(outDir, 'phase_a_preview.json')
  fs.writeFileSync(
    planPath,
    JSON.stringify(
      {
        before: { meta: before.counts, utilization: utilBefore },
        previewId: preview.previewId,
        expiresAt: preview.expiresAt,
        stats: preview.stats,
        safety: preview.safety,
        candidatesSample: preview.candidates.slice(0, 20),
        skippedSample: preview.skipped.slice(0, 80),
        candidateCount: preview.candidates.length,
      },
      null,
      2,
    ),
  )
  console.log(
    JSON.stringify(
      {
        mode: doApply ? 'apply' : 'preview',
        candidateCount: preview.candidates.length,
        skipCount: preview.skipped.length,
        byKbType: preview.stats.byKbType,
        byDifficulty: preview.stats.byDifficulty,
        planPath,
      },
      null,
      2,
    ),
  )

  if (!doApply) {
    await app.close()
    return
  }

  const result = await gen.confirm(adminId, {
    previewId: preview.previewId,
    confirmCount: preview.candidates.length,
    deactivateFiller: true,
  })
  const after = await gen.meta()
  const utilAfter = await gen.utilization()
  const reportPath = path.join(outDir, 'phase_a_apply_result.json')
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        before: { meta: before.counts, utilization: utilBefore },
        result,
        after: { meta: after.counts, utilization: utilAfter },
      },
      null,
      2,
    ),
  )
  console.log(JSON.stringify({ applied: true, result, after: after.counts, reportPath }, null, 2))
  await app.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
