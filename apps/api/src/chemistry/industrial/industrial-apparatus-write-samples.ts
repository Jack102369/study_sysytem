/**
 * 写出装置图样例到 docs/.../apparatus_samples/
 * pnpm --filter api run chem:industrial-apparatus-write-samples
 */
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { ALL_APPARATUS_SAMPLES } from './industrial-apparatus.fixtures'
import { projectIndustrialApparatusPublic } from './industrial-apparatus.project'
import { validateIndustrialApparatusDefinition } from './industrial-apparatus.validate'
import { renderIndustrialApparatusSvg } from './industrial-apparatus-svg-renderer'
import { checkIndustrialApparatusSafety } from './industrial-apparatus-safety'

function repoRoot(): string {
  const cwd = process.cwd()
  const candidates = [cwd, join(cwd, '..'), join(cwd, '..', '..')]
  for (const r of candidates) {
    try {
      const { existsSync } = require('fs')
      if (existsSync(join(r, 'db', 'init.sql'))) return r
    } catch {
      /* */
    }
  }
  return join(cwd, '..', '..')
}

function main() {
  const root = repoRoot()
  const outDir = join(
    root,
    'docs/chemistry_industrial_experiment/apparatus_samples',
  )
  mkdirSync(outDir, { recursive: true })

  for (const sample of ALL_APPARATUS_SAMPLES) {
    const v = validateIndustrialApparatusDefinition(sample)
    const pub = projectIndustrialApparatusPublic(sample)
    const svgR = renderIndustrialApparatusSvg(pub)
    const safety = checkIndustrialApparatusSafety(sample)
    const base = sample.apparatusId
    writeFileSync(
      join(outDir, `${base}.definition.json`),
      `${JSON.stringify(sample, null, 2)}\n`,
      'utf8',
    )
    writeFileSync(
      join(outDir, `${base}.public.json`),
      `${JSON.stringify(pub, null, 2)}\n`,
      'utf8',
    )
    writeFileSync(join(outDir, `${base}.svg`), svgR.svg, 'utf8')
    writeFileSync(
      join(outDir, `${base}.report.json`),
      `${JSON.stringify(
        {
          intentionallyInvalid: !!sample.intentionallyInvalid,
          validation: v,
          safety,
          render: svgR.renderReport,
          note: '教学示意；invalid 样例禁止 formal',
        },
        null,
        2,
      )}\n`,
      'utf8',
    )
  }
  console.log(
    `industrial-apparatus-write-samples: wrote ${ALL_APPARATUS_SAMPLES.length} samples → ${outDir}`,
  )
}

main()
