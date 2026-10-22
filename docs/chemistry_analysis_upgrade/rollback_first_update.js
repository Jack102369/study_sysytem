'use strict'
/**
 * 回滚本批 48 道 analysis 至备份原文。
 * 仅当当前 analysis 仍等于本批 newAnalysis 时才恢复。
 *   node docs/chemistry_analysis_upgrade/rollback_first_update.js
 */
const { spawnSync } = require('child_process')
const path = require('path')
const r = spawnSync(
  process.execPath,
  [path.join(__dirname, 'apply_first_update.js'), '--rollback'],
  { stdio: 'inherit' },
)
process.exit(r.status || 0)
