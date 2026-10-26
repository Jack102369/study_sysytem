# 04 高一数学训练与判题设计（审查修订版）

> P0 题型仅：`single` | `multi` | `judge` | `numeric`。  
> 覆盖作答；提交事务+行锁；无 AI/SymPy/mathjs 判题。

---

## 1. 会话链路（定稿）

```
POST sessions          事务创建 + 快照
GET  sessions/:id      属主校验；in_progress 脱敏
PATCH .../answers      覆盖 user_answer_payload_json
POST sessions/:id/submit  FOR UPDATE 锁会话行 → 判题 → completed
GET  sessions          历史（completed/cancelled）
POST sessions/:id/cancel
```

### 1.1 规则清单

| # | 规则 |
|---|------|
| 1 | 仅 `session.user_id === JWT.sub` 可访问 |
| 2 | `in_progress` 的 GET **不得**返回 `answer_payload_json` / `analysis`（服务端剥离） |
| 3 | `status=completed` 再 submit → 幂等返回同一结果 |
| 4 | `cancelled` 禁止 submit / saveAnswer |
| 5 | 作答覆盖，不新增 attempts |
| 6–7 | 判题只读快照；题库改/删不影响已写入的 session_items |
| 8 | create：事务保证 session 与 items 同成同败 |
| 9 | submit：事务 + `SELECT ... FOR UPDATE` 防并发双判 |
| 10 | 结果可复现：依赖快照 + `grade_rule_version` |
| 11 | 历史统计用 session 计数 / session_items.grade_result，不用题库当前答案 |
| 12 | 未作答 → `pending_review`，**不计 wrong** |
| 13 | 正确率分母 = correct+wrong，**不含 pending** |
| 14 | 结果含 correct_count / wrong_count / pending_count |
| 15 | 题量不足：见 §1.2 |

### 1.2 题量不足

创建时 `available < requested`：

- **推荐**：`actual_count = available`（≥1）仍创建；响应 `shortfall` 提示。  
- 若 `available=0`：`400`「该分类暂无已批准题目」。

### 1.3 并发提交

```text
BEGIN
  SELECT * FROM hs_math_train_sessions WHERE id=? AND user_id=? FOR UPDATE
  if status=completed → 读 items → COMMIT → 返回结果（idempotent:true）
  if status=cancelled → ROLLBACK → 400
  if status≠in_progress → ROLLBACK → 400
  加载 session_items；逐题 grade；UPDATE items；UPDATE session 计数与 status=completed
COMMIT
```

判题、写 item、写 session **同一事务**。失败整单回滚，会话保持 in_progress。

---

## 2. 四题型协议（P0）

公共约定：

- DB/API JSON：UTF-8；数字答案在 payload 内用 **字符串** 保存精确小数/分数（避免 JSON number 精度坑）。  
- DTO：class-validator；`answer_payload` / `user_answer_payload` 用自定义校验或按 qtype 分支 DTO。  
- `grade_rule_version`: `"v1"`。

### 2.1 single

**题目 options_json**

```json
{
  "options": [
    { "id": "A", "text": "集合 $\\{1,2\\}$" },
    { "id": "B", "text": "空集" }
  ]
}
```

**标准 answer_payload_json**

```json
{ "kind": "single", "optionId": "A" }
```

**学生提交 user_answer_payload_json**

```json
{ "kind": "single", "optionId": "A" }
```

**判题**：`optionId` 必须属于 options.id；否则 pending_review（非法）。相等 → correct，否则 wrong。空/缺省 → pending_review。

---

### 2.2 multi

**options_json**：同 single。  

**标准**

```json
{ "kind": "multi", "optionIds": ["A", "C"] }
```

**学生**

```json
{ "kind": "multi", "optionIds": ["C", "A"] }
```

**判题**：

- 去重后比较集合；顺序无关。  
- 若提交含重复 id → 先去重再比（或直接 pending；**定稿：去重后比较**）。  
- 空数组 / 缺省 → pending_review。  
- 含无效 id → pending_review。  
- 集合不等 → wrong。

---

### 2.3 judge

**options_json**：`null` 或不需要。  

**标准**

```json
{ "kind": "judge", "value": true }
```

**学生**

```json
{ "kind": "judge", "value": false }
```

**判题**：`value` 必须是 JSON boolean（`true`/`false`），**禁止**字符串 `"true"`。类型不符 → pending_review。相等 → correct/wrong。缺省 → pending_review。

---

### 2.4 numeric

**标准**

```json
{
  "kind": "numeric",
  "value": "1.5",
  "toleranceAbs": 0.01,
  "toleranceRel": 0
}
```

或分数：`"value": "3/2"`（标准侧存规范字符串）。

**学生**

```json
{ "kind": "numeric", "input": "1.50" }
```

也允许 `"input": "3/2"`。

**解析（v1）**：

1. trim；禁止空 → pending_review。  
2. 支持可选前导 `+`/`-`、十进制、简单分数 `a/b`（b≠0）。  
3. **P0 不支持**科学计数法（`1e-3`）→ pending_review（可在 reason 说明）；P1 再开。  
4. 解析失败、NaN、Infinity → pending_review。  
5. 比较：设标准值 S、学生值 U、`tolAbs`、`tolRel`（缺省 0）。  
   - `diff = abs(U-S)`  
   - 通过条件：`diff <= tolAbs` **或**（`tolRel>0` 且 `diff <= tolRel * max(abs(S), abs(U))`）  
6. **禁止** JS `==` / 裸浮点 `===`。  
7. 实现用整数缩放或 `decimal.js` **前须审批依赖**；P0 **推荐**纯手写有理数（分数交叉相乘）+ 十进制转分数（限制小数位≤8）。

**零与负数**：合法。  
**非法**：字母、多个小数点、空 → pending_review。

---

## 3. API 脱敏

| 状态 | 返回给前端 |
|------|------------|
| in_progress | items 含 stem/options/qtype/user_answer；**无** answer_payload、analysis |
| completed | 可含答案、解析、grade_* |

前端隐藏不算安全边界。

---

## 4. P1 错题重建预留（P0 快照必留）

session_items 至少含：`item_id`（可空）、`item_code`、`qtype`、`stem`、`answer_payload_json`、`user_answer_payload_json`、`grade_result`、`answered_at`、`knowledge_point_id`、`specialty_id`/`category_id`、`grade_rule_version`、`content_version`。  
session：`submitted_at`、`user_id`、`status=completed`。

| 变化 | 影响 |
|------|------|
| 删题 | item_id SET NULL；快照仍在 → 可按快照重建「逻辑错题」，item 关联弱化 |
| 改 KP 关联 | 历史用快照 KP，不漂移 |
| 升级判题规则 | 旧会话 `grade_result` 不重算；新会话用新 version |

P1：扫描 completed + grade_result in (correct,wrong) 回放即可（对齐化学）。

---

## 5. P0 不做但预留

- session_kind 列可取未来 daily/wrong_*（P0 只写 specialty）  
- 不实现错题状态机页面  
- 不实现 blank/expression  

---

## 6. 会话级基础正确率

- 单次结果：`correct/(correct+wrong)`，pending 不计。  
- 历史列表：展示各会话计数；可选简单汇总 API（仅 completed + counts_formal_stats=1）。

---

*文档结束：04_math_training_design.md*
