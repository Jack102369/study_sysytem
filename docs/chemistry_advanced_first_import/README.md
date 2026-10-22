# 首批 60 道提高/挑战入库工具

1. `node fix_needs_fix.js` — 修复 4 道 NEEDS_FIX（已执行）
2. `node build_whitelist.js` — 复验并生成白名单
3. `node backup_and_import.js` — 备份统计 + 幂等导入
4. `node smoke_api.js` — API 冒烟（隔离用户）

报告：`../CHEMISTRY_ADVANCED_FIRST_IMPORT_REPORT.md`

回滚：对 `code LIKE 'train.ai_trial.s60.%'` 软停用并加 `[trial_access:block]`。
