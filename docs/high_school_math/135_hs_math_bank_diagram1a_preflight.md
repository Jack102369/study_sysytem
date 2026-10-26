# HS-MATH-BANK-DIAGRAM-1A — 高一数学题干插图协议与展示实现预检

> 日期：2026-10-26  
> **最终状态：`PREFLIGHT_COMPLETE`**  
> 前置：1I=`APPROVE_PASS` · 1J=`WAITING_USER_UI` · 1J-DIAGRAM-AUDIT=`PARTIAL`  
> **本阶段仅方案**；未迁移、未改题、未上传正式图、未 review/approve

---

## 1. 结论摘要

| 项 | 结论 |
|----|------|
| 现有题干插图能力 | **缺口成立**（无字段、无协议、`MathStem` 转义 HTML） |
| 复用 application 作答图 | **不可直接复用为题干图**（属学生作答、绑 session_item、非题目内容） |
| 推荐架构 | **不可变对象表 + 题目当前关联表 + session 快照表** |
| 指纹 / 版本 | 图入内容；增删换序 → 升版 → stale → 重审 → 重批 |
| 历史 session | 快照引用不可变 `object_id`；替换当前图不删仍被历史引用的对象 |
| SVG | 允许上传但 **必须服务端清洗**；不安全则拒收或栅格化为 PNG（安全优先） |
| 四题 REQUIRED | 已出绘图要求（§8）；本阶段不上图 |
| 可否进入开发 | **可以**（须另授权 DIAGRAM-1B 迁移/实现） |

---

## 2. 现有协议缺口（只读证据）

| 层 | 现状 |
|----|------|
| DB `hs_math_train_items` | 无 diagram/image 列（见 `db/init.sql`） |
| Entity / Admin DTO | 无题干图字段 |
| Fingerprint | `fingerprintTrainItemContent` 含 stem/options/answer/analysis/KP/method/source，**不含图** |
| 学生抽题快照 | `hs_math_train_session_items` 拷贝 stem/options/answer/analysis/cv；**无图快照列** |
| 展示 | `MathStem` → `renderMathHtml`（KaTeX）；非公式 HTML **escape** |
| 私有图先例 | `hs_math_train_session_item_images` + `uploads/hs-math/application-answers/...`：鉴权读、禁静态直链、JPEG/PNG/WebP、≤10MB、≤5 张——**仅作答图** |

直接在 stem 塞 `<img>` / base64：**不可行**（会被转义；且绕过结构化协议）。

---

## 3. 插图内容协议

### 3.1 业务规则

| 规则 | 值 |
|------|-----|
| 范围 | 仅高一数学 `hs_math_train_items` 题干配图 |
| 每题张数 | **1～3**（`sort_order` = 1..3） |
| MIME | `image/png` · `image/webp` · `image/svg+xml` |
| 单张上限 | 建议 **2MB**（矢量可更小；栅格防滥用；可配置常量） |
| 真实验证 | 魔数/解析头校验，**不信任**客户端 `Content-Type` |
| 展示文案 | 可选 `alt_text`（短说明，不含答案） |
| 禁止 | stem 内嵌 base64；公开 `/uploads` 直链；未清洗 SVG 当 HTML 注入 |

### 3.2 SVG 安全（强制）

服务端流水线（上传时一次完成）：

1. 大小与 MIME/`<?xml`/`<svg` 结构校验。  
2. **XML 解析**（禁外部实体 / DTD）。  
3. **Allowlist 清洗**（或成熟消毒库）：  
   - 禁止：`<script>`、`foreignObject`、事件属性（`on*`）、`javascript:` / `data:` 危险 URL、外部 `xlink:href` / `href`、`<iframe>`、`<object>`、`<embed>`、动画脚本回调。  
   - 仅保留绘图相关元素（`path`/`line`/`polygon`/`text`/`g`/`defs` 中安全子集等）。  
4. 清洗失败 → **400 拒收**。  
5. **展示策略（推荐）**：  
   - **A（更安全）**：清洗后仍只作源文件；服务端 **栅格化为 PNG** 再入库为展示对象（或双存：`source_svg` + `display_png`）。  
   - **B**：清洗后 SVG 以 `Content-Type: image/svg+xml` + `Content-Security-Policy: sandbox` / `Content-Disposition` 经鉴权流式输出，前端用 `<img src=blob>` **禁止** `v-html` 内联 SVG。  

**默认建议 Phase-1：展示侧优先 PNG/WebP；SVG 仅作作者源，入库前栅格化。** 安全优先于格式便利。

### 3.3 存储与鉴权

