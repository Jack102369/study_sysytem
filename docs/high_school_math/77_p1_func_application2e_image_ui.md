# P1-FUNC · APPLICATION-2E 应用题图片学生端 UI

> **执行时间**：2026-10-25  
> **范围**：前端上传 / 文图混合作答 / 鉴权 Blob 预览与结果展示  
> **迁移**：**NOT_EXECUTED**  
> **真实上传**：**否**  
> **真实 UI 点验**：**UI_NOT_RUN**  
> **APPLICATION-2E**：**PARTIAL**  
> **APPLICATION-2A/2B/2C/2D**：**PASS**  
> **APPLICATION-1**：**PARTIAL**  
> **CORE-1A-4B**：**BLOCKED**

---

## 1. 代码实现结果

| 能力 | 实现 |
|---|---|
| MathApplicationInput | 文字 + 多图上传/预览/进度/删除 |
| 手机拍照 | `capture="environment"` + 独立按钮 |
| 多图 | 最多 5；客户端 + 服务端双限 |
| 纯图 / 文图混合 | `buildApplicationUserAnswer` |
| JWT 读图 | `fetchHsMathSessionItemImageBlob` → ObjectURL |
| Blob 释放 | `onBeforeUnmount` / 换题 revoke |
| 上传中禁提交 | `uploading-change` → 禁用提交/保存 |
| completed 禁删 | `disabled` 隐藏删除；服务端仍校验 |
| 结果/历史 | `MathApplicationAnswerImages` + pending_ai 标签 |
| 旧四题型 | 会话页逻辑未改 |

API：`POST/GET/DELETE .../items/:sessionItemId/images`，multipart 字段 **`file`**。

---

## 2. 静态检查结果

| 命令 | 结果 |
|---|---|
| `pnpm --filter web run hs-math:application2e-selftest` | **PASS** |
| `pnpm --filter api run hs-math:application2d-selftest` | **PASS** |
| `pnpm --filter api run hs-math:application2c-selftest` | **PASS** |
| `pnpm --filter web exec vue-tsc --noEmit` | **PASS** |

---

## 3. 真实 API / UI 验收

| 项 | 状态 |
|---|---|
| 迁移执行 | **NOT_EXECUTED** |
| 真实 multipart 上传 | **未做** |
| 浏览器作答/提交/结果看图 | **UI_NOT_RUN** |
| 本轮写库 | **无** |

缺表时真实上传会失败 —— 须先授权 `migrate_hs_math_application2_images.sql`。

---

## 4. 修改文件

| 文件 | 动作 |
|---|---|
| `apps/web/src/api/hs-math-train.ts` | 类型 + 图片 API |
| `apps/web/src/utils/hs-math-auth-image.ts` | 新增 |
| `apps/web/src/components/hs-math/MathApplicationInput.vue` | 扩展 |
| `apps/web/src/components/hs-math/MathApplicationAnswerImages.vue` | 新增 |
| `apps/web/src/views/hs-math/HsMathTrainSessionView.vue` | 接线 |
| `apps/web/src/views/hs-math/HsMathTrainResultView.vue` | 展示 |
| `apps/web/src/utils/hs-math-format.ts` | 纯图文案 |
| `apps/web/scripts/hs-math-application2e.selftest.mjs` | 新增 |
| `apps/web/package.json` | script |

---

## 5. 下一步（2F / 联调）前置

1. **授权执行迁移**。  
2. 真实环境：上传 → 保存 → 提交 → 结果页鉴权看图。  
3. 不进 APPLICATION-3 / CORE-1B / 4B（除非另授）。

**本轮停止。**
