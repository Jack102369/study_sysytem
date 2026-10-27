# 服务器更新清单（高一数学）

> 本机执行：`$env:VITE_API_BASE_URL=""; pnpm pack:hs-math-sync`  
> 拷贝整个 `release/study-system/` 到服务器。  
> **不要**覆盖服务器已有 `api/.env`；**不要**整库执行 `init.sql`。

---

## 包内应有内容

```
release/study-system/
  web/                              ← 前端（含高一数学页面 + 库存统计等）
  api/
    dist/                           ← 后端编译结果（含 /hs-math/*）
    package.json
    .env.example                    ← 仅参考；保留服务器原 .env
    uploads/hs-math/                ← 题干配图文件（必拷）
    start.sh
  db/
    migrate_hs_math_*.sql           ← 结构（共 8 个）
    seed_hs_math_*.sql              ← 可选种子（content_sync 已含正式数据时可跳过）
    hs_math_content_sync.sql        ← 分类/KP/方法/题库/审题/配图元数据
  deploy/
    nginx.conf                      ← 本机 nginx/nginx.conf（已含 hs-math）
    nginx.conf.example
  SERVER_UPDATE_CHECKLIST_HS_MATH.md
  VERSION.txt
  DEPLOY.md
```

**本包 content SQL 不含：** 学生学习会话、答题上传图、`hs_math_deepseek_daily` 运行时计数。

---

## 服务器操作顺序

### A. 数据库（Workbench）

1. 连接服务器 `study_system`
2. **若服务器尚未建过高一数学表**，按顺序执行（已执行过的可跳过）：  
   1. `db/migrate_hs_math_p0.sql`  
   2. `db/migrate_hs_math_p1_0.sql`  
   3. `db/migrate_hs_math_p1_0fc3b.sql`  
   4. `db/migrate_hs_math_p1_func_core1a.sql`  
   5. `db/migrate_hs_math_application2_images.sql`  
   6. `db/migrate_hs_math_item_diagrams.sql`  
   7. `db/migrate_hs_math_application3_ai_grading.sql`  
   8. `db/migrate_hs_math_deepseek_daily_quota.sql`  
3. 再执行：`db/hs_math_content_sync.sql`（灌题库；含 DROP+CREATE 内容表）  
4. 检查：

```sql
SELECT COUNT(*) AS drawable FROM hs_math_train_items
 WHERE pool='formal' AND status='approved' AND is_active=1;
-- 期望约 813

SELECT difficulty, COUNT(*) n FROM hs_math_train_items
 WHERE pool='formal' AND status='approved' AND is_active=1
 GROUP BY difficulty;

SELECT COUNT(*) FROM hs_math_train_item_diagram_objects;
SELECT COUNT(*) FROM hs_math_specialties;  -- 10
```

> 若服务器上**已有学生数学训练记录**，执行 content_sync 前请先备份  
> `hs_math_train_sessions` / `hs_math_train_session_items`；  
> content 表 ID 可能变化，旧会话关联可能失效。

### B. 程序与配图

1. **停** API  
2. 备份服务器旧 `api/dist`、`web`（或 `html/study-system`）  
3. 覆盖：  
   - `api/dist` → 服务器 API `dist`  
   - `api/package.json`（依赖有变再 `pnpm i --prod`）  
   - **保留** `api/.env`  
   - 合并拷贝 `api/uploads/hs-math/` → 服务器同路径（勿删其它学科 uploads）  
   - `web/*` → 前端静态目录（`/study-system/`）  
4. 启动 API：`node dist/main.js` 或 pm2  

可选 `.env`（应用题 AI 批改）：见 `api/.env.example` 中 `HS_MATH_*` / `DEEPSEEK_*`。

### C. Nginx（必改）

反代白名单必须含 **`hs-math`**，例如：

```nginx
location ~ ^/(auth|meta|health|subjects|tags|error-categories|assessment-types|error-questions|extension-materials|listening-materials|ai-reference|writing-coach|reviews|attachments|assessments|dashboard|settings|admin|feature-flags|study-prefs|points|knowledge-cards|pet-assistant|chemistry|hs-math)(/|$) {
    proxy_pass http://127.0.0.1:3000;
    ...
}
```

合并包内 `deploy/nginx.conf` 后：

```bat
nginx -t
nginx -s reload
```

### D. 验收

- `/study-system/` 登录正常  
- 侧栏「高一数学」可进；专项训练可抽题  
- 管理端：设置 → 高一数学 → 题库库存统计，drawable ≈ 813  
- 带图应用题题干图可显示（`uploads/hs-math/item-diagrams`）  
- `GET /hs-math/admin/train-items/inventory-stats`（ADMIN）返回 200  

---

## 一句话

**pack:hs-math-sync → 拷 release → migrate（如需）+ hs_math_content_sync.sql → 覆盖 web/api/dist + uploads/hs-math → nginx 加 hs-math → 重启 API。**
