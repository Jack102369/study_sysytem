# HS-MATH-BANK-GLOBAL-1H-PREFLIGHT — 首批 100 draft 正式审核前预检

> 日期：2026-10-26  
> **最终状态：`PREFLIGHT_PASS`**  
> 前置：GLOBAL-1G = `DRAFT_IMPORT_PASS`  
> **本阶段只读**；未执行 review / approve；未写库；未 push

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| `CAND-G1B-*` | **恰好 100**；全 `pool=formal` + `status=draft` + `is_active=1` |
| `content_version` | 全为 **1** |
| 本批已有 review 行 | **0** |
| 本批 approved | **0** |
| drawable / 正式 approved | **13 / 13**（仍为第3章历史题） |
| sessions / session_items | **131 / 354**（相对 1G 后不变） |
| KP / method / application rubric | 100 / 109 / **24/24** |
| fingerprint 机制 | 存在；与 `content_version` 绑定；本批内容粗键 **无互撞** |
| 自动批准路径 | **无**（`submitReview` 不改 status） |
| **可进入正式 review** | **100** |
| **blocked（机制/质量硬阻）** | **0** |
| 037/074 | **非真重复、非换壳同考点**；同短题干模板、异章异 KP（见 §4） |

---

## 2. 数据库只读核验

| # | 检查 | 实测 |
|---|------|------|
| 1 | CAND 数量 | 100 |
| 2 | formal+draft | 100（bad=0） |
| 3 | is_active | 100 |
| 4 | review 记录（本批 item_id） | **0** |
| 5 | approved（本批） | **0**；全库 approved 仍 13 |
| 6 | fingerprint 稳定性 | 内容键双次哈希一致；本批无相同内容指纹对 |
| 7 | KP/method | KP 链接 100（各 1 主）；method 109；缺 0 |
| 8 | application rubric | 24；和分/criteria 持久化 OK |
| 9 | 原正式可抽题 | 仍为 `HSMA-RJA-CH03-*` 共 13，未混入 CAND |
| 10 | 训练历史 | sessions/session_items 未增 |

题型/难度与导入一致：single34 multi7 judge16 numeric19 application24；难度 35/40/25。

旁证（含本地凭据，**勿 git**）：`question_bank/_g1h_preflight_ro.mjs` → `_g1h_preflight_ro.json`。

---

## 3. 审核机制（代码证据）

### 3.1 流程

| 步骤 | 入口 | 效果 |
|------|------|------|
| 队列 | `GET .../train-items/review-queue` | 列 draft 待审（Admin） |
| 面板 | reviewsService 加载面板 | 下发当前 `contentVersion` + **重算** fingerprint |
| 提交审核 | `POST .../:id/reviews` | 写入 `hs_math_train_item_reviews`；**不改** `status` |
| 正式批准 | `PATCH .../:id/status` → `approved` | `evaluateLatestReviewForPublish` + `confirmPublish=true` + 来源/质量门禁 |

权限：`JwtAuthGuard` + `AdminGuard`。

### 3.2 fingerprint 与版本绑定

- 计算：`computeItemContentFingerprint` → `fingerprintTrainItemContent`（与导入 canonicalize 同构，含 stem/options/answer/analysis/KP/method/来源 meta）。  
- 提交审核须带 `expectedContentVersion` + `expectedContentFingerprint`；不匹配 → **409**，须重载。  
- 批准时：当前版本最新 review 须 `passed`，且指纹与**当前重算**一致；意见非空；审核人/时间有效。  
- 改内容会 `content_version++`（approved 退回 draft），旧 passed → **stale**，不得冒充当前通过。

### 3.3 review passed ≠ approved

- `submitReview` 返回明确 notice：未改 status；passed ≠ approved。  
- 抽题仅 `status=approved` + `is_active`。  
- **禁止** SQL 直改 review/status 冒充；本预检未建议任何绕过。

### 3.4 批量可行性

