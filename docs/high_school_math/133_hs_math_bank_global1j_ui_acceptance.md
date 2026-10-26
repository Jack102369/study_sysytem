# HS-MATH-BANK-GLOBAL-1J — 首批 100 道正式题网页训练验收

> 日期：2026-10-26  
> **最终状态：`WAITING_USER_UI`**  
> 前置：GLOBAL-1I = `APPROVE_PASS`  
> **本阶段 Cursor 仅只读**；未创建训练 session；未改题库；未调真实 AI；未 push

---

## 1. 证据分层（强制）

| 层级 | 本回合状态 | 说明 |
|------|------------|------|
| A. 数据库只读 | **已完成** | §3 |
| B. API / 服务可达 | **已完成** | §2 |
| C. 用户真实网页操作 | **未收到** | 无人工 UI 反馈 → **不得**判 PASS |

> API / DB / build **不能**替代人工 UI PASS。

---

## 2. 准备检查

| 项 | 结果 |
|----|------|
| API `GET /health` | **200** · `app=api` · `db=ok` |
| Web | `http://localhost:5173/` → **200**（`127.0.0.1:5173` 本机探测失败，请用 localhost） |
| 本批 approved | **100 / 100**（formal + active） |
| 正式 drawable | **113**（legacy 13 + CAND 100） |
| 抽题门禁 | `pool=formal` + `status=approved` + `is_active=1`（`HsMathTrainService`） |
| 本批进入候选池 | **100 / 100** |
| 训练历史基线 | sessions=**131** · session_items=**354**（本阶段未增） |
| 日常 AI（`.env` 实测） | 见 §5（**未由本阶段修改**） |

---

## 3. 数据库 / API 只读核验

旁证（勿含密钥、勿 git）：`question_bank/_g1j_ro_check.mjs` → `_g1j_ro.json`

### 3.1 状态与门禁

| 检查 | 实测 |
|------|------|
| CAND 总数 | 100 |
| approved + formal + active | **100** |
| 剩余 draft | **0** |
| drawable 合计 | **113** |
| 037/074 | 仍在池中；**cv=2** |

### 3.2 十章分布（必修一 + 必修二）

| 章节 | code | 本批题量 |
|------|------|--------:|
| 集合与常用逻辑用语 | rja-ch1 | 5 |
| 一元二次函数、方程和不等式 | rja-ch2 | 10 |
| 函数的概念与性质 | rja-ch3 | 15 |
| 指数函数与对数函数 | rja-ch4 | 15 |
| 三角函数 | rja-ch5 | 20 |
| 平面向量及其应用 | rjb-ch1 | 15 |
| 复数 | rjb-ch2 | 3 |
| 立体几何初步 | rjb-ch3 | 10 |
| 统计 | rjb-ch4 | 3 |
| 概率 | rjb-ch5 | 4 |
| **合计 / 有题章节** | | **100 / 10** |

### 3.3 题型 / 难度

| 维度 | 分布 |
|------|------|
| qtype | single **34** · multi **7** · judge **16** · numeric **19** · application **24** |
| difficulty | 基础(1) **35** · 提高(2) **40** · 压轴(3) **25** |

与 GLOBAL-1I 前置说明一致。

### 3.4 KP / method / rubric

| 项 | 结果 |
|----|------|
| KP（含唯一主 KP） | **OK** |
| method | **OK** |
| application rubric（24） | **0 bad** |

---

## 4. 人工网页验收清单（待用户 · user_id=2）

请本人登录后，**代表性抽样**（不必 100 题全交）：

| # | 检查项 | 用户反馈（待填） |
|---|--------|------------------|
| 1 | 单选题正常展示 | |
| 2 | 多选题正常展示 | |
| 3 | 判断题正常展示 | |
| 4 | 数值题正常展示 | |
| 5 | application 正常展示 | |
| 6 | 难度筛选正常 | |
| 7 | 题目与所选章节一致（能抽到 CAND 新题） | |
| 8 | 答案提交正常 | |
| 9 | 结果与解析正常 | |
| 10 | 历史记录可查看 | |

建议抽样：任选必修一 / 必修二各至少一章；五题型各至少一题；三档难度各至少一题。

**应用题 AI**：仅当你主动提交时才触发；默认千问、可选 DeepSeek。Cursor **不会**代建 session / 上传图 / 调模型。

---

## 5. 日常 AI 配置备注（只读，未改）

`.env` 当前可见：

| 键 | 值（脱敏） |
|----|------------|
| `HS_MATH_AI_GRADING_ENABLED` | `false` |
| `HS_MATH_APPLICATION_AI_MODE` | **缺失** |
| `HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS` | **缺失** |
| `HS_MATH_DEEPSEEK_DAILY_LIMIT` | **缺失** |
| `DEEPSEEK_API_KEY` | `[SET]` |
| `QWEN_API_KEY` / `DASHSCOPE_API_KEY` | **缺失** |

说明：

- 与历史 HANDOFF「日常 AI = ENABLED」及 APPLICATION-4D 当时 `owner_only` 描述**不一致**；本阶段**禁止**改开关，仅如实记录。  
- **客观题抽题/训练**不依赖上述 AI 开关。  
- 若网页验收需测应用题真实 AI：请你确认运行中 API 进程实际环境，或另授权后再开开关（**本阶段不做**）。  
- 此项**不**单独把 1J 判为 BLOCKED；在收到网页反馈前状态仍为 `WAITING_USER_UI`。

---

## 6. Cursor 未做事项（合规）

- 未创建 / 未提交训练 session  
- 未调用千问 / DeepSeek  
- 未修改题库、review、approve、历史  
- 未重启服务、未装浏览器自动化、未 push  

---

## 7. 最终状态

```
WAITING_USER_UI
```

请完成 §4 网页抽样后回复结果；再据实收口为 `PASS` / `PARTIAL` / `BLOCKED`。
