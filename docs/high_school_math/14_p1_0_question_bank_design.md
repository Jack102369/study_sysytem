# 14 P1-0 正式题库规范与质量控制

> 题表：`hs_math_train_items`  
> 答案协议：沿用 P0 `answer_payload_json`（04 / answer-protocol）  
> 状态机：`draft → approved | disabled`；**禁止**新建直批 approved。

---

## 1. 正式题必备字段

| 项 | 来源 |
|----|------|
| 题目编号 code | 唯一；正式题建议 `rja.ch1.s1.001` 风格，禁止 `HS_MATH_P0_` 前缀 |
| 教材/册/章 | specialty + book_code |
| 小节 | category（非测试占位） |
| 知识点 | `hs_math_train_item_kps`（≥1，建议标主 KP） |
| 题型 | single / multi / judge / numeric |
| 难度 | **1\|2\|3**（P0 协议，见下） |
| 题干 | TEXT，LaTeX `$...$` / `$$...$$` |
| 选项 | options_json（选择/多选） |
| 标准答案 | answer_payload_json |
| 解析 | analysis 建议非空（第一章正式题强制） |
| pool | formal |
| status | 录入 draft；审核后 approved |
| content_version | 关键内容 +1，可能打回 draft（现有规则） |

---

## 2. 难度体系（兼容 P0）

**数据库与 DTO 保持 `HS_MATH_DIFFICULTIES = [1,2,3]`，P1-0 不扩展到 5。**

| 值 | 展示名 | 审核标准（可操作） |
|----|--------|-------------------|
| 1 | 基础 | 单一概念直接判断或计算，一步内 |
| 2 | 巩固 | 1–2 个知识点步骤或简单组合 |
| 3 | 提高 | 多知识点组合、多步骤或分类讨论 |

用户文案中的「综合/挑战」若需要：P1 后期再评估是否增加 4/5 并改 DTO——**不得悄悄改 1–3 含义**。

---

## 3. 四题型答案协议（不变）

- single: `{kind:'single', optionId}`  
- multi: `{kind:'multi', optionIds}`（集合相等）  
- judge: `{kind:'judge', value:boolean}`  
- numeric: `{kind:'numeric', value, toleranceAbs?, toleranceRel?}`；学生作答 `{kind:'numeric', input}`  

禁止：科学计数法作标准答案；禁止用字符串 `"true"` 表示判断。

---

## 4. LaTeX 与等价

- 展示：KaTeX / `renderMathHtml`。  
- **判题**：不得用 LaTeX 字符串相等；numeric 走有理数规范化（P0 grade v1）。  
- 不引入表达式等价引擎（P2+）。

---

## 5. 版权与原创

- 不照抄教材原题全文。  
- 可按知识目标原创等价练习。  
- 解析侧重方法与易错点，避免大段教材原文。

---

## 6. 质量门禁（可自动化）

| 检查项 | 自动 | 说明 |
|--------|------|------|
| code 唯一 / 非测试前缀 | ✓ | |
| qtype ∈ 四类 | ✓ | |
| stem 非空、不含 `HS_MATH_P0_E2E` | ✓ | |
| single/multi：options≥2、id 唯一、文本非空 | ✓ | |
| single：optionId ∈ options | ✓ | |
| multi：optionIds ⊆ options 且非空去重 | ✓ | |
| judge：value boolean | ✓ | |
| numeric：value 可解析；非法科学计数法拒 | ✓ | |
| 已有 validateAnswerPayload | ✓ | 复用 |
| 至少 1 个 KP 且同 specialty | ✓ | P1-0C |
| 主 KP 至多一个 | ✓ | |
| analysis 对第一章正式题非空 | ✓ 可配置 | |
| 重复题：stem 规范化哈希近似 | ✓ 弱 | 人工复核 |
| 数学命题正确性 | ✗ | **仅人工** |
| 解析与答案一致 | ✗ 为主 | 抽检人工 |
| 条件是否充分 / 多解是否声明 | ✗ | 人工 |

流程：

```
录入/导入 → 结构校验 →（可选）重复检测 → 管理员预览
  → 人工审核 → PATCH status=approved
```

**禁止**：批量生成后直批；AI 输出直入标准答案；导入自动 approved。

---

## 7. 分批建设

### 第一批（P1-0E）：第一章 · 50～100 题

覆盖：集合概念/关系/运算、充要条件、量词。  
题型按内容选型，不强行四题型全覆盖每个 KP。  
难度比例建议：1 : 2 : 3 ≈ 5 : 3 : 2。

### 后续批

按章推进；每批验收：空状态消失、抽题无测试前缀、抽检正确率与人工答案一致。

---

## 8. 参数化出题（结论）

**不放入 P1-0。** 理由：

1. P1-0 首要缺口是「有可信人工题」与知识体系，不是生成器。  
2. 参数化需独立模板语言、约束求解、选项生成防重——工作量大。  
3. 与「不自动批准」叠加后，生成器价值被审核人力制约。  

建议：**P1-2** 再做「模板草稿 → draft」工具；仍禁止直批。

---

## 9. 导入

- 格式：JSON/CSV（编码阶段定）  
- 必须预览 + 错误行报告  
- 全部进入 **draft**  
- 失败行不部分静默成功（事务或明确部分成功报告）

---

## 10. 测试题隔离

- 已 disabled 的 E2E 题保持 disabled。  
- 批准 API：拒绝 code 匹配测试前缀或 source=e2e。  
- 学生端列表不展示 disabled。

---

*文档结束：14_p1_0_question_bank_design.md*
