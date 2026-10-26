# HS-MATH-BANK-DIAGRAM-1G — 四道配图题重新审核与批准

> 日期：2026-10-26  
> **最终状态：`DIAGRAM_REVIEW_APPROVE_PASS`**  
> 前置：1F `DIAGRAM_UPLOAD_PASS` · 四题 draft + 插图已入库  
> 经由 Admin review API → Admin approve API；**未** SQL 改 review；**未**改题干/答案/解析/图片

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 数学审核 | 四题均 **passed**（题干↔图、答案、解析、rubric、泄题、KP/method） |
| review API | 四次 **201** · `reviewStatus=passed` · status 仍 draft |
| approve API | 四次 **200** · `status=approved` · `confirmPublish=true` |
| drawable | **109 → 113** |
| session | 133 / 357 · **未变** |
| **状态** | **`DIAGRAM_REVIEW_APPROVE_PASS`** |

旁证：`_g1g_review_approve_result.json` · `_g1g_preflight_live.json`

---

## 2. 执行前核验

| code | id | status/cv | 图数 | SHA=147 | 旧 review stale | 064 仰角 | 091 新图 |
|------|-----|-----------|------|---------|-----------------|----------|----------|
| 093 | 244 | draft/2 | 1 | ✓ | #54@cv1 | — | — |
| 080 | 231 | draft/2 | 1 | ✓ | #50@cv1 | — | — |
| 064 | 215 | draft/3 | 1 | ✓ | #46@cv1 | ✓ 无「顶角」 | — |
| 091 | 242 | draft/2 | 1 | ✓ `a77867e8beb4…` | #73@cv1 | — | ✓ 无角度数字 |

来源：`original` + `unverified` + `unknown` + 出处「本批原创」→ 符合既有正式批准门禁。  
答案/解析/rubric：未在本阶段修改（仅审读）。

---

## 3. 数学审核要点（非「上传即过」）

| code | 判定 | 要点 |
|------|------|------|
| 093 | passed | 正方体示意标 BD₁ 与平面 A₁C₁D；无证明结论；application rubric 10 分 |
| 080 | passed | 向量 a、b 与对角线交于 M；图不写「互相平分」；答案/解析一致 |
| 064 | passed | 题干「塔顶的仰角为 30°」；答案 \(40\sqrt3/3\)；图注仰角无结果值 |
| 091 | passed | 单选 A；新版图无 90°/45°/135° 文字、不圈选；解析选 A |

插图目视：`docs/high_school_math/diagrams/independent_review_pack/*.png`（与入库 SHA 一致）。

---

## 4. Review / Approve 结果

| code | reviewId | fp（当前） | cv | approve | 鉴权读图 |
|------|----------|------------|----|---------|----------|
| 093 | **134** | `e464af249073749161f7ebba8a4ab9f7ea7922906e7e1b8a538963598c781375` | 2 | approved | 200 · SHA 一致 |
| 080 | **135** | `2601360d50b59c8ce2afe690885df65231f3033db5362977f02fd446aba9cad8` | 2 | approved | 200 · SHA 一致 |
| 064 | **136** | `2ab277fc2fdd34b1259f5e258f0582ed3468180eec0521a61a32ded4b40dfcb0` | 3 | approved | 200 · SHA 一致 |
| 091 | **137** | `b93e4f06c1c93e63aff702a8a2ee32aa057f4d92e366067e0a2414816cce6157` | 2 | approved | 200 · SHA 一致 |

API：

- `GET /hs-math/admin/train-items/:id/review-panel` → 取 `contentVersion` + `contentFingerprint`
- `POST /hs-math/admin/train-items/:id/reviews` `{ decision, comment, expectedContentVersion, expectedContentFingerprint }`
- `PATCH /hs-math/admin/train-items/:id/status` `{ status: "approved", confirmPublish: true }`
- `GET …/diagrams/:linkId/content` Admin JWT 复验

Admin：`userId=2`。

---

## 5. 完成后验证

| 检查 | 结果 |
|------|------|
| 四题 status | 均为 **approved** |
| contentVersion | 093=2 · 080=2 · 064=3 · 091=2 |
| 当前有效 review | #134–137 · passed · fp 匹配 |
| 插图关联 | 各 1 张 · SHA 仍与 147 一致 |
| drawable | **113** |
| 历史 session | 未变 |
| 其他题目 | 本脚本仅操作四 id |

---

## 6. 未执行事项

- 未修改题干 / 答案 / 解析 / rubric  
- 未替换或删除图片  
- 未创建训练 session  
- 未调用真实 AI / 未改 AI 配置  
- 未重启服务  
- 未 Git commit / push  
- **未**进入网页验收 / 学生端开训验收  

---

## 7. 状态

**`DIAGRAM_REVIEW_APPROVE_PASS`**

完成后停止。下一阶段（可选网页验收）须另开任务授权。
