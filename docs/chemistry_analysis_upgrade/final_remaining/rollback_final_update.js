'use strict'
/**
 * 剩余 377 道 analysis 回滚
 *   node docs/chemistry_analysis_upgrade/final_remaining/rollback_final_update.js
 */
const { spawnSync } = require('child_process')
const path = require('path')
const r = spawnSync(
  process.execPath,
  [path.join(__dirname, 'apply_final_update.js'), '--rollback'],
  { stdio: 'inherit' },
)
process.exit(r.status == null ? 1 : r.status)
