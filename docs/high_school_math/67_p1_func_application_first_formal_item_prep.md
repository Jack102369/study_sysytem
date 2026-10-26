# P1-FUNC · 首道正式应用题内容准备（入库前草案）

> **阶段**：APPLICATION-1 业务验收前置（内容准备）  
> **日期**：2026-10-25  
> **库**：`study_system`（本轮**只读**查询；**无写库**）  
> **结果**：内容草案完成，待用户确认后授权写入  
> **APPLICATION-1**：保持 **PARTIAL**  
> **APPLICATION-2**：保持 **NOT_STARTED**  
> **CORE-1A-4B**：保持 **BLOCKED**

---

## 0. 本轮范围与禁止事项

| 允许 | 禁止 |
|---|---|
| 阅读协议 / 门禁 / 知识点 / 方法 | 写数据库、创建正式题 |
| 设计原创应用题草案 | 审核 passed、approve |
| 生成 API 创建请求草案 | 修改现有 110 题 / 抽题规则 |
| 更新本文与 HANDOFF | 迁移、AI、图片上传、APP-2、CORE-1B |

---

## 1. 资料核对摘要

| # | 项 | 结论 |
|---|---|---|
| 1 | application 协议 | `answer_payload_json = { kind, standardAnswer, maxScore, rubric[] }`；学生作答 `{ kind, text }`；批改 → `pending_ai` |
| 2 | rubric | key 唯一；各项 `maxScore` 正整数；合计 = 顶层 `maxScore` |
| 3 | 第三章教材 | 专长 `rja-ch3` id=18；小节含 **3.4 函数的应用（一）** category_id=**44** |
| 4 | 3.4 知识点 | **库中无** `rja.3.4%` / category_id=44 的 KP（0 条）→ 本题挂 3.4 小节，关联同专长下 3.1/3.2 已有 KP |
| 5 | 解题方法 | 现有 11 个；本题建议 `defn` / `equiv_transform` / `mono_analysis` |
| 6 | 审核流程 | draft → 人工 review **passed**（当前 content fingerprint）→ 单独 **approve** |
| 7 | 发布门禁 | formal 池；非 IT 前缀；analysis 非空；≥1 KP 且唯一主 KP；来源许可；当前版本 review passed |
| 8 | 抽题规则 | 学生会话 **仅 formal + approved + active**；本轮**不改**规则 |

**基线（只读，2026-10-25）**：items 110；approved 12 / draft 93 / disabled 5；methods 11；item_methods 16；reviews 12。

---

## 2. 题目元数据

| 字段 | 建议值 |
|---|---|
| code | `HSMA-RJA-CH03-APP-0001` |
| pool | `formal` |
| status（创建时） | `draft`（禁止本轮 approve） |
| qtype | `application` |
| specialty | `rja-ch3`（id **18**）· 第三章 函数的概念与性质 |
| category | `3.4`（id **44**）· 函数的应用（一） |
| difficulty | `2` |
| 来源 | `original` / verification=`unverified` / license=`unknown` |
| 原创说明 | **原创设计建议 ≠ 已核实原创**；不得自动设 `verified` |

---

## 3. 题干

某社区游泳馆暑假期间调整日票价格。调查表明：当票价定为 \(x\) 元（\(x\) 为正整数，且 \(30\le x\le 60\)）时，预计日接待人数为 \(2400-30x\) 人。设该馆日票务收入为 \(y\) 元。

（1）写出 \(y\) 关于 \(x\) 的函数解析式，并写出定义域；  
（2）求使日票务收入最大的票价，以及相应的最大日票务收入。

（要求写出必要的建模与求解过程。）

---

## 4. 标准答案（`standardAnswer`）

（1）\(y=x(2400-30x)=2400x-30x^{2}\)，定义域 \(x\in\{30,31,\ldots,60\}\)（或等价写 \(x\in\mathbb{Z}\) 且 \(30\le x\le 60\)）。  
（2）当票价为 **40 元** 时，日票务收入最大，最大值为 **48000 元**。

---

## 5. 完整标准解析（`analysis`）

**建模**  
日票务收入 = 票价 × 日接待人数，故  
\[
y=x(2400-30x)=2400x-30x^{2}.
\]
由题意 \(x\) 为正整数且 \(30\le x\le 60\)。另需人数非负：\(2400-30x\ge 0\Rightarrow x\le 80\)，与给定区间取交后仍为 \(30\le x\le 60\)。故定义域为  
\(x\in\{30,31,\ldots,60\}\)。

