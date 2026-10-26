# HS-MATH-BANK-DIAGRAM-1H — 题干插图真实网页验收

> 日期：2026-10-26  
> **当前状态：`WAITING_USER_UI`**（用户反馈中；管理端有已知缺口）  
> 前置：1G `DIAGRAM_REVIEW_APPROVE_PASS` · drawable **113**  
> **本阶段以用户本人网页操作为准。** Cursor 只做只读准备；**不得**用 API/构建结果冒充 UI 通过。

---

## 1. 结论（本回合）

| 项 | 结果 |
|----|------|
| Cursor 只读准备 | **完成**（四题 approved、各 1 图、鉴权读 SHA 与 147 一致、drawable=113） |
| 管理员 · 题库编辑 | **093 用户已见插图**（正方体示意 · `#1 · image/png · e12b2f2b…`） |
| 管理员 · 人工审核页 | **093 无插图**（见 §2.4 缺口；非图片丢失） |
| 学生训练网页验收 | **未验收** |
| 历史快照网页验收 | 预标 **`HISTORY_SNAPSHOT_UI_NOT_RUN`** |
| **阶段状态** | **`WAITING_USER_UI`** |

旁证：`_g1h_readonly_prep.json` · `_g1h_history_probe` 输出

---

## 2. Cursor 只读准备（非 UI 验收）

### 2.1 服务可达性

| 目标 | 结果 |
|------|------|
| API `http://127.0.0.1:3000` | 可达（未鉴权列表 401，属预期） |
| Web `http://localhost:5173/` | **200**（本机 `127.0.0.1:5173` 探测失败，请用 **localhost**） |

### 2.2 四题正式态

| code | id | status/cv | specialty | category | 图 | 鉴权读 |
|------|-----|-----------|-----------|----------|----|--------|
| CAND-G1B-093 | 244 | approved/2 | rjb-ch3 立体几何初步 (id=23) | 8.6 (id=77) | link1/obj1 | 200 · SHA✓ |
| CAND-G1B-080 | 231 | approved/2 | rjb-ch1 平面向量 (id=21) | 6.4 (id=65) | link2/obj2 | 200 · SHA✓ |
| CAND-G1B-064 | 215 | approved/3 | rja-ch5 三角函数 (id=20) | 5.7 (id=61) | link3/obj3 | 200 · SHA✓ |
| CAND-G1B-091 | 242 | approved/2 | rjb-ch3 立体几何初步 (id=23) | 8.2 (id=73) | link4/obj4 | 200 · SHA✓ |

drawable = **113**。未改题、未改图、未 review/approve、未建 session。

### 2.4 用户反馈：审核页无图（093）→ 已修复（待用户复验）

| 页面 | 现象 |
|------|------|
| `/settings/hs-math-train-items` 编辑对话框 | **有图**：正方体示意 · `#1 · image/png · e12b2f2b…` · 公式正常 |
| `/settings/hs-math-train-review` 人工审核工作台 | **修复前无图**；已接入只读 `HsMathStemDiagrams`（**请刷新页面复验 093**） |

**根因（代码）**：非存储故障。

1. `HsMathTrainItemsReviewView.vue` 题干区原只用 `MathStem`，未挂载 `HsMathStemDiagrams`
2. `GET …/review-panel` 仍不返回 diagrams；审核页现并行调用既有 `GET …/train-items/:id/diagrams` 只读加载

**修复（2026-10-26）**：仅改 `HsMathTrainItemsReviewView.vue`；题干下只读预览 + 点击放大；无上传/替换；不升版、不改题。

### 2.5 前端接入（代码核对，≠ 网页看到）

| 角色 | 路由 | 组件 |
|------|------|------|
| 管理题库 | `/settings/hs-math-train-items` | `HsMathTrainItemsAdminView` → `HsMathStemDiagrams` |
| 学生开训 | `/hs-math/specialties/:code/train` | setup 无 itemIds |
| 学生作答 | `/hs-math/train/session/:id` | `HsMathTrainSessionView` → `HsMathStemDiagrams` |
| 结果/历史 | `/hs-math/train/result/:id` · `/hs-math/train/history` | `HsMathTrainResultView` → `HsMathStemDiagrams` |

插图：JWT blob 拉取 + 缩略图点击 → `el-dialog`「插图预览」。

学生端 **不能** 指定 244/231/215/242；未抽到须记 `STUDENT_TARGET_NOT_REACHED`。

---

## 3. 请你本人执行的操作步骤

### A. 管理员题库（必做）

1. 浏览器打开：`http://localhost:5173/settings/hs-math-train-items`（Admin 登录）
2. 搜索框分别搜：`CAND-G1B-093` / `080` / `064` / `091`
3. 打开编辑对话框，确认题干下方插图：
   - 显示正确、与题匹配、顺序正确、清晰
   - 点击可放大（预览对话框）
   - 公式渲染正常；答案/解析区正常
