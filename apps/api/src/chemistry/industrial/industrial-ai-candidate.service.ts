import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { IndustrialAiGenerateResult } from './industrial-ai-generator.types'

export function resolveRepoRoot(cwd = process.cwd()): string {
  const tries = [cwd, join(cwd, '..'), join(cwd, '..', '..')]
  for (const root of tries) {
    if (
      existsSync(join(root, 'docs')) &&
      existsSync(join(root, 'apps', 'api')) &&
      existsSync(join(root, 'pnpm-workspace.yaml'))
    ) {
      return root
    }
  }
  return join(cwd, '..', '..')
}

export function defaultCandidatesRoot(): string {
  return join(
    resolveRepoRoot(),
    'docs',
    'chemistry_industrial_experiment',
    'generated_candidates',
  )
}

/**
 * 写出开发候选产物（文件级）。不含 API Key / Authorization。
 * 不得暴露为公共静态资源。
 */
export function writeIndustrialAiCandidateArtifacts(
  result: IndustrialAiGenerateResult,
  root?: string,
): string {
  const base = root || defaultCandidatesRoot()
  const dir = join(base, result.task.taskId)
  mkdirSync(dir, { recursive: true })

  const safeMeta = {
    ...result.task,
    // 再次确保无密钥字段
  }

  writeFileSync(
    join(dir, 'generation-metadata.json'),
    `${JSON.stringify(safeMeta, null, 2)}\n`,
    'utf8',
  )

  if (result.candidate) {
    writeFileSync(
      join(dir, 'candidate.json'),
      `${JSON.stringify(
        {
          developmentOnly: result.task.developmentOnly,
          generationSource: result.task.generationSource,
          status: result.task.status,
          question: {
            stem: result.candidate.stem,
            options: result.candidate.options,
            answerType: result.candidate.answerType,
            difficulty: result.candidate.difficulty,
            qtype: result.candidate.qtype,
            knowledgePoints: result.candidate.knowledgePoints,
            referencedNodeIds: result.candidate.referencedNodeIds,
            referencedLabels: result.candidate.referencedLabels,
            requiresManualReview: result.candidate.requiresManualReview,
          },
          // 答案与解析单独文件，避免与公开示混同；仍属受控开发目录
          answer: result.candidate.answer,
          explanation: result.candidate.explanation,
          case: result.industrialCaseSnapshot,
        },
        null,
        2,
      )}\n`,
      'utf8',
    )
  }

  if (result.diagramDefinition) {
    writeFileSync(
      join(dir, 'definition.json'),
      `${JSON.stringify(result.diagramDefinition, null, 2)}\n`,
      'utf8',
    )
  }
  if (result.publicDiagram) {
    writeFileSync(
      join(dir, 'public-diagram.json'),
      `${JSON.stringify(result.publicDiagram, null, 2)}\n`,
      'utf8',
    )
  }
  if (result.svg) {
    writeFileSync(join(dir, 'diagram.svg'), `${result.svg}\n`, 'utf8')
  }
  if (result.renderReport) {
    writeFileSync(
      join(dir, 'validation-report.json'),
      `${JSON.stringify(
        {
          ok: result.ok,
          validationResults: result.task.validationResults,
          renderReport: result.renderReport,
        },
        null,
        2,
      )}\n`,
      'utf8',
    )
  }

  writeFileSync(
    join(dir, 'request-summary.json'),
    `${JSON.stringify(
      {
        caseCode: result.task.caseCode,
        categoryCode: result.task.categoryCode,
        difficulty: result.task.difficulty,
        qtype: result.task.qtype,
        generationMode: result.task.generationMode,
        provider: result.task.provider,
        model: result.task.model,
        note: 'Full prompts omitted from public artifact for safety',
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  return dir
}