**求解最值**  
配方：
\[
y=-30\left(x^{2}-80x\right)=-30\bigl[(x-40)^{2}-1600\bigr]=-30(x-40)^{2}+48000.
\]
二次函数开口向下，顶点横坐标 \(x=40\)。又 \(40\) 落在定义域内且为整数，故唯一最大值点为 \(x=40\)，  
\[
y_{\max}=48000.
\]

**检验（可选）**  
\(y(30)=45000\)，\(y(60)=36000\)，均小于 \(48000\)，与结论一致。

**结论**  
票价定为 40 元时，日票务收入最大，为 48000 元。

---

## 6. 解题思路 / 易错点

**思路**  
1. 用「单价 × 数量」建立二次函数模型；  
2. 根据实际约束写清定义域；  
3. 用配方（或顶点公式 / 单调性）求闭区间（离散）上的最大值；  
4. 用单位给出实际结论。

**易错点**  
- 写成 \(y=2400-30x\)（漏乘票价）；  
- 定义域写成 \(\mathbb{R}\) 或忽略整数约束；  
- 顶点 \(x=40\) 算对但未说明在定义域内；  
- 最大收入漏单位或写成人数。

---

## 7. Rubric（满分 10）

| key | title | maxScore | criteria（部分得分说明） |
|---|---|---:|---|
| model | 建立收入函数模型 | 3 | 写出 \(y=x(2400-30x)\) 或 \(2400x-30x^{2}\)。仅列式缺「收入=票价×人数」说明可扣 1；模型结构错误（如未乘 \(x\)）本项 0～1。 |
| domain | 定义域与实际约束 | 2 | 给出 \(30\le x\le 60\) 的整数定义域（或等价表述）。仅写区间未提整数可给 1；与题意明显不符 0。 |
| solve | 最值推导过程 | 3 | 用配方/顶点/单调性正确求得 \(x=40\)。方法正确但计算失误可给 1～2；仅猜答案无过程给 0～1。 |
| conclusion | 实际结论与单位 | 2 | 明确「票价 40 元、最大收入 48000 元」。答案对但缺单位或过程不完整导致结论孤立：1；答案错 0。 |

校验：\(3+2+3+2=10=\texttt{maxScore}\)。  
设计意图：可区分「方法对、计算错」与「答案对、过程不完整」。

---

## 8. 知识点 / 方法关联建议

### 知识点（同专长 id=18；3.4 暂无自有 KP）

| 角色 | id | code | name |
|---|---:|---|---|
| **主** | 31 | `rja.3.2.06` | 最大值 |
| 辅 | 21 | `rja.3.1.06` | 解析法 |
| 辅 | 17 | `rja.3.1.02` | 定义域 |

> 备注：category=3.4 无 KP 属 taxonomy 缺口；**不**在本轮新建 KP。批准门禁只要求同 specialty + 唯一主 KP，上述关联可满足。

### 解题方法

| 角色 | id | code | name |
|---|---:|---|---|
| **主** | 36 | `mono_analysis` | 单调性分析 |
| 辅 | 38 | `equiv_transform` | 等价转化（配方） |
| 辅 | 30 | `defn` | 定义法（建立函数） |

（方法非批准硬门禁，但结果页展示依赖关联；建议入库时一并写入。）

---

## 9. 来源说明（写入字段）

```text
sourceType: original
sourceVerificationStatus: unverified
sourceLicenseStatus: unknown
sourceReference: 原创设计建议：人教A版必修第三章「函数的应用（一）」情境下的票价—人数—收入建模题；尚未人工核实是否与公开题雷同。
sourceAdaptationNote: null
sourceYear / sourceExamName / sourceQuestionNo: null
```

**不得**将 verification 设为 `verified`。  
门禁：`original + unverified + unknown` **允许**后续正式 approve（展示须标明未核实）。

---

## 10. 数学质量检查

| # | 检查项 | 结果 |
|---|---|---|
| 1 | 模型正确性 | **PASS**：\(y=x(2400-30x)\) |
| 2 | 定义域合理 | **PASS**：题设区间 ∩ 人数非负 → \([30,60]\) 整数 |
| 3 | 推导正确 | **PASS**：配方得 \(y=-30(x-40)^{2}+48000\) |
| 4 | 数值计算 | **PASS**：\(y(40)=48000\)；端点 45000、36000 更小 |
| 5 | 其他解法 | 顶点公式、对称轴、导数（超纲可选）均得同一结果 |
| 6 | 最终答案唯一 | **PASS**：\(x=40\)，\(y=48000\) |
| 7 | 单位 | **需要**：元 |
| 8 | 实际情境 | **PASS**：人数、票价量级合理 |

