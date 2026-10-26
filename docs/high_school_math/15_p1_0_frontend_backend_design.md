# 15 P1-0 前后端设计

> 复用：JwtAuthGuard / AdminGuard、Axios `http.ts`、AppLayout / SettingsLayout、KaTeX。  
> 不改公共 JWT；不改化学。

---

## 1. API 增量（建议前缀）

### 学生（JwtAuthGuard）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/hs-math/specialties` | 已有；可附带 sectionCount |
| GET | `/hs-math/specialties/:code` | 已有；categories 将含真实小节 |
| GET | `/hs-math/categories/:id/knowledge-points` | 小节下 KP 列表 |
| GET | `/hs-math/knowledge-points/:code` | KP 详情（summary） |
| POST | `/hs-math/train/sessions` | **保持** specialtyId+categoryId+difficulty+count+mode；抽题仍 formal+approved |

可选后续：`knowledgePointId` 抽题过滤器——**P1-0F 后**再开，避免一次改死 P0 契约。

### 管理（AdminGuard）

| 方法 | 路径 |
|------|------|
| CRUD | `/hs-math/admin/categories`（已有，种子小节后主要用于启停排序） |
| GET/POST/PATCH | `/hs-math/admin/knowledge-points` |
| PUT | `/hs-math/admin/train-items/:id/knowledge-points` |
| 既有 | `/hs-math/admin/train-items` + `.../status` |
| POST | `/hs-math/admin/train-items/import/preview` |
| POST | `/hs-math/admin/train-items/import/commit` → 仅 draft |

批准时增加测试前缀拒绝。

---

## 2. Service 要点

- `HsMathTaxonomyService`：小节列表来自 categories。  
- `HsMathKnowledgeService`：KP CRUD + 校验 specialty/category 一致。  
- `HsMathAdminTrainItemsService`：写题时维护 `train_item_kps`；同步 primary → `knowledge_point_id`。  
- `HsMathTrainService.createSession`：选中题后写入 `knowledge_point_codes_json` 快照；**判题逻辑零改动**。  
- 学情：P1-0 **不改** accuracy 公式；KP 维度统计可后置。

---

## 3. DTO

- 沿用 class-validator。  
- KP：code/name/specialtyId/categoryId/summary/sortOrder/isActive。  
- 关联：`knowledgePointIds: string[]` + `primaryKnowledgePointId?`。  
- 创建会话 DTO **不强制** KP（兼容 P0 前端）。

---

## 4. 管理员前端（Settings）

复用：

- `HsMathTaxonomyAdminView`：展示小节（种子后）+ 启停。  
- `HsMathTrainItemsAdminView`：增加 KP 多选、主 KP、来源标记、导入入口。

新增：

- `HsMathKnowledgeAdminView`：`/settings/hs-math-knowledge`  
  按章/小节筛选 KP，编辑 summary，启停。

审核流不变：编辑 → draft；`PATCH status`。

---

## 5. 学生前端

保留：

- `/hs-math` 首页、specialties、`:code`、train、session、result、history、analytics。

增量：

- 章节页：分类改为「小节列表」+「综合练习」。  
- 可选：`/hs-math/kp/:code` 知识点短文（summary）。  
- 训练配置：仍选小节（category）；无题空状态诚实提示。  
- **不**展示掌握度；**不**展示测试题；**不**伪造题量（无 available API 则仅创建失败提示，或后续加 count 接口）。

公式：继续 MathStem / render-math。

---

## 6. 权限

| 角色 | 能力 |
|------|------|
| USER | 读 taxonomy/KP/训练 |
| ADMIN | KP 与题库写、导入、审核 |
| 未登录 | 401 |

前端菜单隐藏 ≠ 后端鉴权。

---

## 7. 数据流（训练）

```
选章/小节 → POST sessions(specialtyId, categoryId, …)
  → 抽 approved formal 题
  → 快照 stem/options/answer + KP codes
  → PATCH answers / POST submit（grade v1）
```

管理员改 KP 后：**旧会话快照不变**。

---

## 8. 与化学对照（只借鉴）

| 化学 | 数学 P1-0 |
|------|-----------|
| 多类型 KB 实体 | 单 KP + summary，避免八表 |
| 出题器/AI | **不做** DeepSeek 正式题 |
| 试运行池 | 保留 pool=test，P1-0 正式只用 formal |

---

*文档结束：15_p1_0_frontend_backend_design.md*