- **无**「一次 API 批量写入 100 条 review」接口。  
- 适合：审核队列 + **逐题** `POST :id/reviews` 分批人工完成。  
- 不存在「review 自动触发 approve」路径。

### 3.5 本批 submit 资格（机制）

`submitBlockReasons`：须 draft、非 test、非 disabled、is_active。  
本批 100 均满足 → **机制上全部可进审**。  
`CAND-G1B-*` 不在 `isBlockedFromApprove` 测试前缀列表。

---

## 4. 质量与重复：重点桶 + 037/074

### 4.1 证据层级

| 桶 | 数量 | 预检意见 |
|----|------|----------|
| 历史 `AUTHOR_CHECKED` | 47 | **作者自检 ≠ 独立终审**；正式 review 仍须全覆盖 |
| 压轴 d3 | 25 | 优先人工重解；均已在 AUTHOR 桶或重叠 |
| application | 24 | 核对 standardAnswer + rubric 持久化（库内已 24/24） |
| SPOT 等其余 | — | 常规审 |

### 4.2 CAND-G1B-037 vs 074

| 维 | 037 | 074 |
|----|-----|-----|
| 题干 | 正确的是（多选） | 相同短模板 |
| 章/specialty | 必修一 ch4 / `rja-ch4` | 必修二 ch6 / `rjb-ch1` |
| KP | `rja.4.3.02` 对数运算法则 | `rjb.6.3.02` 坐标运算 |
| 选项主题 | 对数恒等式 | 向量运算律（含叉积干扰） |
| 答案 | A,B,D | A,B,C |
| 解析 | 对数定义域/\|M\| | 叉积反交换 |

**判定（不得仅因选项不同草率放过）：**

- ❌ **非真正重复**（知识点、册别、选项集合、标准答案均不同）。  
- ❌ **非低价值换壳**（不是同一考点改字母；训练目标分别为对数法则 vs 向量运算律）。  
- ✅ **同题干模板、不同有效考点**（短干「正确的是（多选）」区分度差，属题干质量债）。

**审核处置：** 两题均可进入正式 review；审核意见中须记录「短题干模板」；**建议在 approve 前润色题干加主题前缀**（另授权改库，本阶段不改）。不因模板相同而暂缓整批评审。

---

## 5. 正式审核方案（下一阶段授权后）

### 5.1 顺序

1. **来源/重复风险**：037、074（确认考点分离 + 题干备注）。  
2. **application×24**：rubric/标准答案与解析一致性。  
3. **压轴×25**：独立重解优先于历史 AUTHOR 标签。  
4. **其余**：含原 SPOT；按章或 qtype 扫尾。

### 5.2 批次建议

| 批次 | 范围 | 约量 | 说明 |
|------|------|------|------|
| H1 | 037+074 | 2 | 短干专项 |
| H2 | application | 24 | 可分 2×12 |
| H3 | 其余 d3 | ≤25 | 去重已在 H2 的 |
| H4 | 余下 draft | ~49+ | 队列扫尾 |

每题：打开面板 → 核对数学 → `decision=passed|rejected|deferred` + 非空 comment + 当前指纹/版本。  
**全部 passed 后仍不得自动 approve**；批准须另阶段 `confirmPublish`。

### 5.3 资格汇总

| 口径 | 数量 |
|------|------|
| 可进入正式 review | **100** |
| 须补充库外证据才可审 | **0**（历史 AUTHOR 仅作参考） |
| 机制/质量硬暂缓 blocked | **0** |
| 软提醒（题干模板） | **2**（037/074） |

---

## 6. 风险

1. 短题干模板可能影响后续去重 UX；不阻断本批评审。  
2. `AUTHOR_CHECKED` 易被误当成已终审 — 文档与队列须标明「待人工」。  
3. 探查脚本含凭据，勿提交 git。

---

## 7. 最终状态

```
PREFLIGHT_PASS
```

可授权下一阶段：**逐题正式 review**（仍禁止本阶段式自动 approve）。本阶段 **停止**。
