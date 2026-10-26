# 05 高一数学前端设计（审查修订版 · P0）

> 复用：Vue Router、AppLayout/SettingsLayout、Element Plus、Axios `http.ts`、KaTeX `render-math.ts`。  
> P0 **不**做每日/错题/学情/KB/出题器页面。

---

## 1. 菜单（P0）

**AppLayout**「学习工具」：

- 高一数学 → `/hs-math`

**SettingsLayout**（ADMIN）：

- 数学专项分类 → `/settings/hs-math-taxonomy`  
- 数学训练题 → `/settings/hs-math-train-items`  

---

## 2. 路由（P0）

| path | 权限 | 页面 |
|------|------|------|
| `hs-math` | auth | 首页 |
| `hs-math/:code` | auth | 专项目录 |
| `hs-math/:code/train` | auth | 训练设置 |
| `hs-math/train/session/:id` | auth | 训练中 |
| `hs-math/train/result/:id` | auth | 结果 |
| `hs-math/train/history` | auth | 历史 |
| `settings/hs-math-taxonomy` | admin | 分类管理 |
| `settings/hs-math-train-items` | admin | 题目管理 |

未登录：现有 `requiresAuth` → `/login`。  
非管理员进 settings 管理：现有 `requiresAdmin` 重定向。

---

## 3. 页面交互（P0）

| 场景 | 行为 |
|------|------|
| 进行中恢复 | 首页/设置页调 `GET sessions?status=in_progress` 或 last；进入 session |
| 保存答案 | 切题/失焦 PATCH；本地标记 dirty/saved |
| 提交 | 按钮 loading + disabled；防重复点击；以服务端幂等为准 |
| 网络失败 | ElMessage 错误；保留本地作答；可重试 submit |
| 结果 | 展示 correct/wrong/pending；pending 说明「待复核」 |
| 公式 | `MathStem` → `renderMathHtml`；`v-html` 仅来自服务端题干（已转义非公式段） |

**安全**：不依赖前端藏答案；信任 API 对 in_progress 脱敏。

---

## 4. 组件（P0）

```
MathStem.vue
MathOptionList.vue      # single/multi
MathJudgeInput.vue      # boolean
MathNumericInput.vue
MathGradeTag.vue
```

---

## 5. API 封装（P0）

- `api/hs-math.ts`：specialties/categories、home 摘要  
- `api/hs-math-train.ts`：sessions CRUD 动作  
- `api/hs-math-admin.ts`：taxonomy + train-items  

---

## 6. 部署相关前端

- 生产 `base` 多为 `/study-system/`：路由已相对 base，**SPA fallback 已有**。  
- 本地 dev `5173` 直连 API，不经 nginx 白名单。

---

*文档结束：05_math_frontend_design.md*
