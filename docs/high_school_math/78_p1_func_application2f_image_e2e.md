# P1-FUNC · APPLICATION-2F 应用题图片迁移与 E2E

> **执行时间**：2026-10-25  
> **测试账号**：ADMIN `user_id=2` / `admin@189.cn`（本地签发短时 JWT；报告不收录 token）  
> **目标题**：`HSMA-RJA-CH03-APP-0001` / `item_id=151`（只读确认）  
> **迁移**：此前已 **PASS**（本轮未重复执行）

---

## 判定总表

| 项 | 状态 | 说明 |
|---|---|---|
| A. migration | **PASS** | 表已存在；本轮未再执行 SQL |
| B. 图片上传 | **PASS** | JPEG/PNG/WebP；列表/排序 |
| C. 图片安全 | **PASS** | 非法 MIME/魔数/10MB/超 5 张拒绝 |
| D. 图片归属 | **PASS** | 跨用户 404；未登录 401 |
| E. 纯图片提交 | **PASS** | session **55**；pending_ai |
| F. 文图混合提交 | **PASS** | session **56**；text+imageIds |
| G. 图片锁定 | **PASS** | draft→submitted；删 submitted→409 |
| H. 历史鉴权读取 | **PASS** | 仅引用图；无 storage_key；二进制一致 |
| I. pending_ai | **PASS** | correct/wrong 不增；accuracy 不含 pending |
| J. 学生 UI | **UI_NOT_RUN** | Web 已起，无真实浏览器点验证据 |

**API/DB 图片闭环**：**PASS**（47/47 检查）  
**UI E2E**：**UI_NOT_RUN**  
**APPLICATION-2F**：**PARTIAL**（API/DB PASS ≠ 完整 E2E PASS）

---

## 1. 服务启动

| 服务 | 结果 |
|---|---|
| 旧 API | 已按授权停止（本仓库 `apps/api/dist/main`） |
| 新 API | `pnpm --filter api start`；监听 **3000**；含 `/images` 路由 |
| 健康检查 | `GET /health` → db ok |
| Web | Vite：**5174**（5173 已被本仓库另一 vite 占用）；`http://localhost:5174/` → 200 |
| 本轮 API 监听 PID（验收时） | **16828**（`node …/apps/api/dist/main`） |

另修：**`TransformInterceptor` 透传 `StreamableFile`**（否则图片 GET 被包成 JSON，二进制损坏）。已 rebuild 并重启加载。

---

## 2. 测试会话

| 会话 | 用途 |
|---|---|
| `session_id=55` / `session_item_id=261` | 纯图片作答 + 安全负例 |
| `session_id=56` | 文字+图片混合 |

题目：item **151**，application，approved，formal，difficulty=2，category **3.4**。

---

## 3. 上传与安全

| 检查 | 结果 |
|---|---|
| JPEG / PNG / WebP 上传 | **PASS**（201） |
| 列表 + sortOrder | **PASS** |
| 响应无 storage_key | **PASS** |
| 非法 MIME | **400** |
| 非法魔数 | **400** |
| >10MB | **413** |
| 第 6 张 | **400** |
| draft 删除 | **200** |
| 跨用户 list/read | **404** |
| 未登录读图 | **401** |

磁盘：`apps/api/uploads/hs-math/application-answers/{userId}/*.bin`（私有前缀；非公开直链）。

---

## 4. 提交与锁定

### 纯图片（session 55）

- 答案：`{ kind:'application', imageIds:[7,8] }`  
- submit → `grade_result=pending_ai`；`pending_count=1`；`correct=0` `wrong=0`；`accuracyPercent=null`  
- DB：引用图 **submitted**；未引用 draft 仍 **draft**  
- 历史 `images` 仅 2 张引用图；无 orphan  
- 删 submitted → **409**；再改答案 → **409**；重复 submit → `idempotent:true`

### 混合（session 56）

- `{ kind:'application', text:'混合作答步骤', imageIds:['12'] }`  
- pending_ai；text 保留；`images.length=1`

---

## 5. 鉴权读图

| 检查 | 结果 |
|---|---|
| 属主 GET 二进制 | **PASS**（len=450 = 上传 sizeBytes） |
| JPEG SOI `FF D8` | **PASS** |
| Content-Type | `image/jpeg`（无错误 charset 包体） |
| Cache-Control | `private, no-store` |

---

## 6. 数据保护（迁移后 / 验收后）

| 项 | 值 |
|---|---|
| 题量 | **111** |
| approved | **13** |
| methods / links | **11** / **18** |
| reviews | **13** |
| 其他用户 sessions | **37**（未变） |
| user_id=2 新增会话 | 本轮 55、56 等 |
| 图片行 | 10（draft 4 / submitted 6） |
| APP-0001 | 未改 |

---

## 7. UI

Web 进程可达（5174）。**未**进行人工浏览器点验 → **UI_NOT_RUN**。  
启动 Web ≠ UI PASS。

---

## 8. 代码变更（本轮验收中修复）

| 文件 | 说明 |
|---|---|
| `apps/api/src/common/interceptors/transform.interceptor.ts` | `StreamableFile` / `Buffer` 不包 `{success,data}` |

临时脚本：`apps/api/src/hs-math/util/_tmp-application2f-e2e.mjs`（验收用；可后续删除）。  
结果快照：`docs/high_school_math/_2f_run_result.json`。

---

## 9. 未通过 / 未做

- 学生 UI 浏览器点验  
- 未进入 APPLICATION-3 / AI  

---

## 10. 阶段标记

| 项 | 状态 |
|---|---|
| **APPLICATION-2F** | **PARTIAL**（API/DB PASS；UI_NOT_RUN） |
| APPLICATION-2A～2D | **PASS** |
| APPLICATION-2E | **PARTIAL** |
| APPLICATION-1 | **PARTIAL** |
| APPLICATION-2 整体 | **未标完整 PASS** |
| APPLICATION-3 | **NOT_STARTED** |
| CORE-1A-4B | **BLOCKED** |

**本轮停止。**
