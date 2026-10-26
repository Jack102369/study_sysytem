# P1-0F-C2：1.1 具名人工审核流程与记录

> **人工审核通过 ≠ 数据库批准。** 二者必须分开授权。

## 1. 审核流程

1. 打开 `review_section_1_1.md`，逐题阅读题干/选项/答案/解析/KP。  
2. 对 **0004 / 0008 / 0009** 必须针对复核备注写意见。  
3. 由真实审核人给出结论：`APPROVED` / `REJECTED` / `NEEDS_CORRECTION` / `PENDING`。  
4. 用户向 Cursor **明确**提供：审核人、code 列表、结论、意见。  
5. Cursor 仅在满足规则时更新 `human_review_section_1_1.json`。  
6. **绝不**因 JSON 变为 APPROVED 而自动调用 `PATCH .../status`。

## 2. 版本绑定

每条记录绑定：

- `sourceSha256`（整包 JSON）
- `contentFingerprint`（单题规范化内容）
- `reviewedContentVersion`（数据库 content_version）

内容变更后旧 `APPROVED` 失效，应标 `STALE_REVIEW`，不得进入批准清单。

## 3. 更新规则（防伪造）

允许更新当且仅当用户明确给出：

1. 审核人姓名/标识  
2. 题目 code  
3. 审核结论  
4. 审核意见（重点题须针对备注）  
5. 版本仍一致  

禁止：

- “看起来没问题”→ 批量 16 题 APPROVED  
- 虚构审核时间/审核人  
- 修改题干答案或数据库 status  

## 4. 当前结果（本阶段初始化）

| 状态 | 数量 |
|------|------|
| PENDING | 16 |
| APPROVED | 0 |
| REJECTED | 0 |
| NEEDS_CORRECTION | 0 |
| STALE_REVIEW | 0 |

## 5. 数据库批准前置（后续阶段）

须同时满足：

1. 人工 JSON `APPROVED`  
2. 审核人/时间/意见真实  
3. 指纹与 content_version 一致  
4. 后端批准门禁通过  
5. **用户另行明确授权**该 code 的数据库批准  

未通过审核：保持 draft。

## 6. 校验命令

```bash
pnpm --filter api run hs-math:p1-0fc2-human-review
```

## 7. 下一阶段

**WAITING_FOR_HUMAN_REVIEW**