4. **特别看 093**：正方体示意、BD₁ 与平面 A₁C₁D、无证明结论字样

在下方「用户验收记录」填表。打开 DevTools → Console / Network，记下错误或图片 4xx/5xx。

### B. 学生训练（尽量；不可强制抽中）

建议缩小池子提高命中率（**勿改库权重**）：

| 目标题 | 开训入口建议 |
|--------|----------------|
| 093 | 专项 `rjb-ch3`，分类 **8.6**，题型应用题，难度 3 |
| 080 | 专项 `rjb-ch1`，分类 **6.4**，应用题，难度 3 |
| 064 | 专项 `rja-ch5`，分类 **5.7**，应用题，难度 3 |
| 091 | 专项 `rjb-ch3`，分类 **8.2**，单选，难度 3 |

示例（按实际 UI 选专项后带查询参数，以页面为准）：

- `http://localhost:5173/hs-math/specialties/rjb-ch3/train?specialtyId=23&categoryId=77`
- `http://localhost:5173/hs-math/specialties/rjb-ch1/train?specialtyId=21&categoryId=65`
- `http://localhost:5173/hs-math/specialties/rja-ch5/train?specialtyId=20&categoryId=61`
- `http://localhost:5173/hs-math/specialties/rjb-ch3/train?specialtyId=23&categoryId=73`

检查：题干+图同屏、清晰、可放大、窄屏可读、不影响答题/拍照、公式正常。  
**若整场未抽到上述四 code 任一**：记 `STUDENT_TARGET_NOT_REACHED`，勿假装已验。

### C. 历史页

1. 打开 `/hs-math/train/history`，进入**已有**完成结果页  
2. 若有带插图快照的 session：确认显示的是**开训时快照**，非依赖当前题实时关联  
3. 只读库当前：**无任何** `session_item_diagrams` 行 → 默认 **`HISTORY_SNAPSHOT_UI_NOT_RUN`**  
4. **禁止**为验收新建带图 session 来填「通过」

---

## 4. 用户验收记录（待填）

> 未操作的项保持「未验收」。填完后把阶段状态改为 `UI_PASS` / `PARTIAL` / `BLOCKED`。

### 4.1 管理员

| code | 打开页面 | 图显示 | 匹配 | 顺序 | 清晰 | 放大 | 公式 | 答案/解析 | 控制台错误 | 图加载失败 |
|------|----------|--------|------|------|------|------|------|-----------|------------|------------|
| 093 | 题库✓；审核页已修代码，**待刷新复验** | 题库✓ | 题库✓ | #1 | 题库✓ | 待复验 | 两页✓ | 两页✓ | 未报 | 非丢图 |
| 080 | 未验收 | | | | | | | | | |
| 064 | 未验收 | | | | | | | | | |
| 091 | 未验收 | | | | | | | | | |

093 正方体特别说明：题库编辑可见 BD₁ 与平面 A₁C₁D 示意，SHA 前缀 `e12b2f2b`；人工审核工作台同题无插图区块（前端未接入）。

### 4.2 学生训练

| 项 | 记录 |
|----|------|
| 实际打开的专项/分类/题型 | 未验收 |
| 实际抽到的 code 列表 | 未验收 |
| 是否命中 093/080/064/091 | 未验收 |
| 题干+图 / 放大 / 窄屏 / 答题区 | 未验收 |
| 标记 | （未抽中则 `STUDENT_TARGET_NOT_REACHED`） |

### 4.3 历史

| 项 | 记录 |
|----|------|
| 是否打开真实历史结果页 | 未验收 |
| 是否见到带图快照 | 只读：**库内 0 条快照** |
| 标记 | **`HISTORY_SNAPSHOT_UI_NOT_RUN`**（除非用户另有带图历史并填下方） |
| 用户补充 | |

### 4.4 移动端 / 其它

| 项 | 记录 |
|----|------|
| 手机尺寸或 DevTools 窄屏 | 未验收 |
| 其它问题 | |

---

## 5. 未执行事项（Cursor）

- 未代为点击浏览器验收  
- 未创建训练 session  
- 未修改正式题/插图/review/approve  
- 未调用真实 AI、未改配置、未重启服务、未 Git commit/push  
- 未进入后续题库生成阶段  

---

## 6. 状态机

用户完成网页操作并回填 §4 后：

- 管理端四题关键项全过，且学生/历史按规则标注 → 可升 **`UI_PASS`** 或 **`PARTIAL`**
- 功能坏（图不显示、放大失败、公式坏等）→ **`BLOCKED`**
- 仅准备完成、用户未点 → 保持 **`WAITING_USER_UI`**

**本回合：`WAITING_USER_UI`。完成后停止。**
