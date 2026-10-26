# P1-0F-C1：1.1《集合的概念》人工审核准备

> 生成时间：2026-10-24  
> 范围：只读核查 + 独立数学复核 + 审核材料 + 批准门禁审计  
> **未批准任何题目；未修改数据库题目内容。**

## 1. 16 道题数据库状态

| 项 | 结果 |
|----|------|
| 归属核实方式 | `specialty=rja-ch1` **且** `category_code=1.1`（非仅凭 code） |
| 数量 | **16** |
| code | `HSMA-RJA-CH01-0001` .. `0016`（与 category=1.1 集合完全一致） |
| status | 全部 **draft** |
| pool | 全部 **formal** |
| content_version | 全部 **1** |
| 小节名 | 集合的概念 |
| 本节 KP 关联行 | **22**（全库 KP 关联仍为 121） |

## 2. 文件版本核对

| 项 | 结果 |
|----|------|
| JSON SHA-256 | `89b6484e6cb69f40437a6b28f603abae3c9eb19c0b08157d27947f72f7ec95c9` |
| 与导入授权一致 | **是** |
| DB↔JSON 内容指纹 | **16/16 一致** |
| KP 关联↔JSON | **16/16 一致** |
| 导入后篡改迹象 | **无**（content_version 未异常升高） |

审核版本指纹（写入 `review_section_1_1.md`）：

`96e8612d04934fcee4cc6f49805ac41cfda68ddb5ab8ced81712e3a95762ad67`

## 3. 数学复核结论（Cursor 代理，非正式人工）

| 结果 | 题数 |
|------|------|
| 代理复核通过（无明确数学错误） | 16 |
| 存疑（非错误，待人工确认呈现/表述） | 3 题有备注 |
| 明确错误 `NEEDS_CORRECTION` | **0** |

逐题详见：`question_bank/chapter_01/review_section_1_1.md`

## 4. 发现的问题 / 待人工确认

**无阻断性数学错误。** 建议人工特别确认（不阻碍进入具名审核）：

| code | 说明 |
|------|------|
| 0004 | 选项 A 内嵌“默认实数”约定文字，略冗；数学结论正确 |
| 0008 | single 选项形态接近判断题；−5∈奇数集结论正确 |
| 0009 | 空集作为“方程无实根”的集合，解析已说明；确认对学生是否够清楚 |

ℕ 含 0：0007 题干已明确约定。  
描述法论域：0003/0016 已写 `x∈ℤ`；0004 选项内声明默认实数。

## 5. 人工审核状态

| 状态 | 数量 |
|------|------|
| PENDING | **16** |
| APPROVED | **0** |
| REJECTED | **0** |
| 审核人 | 未填写（待真实人员） |

Cursor **未**将任何题标为人工 APPROVED。

## 6. 后端批准门禁检查（源码审计）

路由：`PATCH /hs-math/admin/train-items/:id/status`  
守卫：`JwtAuthGuard` + `AdminGuard`

`assertApproveQualityGate` 覆盖：

- 阻断测试/演示/IT 前缀与题干占位
- 禁止 `pool=test`
- 解析非空、答案协议合法、题干非空
- 章节/小节启用且归属一致
- ≥1 KP、恰好 1 个主 KP、KP 启用且同章
- approved 后实质修改题干/选项/答案 → 回 **draft** 且 `content_version+1`

自检：`hs-math:p1-0d1-selftest` / `hs-math:selftest` = PASS  
**本阶段未对真实 16 题执行批准。**

## 7. 正式训练池条件（源码审计）

`HsMathTrainService.createSession`：

- 仅 `status='approved'` 且 `isActive=true` 且 `pool=formal`
- 按 specialtyId + categoryId + difficulty 筛选
- 事务内再锁行校验 approved+active
- session_items 写入完整题干/选项/答案/解析/KP/content_version 快照

因此当前 16 道 **draft 不可被学生抽中**。  
本阶段**未创建**训练会话。

## 8. 下一步人工操作要求

1. 打开 `review_section_1_1.md`，具名通读 16 题。  
2. 每题填写：审核人、时间、意见、状态（PASS/REJECT/…）。  
3. 确认审核版本指纹未变。  
4. 仅对人工 PASS 的 code，由用户**另发明确授权**后，单题调用 status→approved。  
5. 每批批准后核对：仅授权 code 变为 approved；其余仍 draft；P0 仍 disabled；正式池仅增加已批准数。

## 9. 单题批准流程设计（未执行）

```
人工 PASS + 版本指纹一致 + status=draft
  → 用户明确授权该 code 列表
  → ADMIN PATCH .../status { status: "approved" }
  → 门禁通过则入库
  → 只读验收：status/pool/可抽题性；未授权题仍 draft
```

任一道未通过审核：**保持 draft**，不为凑数批准。

## 10. 是否允许进入单题批准

**READY_FOR_HUMAN_REVIEW**

含义：材料与版本就绪，可开始**具名人工审核**。  
**不等于**允许批准；批准须另授权。

## 11. 程序校验

| 命令 | 结果 |
|------|------|
| hs-math:p1-0fc1-audit | PASS（只读） |
| hs-math:p1-0e-check | PASS |
| hs-math:p1-0fa-verify | PASS |
| hs-math:p1-0d1-selftest | PASS |
| hs-math:selftest | PASS |
| api build | 见同期执行（cli 脚本已排除出 nest build） |
| Web build | NOT_RUN |