**结论**：数学质量达到正式题库候选标准；**内容尚未入库、未审核、未批准**。

---

## 11. API 创建请求草案（禁止实际发送）

### 11.1 `POST /api/hs-math/admin/train-items`（示意）

```json
{
  "code": "HSMA-RJA-CH03-APP-0001",
  "pool": "formal",
  "qtype": "application",
  "stem": "某社区游泳馆暑假期间调整日票价格。调查表明：当票价定为 x 元（x 为正整数，且 30≤x≤60）时，预计日接待人数为 2400−30x 人。设该馆日票务收入为 y 元。\n\n（1）写出 y 关于 x 的函数解析式，并写出定义域；\n（2）求使日票务收入最大的票价，以及相应的最大日票务收入。\n\n（要求写出必要的建模与求解过程。）",
  "optionsJson": null,
  "answerPayloadJson": {
    "kind": "application",
    "standardAnswer": "（1）y=x(2400−30x)=2400x−30x²，定义域 x∈{30,31,…,60}。\n（2）票价 40 元时日票务收入最大，最大值为 48000 元。",
    "maxScore": 10,
    "rubric": [
      {
        "key": "model",
        "title": "建立收入函数模型",
        "maxScore": 3,
        "criteria": "写出 y=x(2400−30x) 或 2400x−30x²。仅列式缺说明可扣 1；模型结构错误本项 0～1。"
      },
      {
        "key": "domain",
        "title": "定义域与实际约束",
        "maxScore": 2,
        "criteria": "给出 30≤x≤60 的整数定义域（或等价表述）。仅写区间未提整数可给 1。"
      },
      {
        "key": "solve",
        "title": "最值推导过程",
        "maxScore": 3,
        "criteria": "用配方/顶点/单调性正确求得 x=40。方法对计算错可给 1～2；无过程猜答案 0～1。"
      },
      {
        "key": "conclusion",
        "title": "实际结论与单位",
        "maxScore": 2,
        "criteria": "明确票价 40 元、最大收入 48000 元。缺单位或结论孤立给 1；答案错 0。"
      }
    ]
  },
  "analysis": "建模：y=x(2400−30x)=2400x−30x²。定义域 x∈{30,…,60}（人数非负约束与题设区间相容）。配方：y=−30(x−40)²+48000。顶点 x=40∈定义域，故 ymax=48000 元。结论：票价 40 元时日票务收入最大，为 48000 元。",
  "difficulty": 2,
  "specialtyId": "18",
  "categoryId": "44",
  "knowledgePointId": "31"
}
```

> 创建后通常仍为 `draft`；来源字段若创建接口未带齐，需紧接着 `PATCH` content-meta / source。

### 11.2 建议后续写库步骤（均需单独授权；本轮不执行）

1. 用户确认题干 / 答案 / rubric。  
2. 授权创建 formal **draft**（上列 POST）。  
3. 写入 / 核对 `answerPayloadJson` + `analysis`。  
4. 关联 KP：`primaryKnowledgePointId=31`，另链 21、17。  
5. 关联方法：`primaryMethodId=36`，另链 38、30。  
6. 来源：`original` + `unverified` + `unknown` + reference 说明。  
7. 人工审核 **passed**（对应当前 content fingerprint）。  
8. **单独授权**正式 **approve**（不得与审核合并自动执行）。  
9. 学生正常抽题（不改规则）→ 提交文字 → 验 `pending_ai` → 结果 / 历史。

---

## 12. 需要用户确认的事项

1. 是否采用本「游泳馆票价」情境与数值。  
2. 定义域表述偏好：离散整数集 vs 先连续再说明取整（草案采用离散）。  
3. 主知识点是否定为 `rja.3.2.06`（最大值）；是否接受 3.4 暂挂 3.1/3.2 KP。  
4. 是否授权下一步创建 formal draft（仍不 approve）。  
5. 原创雷同风险：上线前建议人工检索公开题库（本轮未检索、未标 verified）。

---

## 13. 阶段标记

| 项 | 状态 |
|---|---|
| 本轮内容准备 | **完成（未入库）** |
| APPLICATION-1 | **PARTIAL** |
| APPLICATION-2 | **NOT_STARTED** |
| CORE-1A-4B | **BLOCKED** |