| 项 | 设计 |
|----|------|
| 根目录 | `{cwd}/uploads/hs-math/item-diagrams/`（私有；**不**挂静态资源） |
| 对象键 | 内容寻址：`hs-math/item-diagrams/{sha256[0:2]}/{sha256}.bin` |
| 不可变 | 同 sha256 不覆盖；替换题图 = 新对象 + 改关联 |
| 读取 | 仅业务 GET：Admin（题库权限）或学生（本人 session 快照 / 或当前训练中的 approved 题） |
| 属主 | 对象表记 `uploaded_by`；关联表随 `item_id`；学生读校验 `session.user_id` |
| 删除 | **软解绑**当前题关联；对象在仍被 session 快照引用时 **禁止物理删** |

复用 application 图服务的「路径防穿越 / `.bin` / 鉴权流」模式，**新前缀、新表**，避免与作答图混库。

---

## 4. 数据库设计（方案 · 未执行）

> 表名均 `hs_math_*`。禁止 `synchronize=true`。须显式 `db/migrate_hs_math_item_diagrams.sql`（下阶段授权再跑）。

### 4.1 `hs_math_train_item_diagram_objects`（不可变二进制元数据）

| 列 | 类型 | 说明 |
|----|------|------|
| id | BIGINT PK | |
| content_sha256 | CHAR(64) UNIQUE | 规范化后字节哈希 |
| storage_key | VARCHAR(512) UNIQUE | 私有相对路径 |
| mime_type | VARCHAR(64) | png/webp/svg+xml |
| size_bytes | INT UNSIGNED | |
| width_px / height_px | INT NULL | 可选；SVG 可空 |
| sanitize_status | VARCHAR(16) | `passed` / `rasterized` 等 |
| uploaded_by | BIGINT NULL | users.id |
| created_at | DATETIME(3) | |

### 4.2 `hs_math_train_item_diagrams`（题目**当前**配图）

| 列 | 类型 | 说明 |
|----|------|------|
| id | BIGINT PK | |
| item_id | BIGINT FK → train_items | ON DELETE CASCADE |
| object_id | BIGINT FK → diagram_objects | |
| sort_order | TINYINT UNSIGNED | 1..3；UNIQUE(item_id, sort_order) |
| alt_text | VARCHAR(256) NULL | |
| created_at / updated_at | DATETIME(3) | |

### 4.3 `hs_math_train_session_item_diagrams`（开训快照）

| 列 | 类型 | 说明 |
|----|------|------|
| id | BIGINT PK | |
| session_item_id | BIGINT FK → session_items | ON DELETE CASCADE |
| object_id | BIGINT FK → diagram_objects | **永久引用不可变对象** |
| sort_order | TINYINT UNSIGNED | |
| alt_text | VARCHAR(256) NULL | 开训时拷贝 |
| content_sha256 | CHAR(64) | 冗余校验 |

`createSession` 时：按当前 `item_diagrams` 写入快照行。之后 Admin 换图 **不影响** 已存在 session。

### 4.4 迁移原则

- 仅 DDL；不改正文题。  
- 同步更新 `db/init.sql` 权威结构（实施阶段）。  
- 本预检 **不执行** 任何 SQL。

---

## 5. API 设计（草案）

### 5.1 Admin（Jwt + AdminGuard）

| 方法 | 路径 | 作用 |
|------|------|------|
| POST | `/hs-math/admin/train-items/:id/diagrams` | multipart 上传；校验 MIME/大小/清洗；写 object（若新）+ 关联；**触发内容变更升版** |
| PATCH | `/hs-math/admin/train-items/:id/diagrams/order` | 调整 1..3 顺序；升版 |
| DELETE | `/hs-math/admin/train-items/:id/diagrams/:linkId` | 解绑；升版；对象按引用保留 |
| GET | `/hs-math/admin/train-items/:id/diagrams` | 元数据列表（含 sha256、mime、sort） |
| GET | `/hs-math/admin/train-items/:id/diagrams/:linkId/content` | 鉴权流式预览 |

上传/排序/删除成功响应须带回新 `contentVersion` + `contentFingerprint`；若原 `approved` → **draft**（与现有 `bumpContentVersionOnMetaEdit` 同语义）。

### 5.2 学生（Jwt + 本人 session）

| 方法 | 路径 | 作用 |
|------|------|------|
| GET | `.../sessions/:sid/items/:siid/diagrams` | 快照列表 |
| GET | `.../sessions/:sid/items/:siid/diagrams/:objectId/content` | 校验 session 属主 + 快照含该 object → 流式 |

训练进行中展示用快照，**不**读「题目当前关联」（避免中途管理员改图导致卷面漂移）。

---

## 6. content_version / fingerprint / review / approve 门禁

### 6.1 内容变更定义

下列均视为 **题目内容变更**：

- 新增配图关联  
- 替换（解绑旧 object + 绑新 object）  
- 删除关联  
- 调整 `sort_order`

### 6.2 服务端必须

1. `content_version += 1`  
2. 若原 `status=approved` → `draft`，清 `reviewed_by/at`（复用现 bump 逻辑）  
3. 重算 fingerprint：在 `fingerprintTrainItemContent` / canonicalize **增加**  
   `diagramSha256List: string[]`（按 `sort_order` 的 object sha256 列表）  
