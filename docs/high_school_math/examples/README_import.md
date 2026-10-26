# 高一数学题库 JSON 导入说明（P1-0D）

## 文件

- `hs-math-import-template.json`：四题型（single / multi / judge / numeric）结构示例。

## 协议要点

每题字段：

| 字段 | 说明 |
|------|------|
| `code` | 稳定业务码；跨环境不以数据库 ID 导入 |
| `specialtyCode` | 章节 code，如 `rja-ch1` |
| `categoryCode` | 小节 code，如 `1.1` |
| `qtype` | `single` \| `multi` \| `judge` \| `numeric` |
| `difficulty` | `1` \| `2` \| `3` |
| `stem` | 题干（可含 LaTeX `$...$`） |
| `options` | 选择题 `{ "options": [{ "id", "text" }] }`；judge/numeric 省略 |
| `answerPayload` | 与现有答案协议一致（`kind` + 对应字段） |
| `analysis` | 解析，非空 |
| `knowledgePointCodes` | KP code 列表 |
| `primaryKnowledgePointCode` | 主知识点，须属于上表 |

禁止：

- 指定 `status` / `contentVersion` / 自动 `approved`
- `HS_MATH_P0_`、`DEMO.`、`EXAMPLE.`、`SAMPLE.` 等测试/演示前缀（模板用 EXAMPLE. 故意不可入库）
- 导入 `pool=test`
- 单批超过 100 题

## 流程

1. `POST /hs-math/admin/train-items/import/preview`（ADMIN）
2. 无 error 时获得 `previewToken`
3. `POST /hs-math/admin/train-items/import/confirm` 携带相同 `items` + `previewToken`
4. 整批事务写入 **draft**，并写入 KP 关联；不自动批准

## 质量说明

程序只校验结构与归属，**不保证数学正确**。批准前须人工审核。
