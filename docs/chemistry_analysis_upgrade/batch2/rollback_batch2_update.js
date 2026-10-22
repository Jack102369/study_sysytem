'use strict'
/**
 * 第二批 analysis 回滚入口
 *   node docs/chemistry_analysis_upgrade/batch2/rollback_batch2_update.js
 */
const { spawnSync } = require('child_process')
const path = require('path')
const r = spawnSync(
  process.execPath,
  [path.join(__dirname, 'apply_batch2_update.js'), '--rollback'],
  { stdio: 'inherit' },
)
process.exit(r.status == null ? 1 : r.status)