4. 旧同版本 review → 面板 `stale`；`evaluateLatestReviewForPublish` 因指纹/版本不匹配 **禁止** 用旧 passed 批准  
5. 须新 `POST .../reviews` + `PATCH .../status` + `confirmPublish=true`

### 6.3 禁止

- 静默改图仍保持 approved  
- SQL 直改关联而不升版  
- 历史 session 改指向「当前最新图」

---

## 7. 前端展示方案

| 端 | 方案 |
|----|------|
| 公式 | **`MathStem` 保持不变** |
| 插图 | 新组件如 `HsMathItemDiagrams.vue`：题干公式**下方**按 `sort_order` 展示 |
| 学生 | 列表缩略 + 点击 Lightbox 放大；`object-fit: contain`；触控 pinch/双指（可用 CSS + 简单 viewer，勿引入重型库除非另授权） |
| Admin | 同组件预览 + 上传/删除/上下移排序；变更前提示「将升版并需重审」 |
| 加载 | `blob:` URL from 鉴权 GET；卸载 revoke；禁止把 SVG 当 `v-html` |

不破坏现有公式与 application 作答上传 UI。

---

## 8. 四道 REQUIRED 题绘图要求（方案 · 不上正式图）

### 8.1 CAND-G1B-093（正方体线面垂直）

| 项 | 要求 |
|----|------|
| 图形 | 标准正方体直观图，顶点 \(A,B,C,D,A_1,B_1,C_1,D_1\) 齐全 |
| 强调 | 标出线段 \(BD_1\)；平面 \(A_1C_1D\) 可用浅色半透明三角形或阴影 |
| 禁止 | 标注「⊥」、数量积计算步骤、辅助线证明过程、坐标数值答案 |
| 目的 | 帮助学生识别点与平面，**不**代替证明 |

### 8.2 CAND-G1B-080（平行四边形对角线）

| 项 | 要求 |
|----|------|
| 图形 | 平行四边形 \(ABCD\)，对角线 \(AC,BD\) 相交于 \(M\)（可不标「中点」字样，或仅标交点 \(M\)） |
| 标注 | \(\overrightarrow{AB}=\vec a\)，\(\overrightarrow{AD}=\vec b\)（与题干一致） |
| 禁止 | 写「互相平分」结论箭头、向量等式推导 |

### 8.3 CAND-G1B-064（塔高仰角）

| 项 | 要求 |
|----|------|
| 图形 | 铅直塔、水平距离、仰角 \(30^\circ\)、观测点；直角符号 |
| 标注 | 水平边 \(40\mathrm{m}\)、角 \(30^\circ\)；塔高边可用 \(h\)（未知） |
| 禁止 | 写出 \(h=\frac{40\sqrt{3}}{3}\) 或 \(\tan\) 计算结果 |

### 8.4 CAND-G1B-091（斜二测）

| 项 | 要求 |
|----|------|
| 图形 | 对照示意：左「原平面 \(xOy\) 直角」；右「直观图 \(x'O'y'\) 取 \(45^\circ\) 或 \(135^\circ\) 之一」 |
| 标注 | 角的度数与轴名清晰 |
| 禁止 | 直接圈出正确选项 A；不要把错误选项图画成「标准答案」唯一形态而不说明约定 |

四图均须：**数学准确、字母与题干一致、不引入题干没有的条件**。

---

## 9. 分阶段实施计划（待另授权）

| 阶段 | 内容 | 本预检 |
|------|------|--------|
| **1A** | 协议预检（本文） | **完成** |
| **1B** | SQL 迁移 + Entity + 存储/清洗服务 + Admin API | 未授权 |
| **1C** | Fingerprint/升版接入 + 学生 session 快照 + 读接口 | 未授权 |
| **1D** | 前端 `HsMathItemDiagrams` + Admin 上传排序 | 未授权 |
| **1E** | 四题制图 → 上传 → 升版 → 重审 → 重批 | 未授权 |
| **1F** | RECOMMENDED 20 题择优补图 | 可选 |

每阶段须独立确认；**不得**因本预检自动开迁。

---

## 10. 风险与缓解

| 风险 | 缓解 |
|------|------|
| SVG XSS | 清洗 + 禁 v-html + 优先栅格化 |
| 换图丢历史 | 不可变 object + session 快照；禁物理删仍被引用对象 |
| 指纹漏图 | 强制 `diagramSha256List` 入指纹；selftest 覆盖 |
| 误保持 approved | 复用 bump；集成测：改图后 canPublish=false |
| 体积膨胀 | 2MB 限 + 内容寻址去重 |
| 与作答图混淆 | 分表分目录分 API |

---

## 11. 最终状态

```
PREFLIGHT_COMPLETE
```

**停止。** 等待 DIAGRAM-1B（或制图）独立授权；不自动迁移/开发/补图。
