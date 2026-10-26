# HS-MATH-BANK-GLOBAL-1H-2 — 037/074 题干润色与重新审核预检

> 日期：2026-10-26  
> **最终状态：`PREFLIGHT_PASS`**  
> 前置：GLOBAL-1H = `REVIEW_PASS`（comment 要求 approve 前润色短题干）  
> **本阶段只读**；未改正文；未 review；未 approve

---

## 1. 结论摘要

| 题 | 是否需要修订 | 修订性质 |
|----|--------------|----------|
| **CAND-G1B-037** | **是** | 仅题干加主题前缀；不改选项/答案/解析/KP |
| **CAND-G1B-074** | **是** | 同上 |
| 数学含义 / 正确答案 / 评分边界 | **不变** | — |
| 其他 98 道 | **不得改** | 库内另有 98 道 CAND，本方案仅点名两码 |
| 编辑后门禁 | **可证明** | stem 变更 → `content_version+1` → 旧 review **stale** → 须重审才能 approve |
| **可否授权执行润色** | **可以**（另阶段实写） | |

---

## 2. 现状（只读实测）

| 字段 | 037 (id=188) | 074 (id=225) |
|------|--------------|--------------|
| status / pool | draft / formal | draft / formal |
| content_version | **1** | **1** |
| 当前 stem | `正确的是（多选）` | 同左 |
| qtype / difficulty | multi / 2 | multi / 2 |
| 答案 | A,B,D | A,B,C |
| review | passed @ cv=1 | passed @ cv=1 |
| fingerprint（审核行） | `f841e04e…8f60` | `c4e1a6a5…8096` |
| drawable | 全库仍 **13** | |

来源：`128` 审核意见 + `_g1h2_preflight_ro.json`（含凭据探查脚本勿 git）。

### 2.1 题干质量问题

| 检查 | 结论 |
|------|------|
| 题干是否独立完整 | **否**：单独阅读无法知道考查对数还是向量 |
| 是否依赖未显示上下文 | **弱依赖选项呈现**：UI 通常同屏给选项，故 1H 仍可通过；但去重/列表/无障碍阅读时题意不清 |
| 选项与答案匹配 | **是**（037 对数法则；074 向量运算律） |
| 考点是否明确 | 选项明确；**题干未点名考点** |
| 是否需补条件 | **否**（不必改选项或增约束）；只需题干标明主题 |

---

## 3. 最小修订方案（建议全文）

**不改**：`options_json`、`answer_payload_json`、`analysis`、KP/method、difficulty、source。

### 3.1 CAND-G1B-037

| | 文本 |
|--|------|
| **修订前** | 正确的是（多选） |
| **修订后** | 下列关于对数运算法则的说法，正确的是（多选） |

**为何不改变数学含义：** 仅声明考查「对数运算法则」；选项 A–D、标准答案 A,B,D、解析中对 C 的定义域/\|M\| 讨论均未改；无新增条件、无删选项。

### 3.2 CAND-G1B-074

| | 文本 |
|--|------|
| **修订前** | 正确的是（多选） |
| **修订后** | 下列关于平面向量运算的说法，正确的是（多选） |

**为何不改变数学含义：** 仅声明考查「平面向量运算」；选项与答案 A,B,C、叉积干扰项 D 及解析未改；未引入新公理或缩小选项集合。

---

## 4. 编辑 API / version / fingerprint（代码证据）

| 步骤 | 机制 |
|------|------|
| 入口 | `PATCH /hs-math/admin/train-items/:id`（`UpdateHsMathTrainItemDto`，Admin） |
| 乐观锁 | 须传 `expectedContentVersion`（当前均为 1） |
| stem 变更 | `needAnswerRevalidate` 含 stem → 写入新 stem；`snapshotTrainItemContent` 比较为变化 |
| 升版 | `contentChanged` → `bumpContentVersionOnMetaEdit` → **`content_version` 1→2**（draft 保持 draft） |
| fingerprint | `computeItemContentFingerprint` / `fingerprintTrainItemContent` **含 stem** → 润色后指纹必变 |
| 旧 review | 仍挂 `content_version=1`；面板 `summarizeCurrentReview`：无同版本记录 → **`currentReviewStatus=stale`** |
| 批准门禁 | `evaluateLatestReviewForPublish` 过滤当前版本 → **NO_REVIEW**，无法 approve，直至新版本重新 `passed` 且指纹匹配 |

因此：**修改题干 → 旧 review 失效 → 必须重新 review → 才具备 approve 资格。** 机制可证明，不构成 BLOCKED。

---

## 5. 建议执行流水线（下阶段授权后，本阶段不执行）

1. 仅对 id **188、225**（code 037/074）`PATCH` stem（上表修订后全文）+ `expectedContentVersion=1`。  
2. 验收：两题 `content_version=2`；其余 **98** 道 CAND 的 stem/cv/review **未变**。  
3. 面板确认两题 review 为 **stale**。  
4. 对两题重新 `POST .../reviews`（绑定新 version + 新 fingerprint）；结论按实审。  
5. **仍禁止**未经授权的 approve；通过后才进入 approve 资格检查。

---

## 6. 风险

- 实写时误改 options/答案 → 会改变数学边界（本预检方案明确禁止）。  
- 若润色文案偏离「对数/平面向量」主题，需重新预检（本方案固定最小前缀）。

---

## 7. 最终状态

```
PREFLIGHT_PASS
```

具备「仅润色 037/074 题干 → 旧审 stale → 重审」的执行条件；**等待另授权实写**。本阶段 **停止**。
