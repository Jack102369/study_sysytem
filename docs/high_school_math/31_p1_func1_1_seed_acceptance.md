# P1-FUNC-1.1：第三章函数知识点入库验收

**日期**：2026-10-24  
**库**：`study_system`  
**种子**：`db/seed_hs_math_ch03_function_kps.sql`  
**授权**：用户明确授权执行（仅新增 27 条第三章 KP）

---

## 1. 迁移前检查

全部 PASS：库名 `study_system`；`rja-ch3`；3.1/3.2/3.3 启用；第三章 KP=0；第一章 KP=15；CH01 draft=80；approved=0；reviews=0；无 `rja.3.*` 冲突。

## 2. 备份

| 项 | 值 |
|----|-----|
| 路径 | `db/backups/study_system_pre_p1_func1_1_2026-10-24_11-56-39.sql` |
| 大小 | 1292096 bytes |
| 结构+数据 | PASS（CREATE TABLE + INSERT，含 hs_math_） |
| `.gitignore` | 已排除 `db/backups/` |

## 3. 执行

经 mysql2 `utf8mb4` 执行种子；`affected` 插入成功；未改连接 / 未 synchronize / 未建新库。

## 4. 迁移后

| 项 | 值 |
|----|-----|
| 第三章 KP | **27**（全启用） |
| 3.1 / 3.2 / 3.3 / 3.4 | 10 / 12 / 5 / **0** |
| 奇偶性 09–12 | 名称与 summary 正确（定义域 / 零函数 / 区间） |
| 中文 | 无乱码 |
| 第一章 KP / draft | 15 / 80 |
| approved / reviews | 0 / 0 |
| sessions / session_items | 39 / 195 |
| chem_specialties | 12 |

## 5. 页面

- 管理：`/settings/hs-math-knowledge` 筛「函数的概念与性质」→ **共 27 条**
- 学生 API：`GET /hs-math/knowledge-points?specialtyId=` → **27**
- 学生页 3.1 列表：`…/categories/41/knowledge` → 10 条（`rja.3.1.01`–`10`，中文正常）
- 学生详情：`/hs-math/kp/rja.3.1.01` → 名称 + summary 正常；**未**点击开始训练

## 6. 准入

**READY_FOR_FUNCTION_QUESTION_BANK**
