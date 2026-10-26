# P1-FUNC-DIFF-2C 执行结果

> 用户授权：仅经管理员 API 修改 id 125/126/128/132/133 的 `difficulty`。  
> 未批准、未写审核、未改其它题目字段。

## 结论

**PASS**

源 / JSON / DB 难度已对齐：**16 / 7 / 2**。标记 `SOURCE_UPDATED_DB_PENDING` **已关闭**。

## 执行方式

- API：`http://127.0.0.1:3000`
- 鉴权：ADMIN JWT（`users.role=ADMIN`）
- 接口：`PATCH /hs-math/admin/train-items/:id`
- Body：仅 `{"difficulty": N}`
- 前置：GET 核对 code / draft / 当前 difficulty

## 变更明细

| id | code | difficulty | content_version | status |
|---:|---|---|---|---|
| 125 | …-0017 | 2→**1** | 1→**2** | draft |
| 126 | …-0018 | 2→**1** | 1→**2** | draft |
| 128 | …-0020 | 2→**1** | 1→**2** | draft |
| 132 | …-0024 | 3→**2** | 1→**2** | draft |
| 133 | …-0025 | 3→**1** | 1→**2** | draft |

## 只读复核

| 项 | 结果 |
|---|---|
| LAST_VERIFIED | `2026-10-24T14:00:57.000Z` |
| PARITY 难度分布 | 1:16 / 2:7 / 3:2 |
| PARITY approved | 0 |
| PARITY reviews | 0 |
| 5 题均为 draft | 是 |

## 未做

- 未批准任何题目
- 未创建人工审核记录
- 未改题干/答案/KP/其它 id
- 未 import/confirm
- 未刷新 import manifest 的 SHA/指纹（仍可另开文档任务）

## 下一步建议

1. （可选）重算 `parity_import_manifest.json` 指纹，去掉 STALE 标注。  
2. 人工审核工作台：对 draft 题逐题 passed。  
3. 有选择批准进学生训练池。
