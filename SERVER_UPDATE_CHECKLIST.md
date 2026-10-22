# 服务器一次性更新清单（电子宠物 + 高一化学 + 前端）

> 本机执行 `pnpm pack:release` 后，拷贝整个 `release/study-system/` 到服务器即可。  
> 用 **MySQL Workbench** 做库表；用本目录替换程序与 nginx。

---

## 包内应有内容

```
release/study-system/
  web/                          ← 前端静态（含化学学习中心、学习分析、宠物相关页面）
  api/
    dist/                       ← 后端编译结果
    package.json
    .env.example                ← 不要覆盖服务器已有 .env
    start.sh
  db/
    migrate_pet_assistant.sql
    migrate_chemistry_*.sql     ← 化学结构（共 8 个）
    apply_pet_and_chemistry_on_server.bat
    chem_content_sync.sql       ← 化学知识库+题库+授权数据（约 900KB）
  deploy/
    nginx.conf.example          ← 参考（已含 chemistry、pet-assistant）
    nginx.conf                  ← 若本机有 nginx/nginx.conf 会一并带上
    docs/
    chemistry_advanced_model/models_catalog.json
    chemistry_deepseek_audit/publish_whitelist.json   ← 本地出题器必需
    chemistry_deepseek_audit/second_review/second_review_results.json
    paddleocr-windows.md（可选）
  services/ocr、ocr-formula（可选，本次可不启）
  DEPLOY.md
  VERSION.txt
  SERVER_UPDATE_CHECKLIST.md     ← 本说明（打包后请放入包内）
```

**不必拷：** 本机 `apps/` 源码、`node_modules`、本机 `.env`、整库 `init.sql`（会冲掉线上用户）。

---

## 服务器操作顺序

### A. 数据库（Workbench）

1. 连接服务器 `study_system`  
2. **按顺序** Open SQL Script → Execute：  
   1. `db/migrate_pet_assistant.sql`  
   2. `db/migrate_chemistry_phase1.sql`  
   3. `db/migrate_chemistry_phase2.sql`  
   4. `db/migrate_chemistry_train_phase1.sql`  
   5. `db/migrate_chemistry_train_answer_type.sql`  
   6. `db/migrate_chemistry_daily_review.sql`  
   7. `db/migrate_chemistry_advanced_session_kind_comment.sql`  
   8. `db/migrate_chemistry_wrong_question_phase1.sql`  
   9. `db/migrate_chemistry_wrong_question_phase2.sql`  
3. 再执行：`db/chem_content_sync.sql`（灌数据）  
4. 检查：

```sql
SELECT COUNT(*) FROM chem_train_items;   -- 约 634
SELECT COUNT(*) FROM chem_specialties; -- 12
SHOW TABLES LIKE '%pet%';
```

5. 给学生开试运行（按需）：

```sql
INSERT IGNORE INTO chem_train_test_grants (user_id, note, created_at)
SELECT id, 'server sync', NOW(3) FROM users WHERE email='dhm@189.cn';
```

### B. 程序文件

1. **停** API（任务管理器 / pm2 / 关掉 node 窗口）  
2. 备份服务器旧目录（如 `api`、`web` 或 `html/study-system`）  
3. 用本包覆盖：  
   - `api/dist` → 服务器 API 的 `dist`  
   - `api/package.json` → 同级（若依赖有变再 `pnpm i --prod`）  
   - **保留** 服务器原有 `api/.env`、`api/uploads`  
   - `web/*` → 覆盖前端静态目录（你当前是 `/study-system/`，一般对应 nginx `html/study-system/`）  
4. 把 `docs/chemistry_advanced_model/models_catalog.json` 放到服务器仓库相对位置，或保证 API 进程能读到该路径（变式训练用；没有也能跑，只是变式匹配会退化）  
5. **启动** API：`node dist/main.js` 或 pm2  

### C. Nginx（必改）

反代 location 里必须有 **`chemistry`** 和 **`pet-assistant`**，例如：

```nginx
location ~ ^/(auth|meta|health|subjects|tags|error-categories|assessment-types|error-questions|extension-materials|listening-materials|ai-reference|writing-coach|reviews|attachments|assessments|dashboard|settings|admin|feature-flags|study-prefs|points|knowledge-cards|pet-assistant|chemistry)(/|$) {
    proxy_pass http://127.0.0.1:3000;
    ...
}
```

对照包内 `deploy/nginx.conf` / `nginx.conf.example` 合并进服务器正在用的 `nginx.conf`，然后：

```bat
nginx -t
nginx -s reload
```

（Windows 下在 nginx 安装目录执行。）

### D. 验收

- 打开 `/study-system/` 能登录  
- 侧栏/首页有化学；`/chemistry`、`/chemistry/analytics` 正常  
- 电子宠物仍可用  
- 管理员「训练题目管理」能列出题目（约 634）  

---

## 一句话

**拷整个 `release/study-system/` → 先 Workbench 跑 9 个 migrate + chem_content_sync.sql → 覆盖 web + api/dist → nginx 加上 chemistry → 重启 API。**
