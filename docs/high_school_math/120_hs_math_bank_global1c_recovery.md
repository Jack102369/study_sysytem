# HS-MATH-BANK-GLOBAL-1C-RECOVERY — 缺失交付恢复报告

> 日期：2026-10-26  
> 范围：恢复文件 + 现算核验 + 交接修复  
> **无写库 / 未执行 SQL 迁移**

---

## 1. 文件缺失原因

| 调查项 | 结果 |
|--------|------|
| `git log` | 仅 2 提交；HEAD=`09d6cb7`（APPLICATION-4D） |
| `kp-seed-g1c.mjs` / 117 / 118 的 git 历史 | **无**（从未 commit） |
| stash / 其他分支 | **无**可用备份 |
| 禁止操作 | 未执行 `reset --hard` / `clean -fd` / 强制 checkout |

**结论：** 1C/1D 产物停留在未跟踪工作区后丢失或被工作区回退覆盖；**不是**可从 git 还原的对象。HANDOFF 回退至 4D 可旁证工作区状态被覆盖。

---

## 2. 恢复来源（可信）

| 产物 | 来源 |
|------|------|
| `kp-seed-g1c.mjs` existingInDb(42) | `db/migrate_hs_math_p1_0.sql` + `db/seed_hs_math_ch03_function_kps.sql` |
| `kp-seed-g1c.mjs` seedsToInsert(111) | `db/seed_hs_math_global1c_missing_kps.sql` |
| 117 / 118 | 按现存候选 + 重建种子 **现算重写**（标明 RECOVERY） |
| 119 | 按 1D **BLOCKED 史实**重建（不改为 PASS） |
| 候选质量证据 | `candidates-g1b-100.mjs`、`analyses-g1c-overrides.mjs` |

`prerequisites/qtypes/methods` 在种子中为结构占位；**权威字段**为 code/name/section/summary/sort/specialty。

---

## 3. 恢复文件清单

| 文件 | 动作 |
|------|------|
| `question_bank/kp-seed-g1c.mjs` | 重建 |
| `117_hs_math_bank_global1c_kp_gap.md` | 恢复（RECOVERY） |
| `118_hs_math_bank_global1c_quality_repair.md` | 恢复（RECOVERY） |
| `119_hs_math_bank_global1d_kp_migration_preflight.md` | 恢复史实 BLOCKED |
| `120_hs_math_bank_global1c_recovery.md` | 本报告 |
| `PROJECT_HANDOFF.md` | 更新阶段链 |

辅助：`question_bank/_rebuild_kp_seed_g1c.mjs`（重建脚本，可保留）。

---

## 4. 现算核验

| 检查 | 结果 |
|------|------|
| KP 索引 | existing **42** + insert **111** = **153** |
| SQL ↔ seedsToInsert | **111/111**，差集空 |
| insert ∩ existing | **空** |
| code↔section↔specialty | **0** 错位 |
| 候选 100 主 KP ∈ 种子 | **100/100** |
| text_only | **0** |
| rubric 失败 | **0** |
| 优先解析 &lt;120 | **0** |
| reviewReady（文件字段） | **100** |
| kpInDb（文件字段） | **20** |
| mathVerified | SPOT 53 / AUTHOR 47 / UNVERIFIED 0 |

---

## 5. 仍存在的阻塞

1. **GLOBAL-1D = BLOCKED（史实）** — 须在种子恢复后 **重跑 1D 预检**，不得自动改 PASS。  
2. SQL **无内置事务** — 正式迁移须外裹事务 + COUNT=111 强制验收。  
3. 种子元数据 prerequisites/methods 为再生占位 — 不影响 code 级迁移，但管理端展示需知。  
4. 未执行迁移；drawable 仍约 13。

---

## 6. 最终状态

**HS-MATH-BANK-GLOBAL-1C-RECOVERY = `RECOVERY_PASS`**

下一动作：另授权重跑 GLOBAL-1D；通过后方可独立授权 KP 迁移。  
**本阶段停止；未写 MySQL。**  
