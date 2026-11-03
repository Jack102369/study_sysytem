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
    uploads/hs-math/item-diagrams/  ← 题干配图（要合并拷贝）
    （不要用包覆盖 application-answers＝学生答题图）
    start.sh
  db/
    migrate_hs_math_*.sql           ← 结构（含 session category 可空等）
    seed_hs_math_*.sql              ← 可选种子（content_sync 已含正式数据时可跳过）
    hs_math_content_sync.sql        ← 分类/KP/方法/题库/审题/配图元数据（含 d1/d2/HARD14/真H3）
  deploy/
    nginx.conf                      ← 本机 nginx/nginx.conf（已含 hs-math）
    nginx.conf.example
  docs/high_school_math/SERVER_DEPLOYMENT_REGISTRY.md
  PACK_README_HS_MATH.txt
  SERVER_UPDATE_CHECKLIST_HS_MATH.md
  VERSION.txt
  DEPLOY.md
```

**本包 content SQL 不含：** 学生学习会话、答题上传图、`hs_math_deepseek_daily` 运行时计数。

---

## 服务器操作顺序

### A0. 数据库两步 · 白话（先读）

服务器上的高一数学数据可以想成两柜子：

| 柜子 | 里面是什么 | 本包怎么处理 |
|------|------------|--------------|
| **题库柜** | 章节、分类、题目、知识点、配图元数据 | 用 `hs_math_content_sync.sql` **整柜换成你本地最新题库**（含 d1/d2/HARD14/真 H3） |
| **学生练习柜** | 谁练过、答了什么、当时的解析快照 | **本包不动**；上线前你自己备份即可 |

对应两个 SQL 文件：

1. **`migrate_hs_math_session_category_nullable.sql`（改门锁，不是换柜子）**  
   - 作用：让「训练会话」可以不选小节、整章抽题（某一列允许空）。  
   - **不删题目、不删练习记录。**  
   - **怎么判断要不要跑：** 在服务器 MySQL 执行下面一句：

```sql
SHOW COLUMNS FROM hs_math_train_sessions LIKE 'category_id';
```

   - 看结果里的 **Null** 列：  
     - `YES` → **不用跑**这个 migrate（已经支持整章）。  
     - `NO` → **要跑**这个文件一次。  
   - Workbench：打开该 `.sql` → 选中库 `study_system` → 执行。

2. **`hs_math_content_sync.sql`（换题库柜里的货）**  
   - 作用：把本地导出的题库内容灌进服务器（会先删再建**内容表**再插入）。  
   - **不含**学生会话表；练习历史表不会被这个文件 DROP。  
   - 注意：题目自增 id 可能变；旧练习仍主要靠会话里保存的题干/答案/解析快照回看。  
   - **执行前必须备份**（至少备份会话两张表，或整库备份）。  
   - Workbench：打开该文件 → 确认当前库是 `study_system` → 执行（文件较大，等跑完）。

**推荐顺序：** 先备份 →（需要时）跑 nullable 迁移 → 再跑 content_sync → 用下面检查 SQL 核对题量与会话行数没少。

若服务器**从来没有**过高一数学表：先按 A 第 2 步把 `migrate_hs_math_*.sql` 建表跑完，再做上面两步。若服务器早就有数学模块，一般**不用**重跑第 2 步那串旧迁移，只关心 nullable + content_sync。

---

### A0b. 若服务器「已有高一数学 + 已有答题记录」（你的情况）

适用：服务器以前就能练数学，只是**当时没有真 H3**，且本地后来**改过部分题的难度等级**，现在要对齐。

**你要做的只有这些（不要重跑整串旧 migrate_p0…）：**

| 步骤 | 做不做 | 说明 |
|------|--------|------|
| 备份 | **必做** | 至少备份 `hs_math_train_sessions`、`hs_math_train_session_items`（建议整库备份） |
| `migrate_hs_math_p0`～配额那一串 | **跳过** | 表早就有了 |
| `migrate_hs_math_session_category_nullable.sql` | **按需** | 用 `SHOW COLUMNS … category_id`：Null=NO 才跑；YES 就跳过 |
| `hs_math_content_sync.sql` | **要跑** | 用本地最新题库覆盖服务器「题库柜」：补上真 H3，并把题目难度改成与本地一致 |
| 学生会话表 | **不要手动清空** | content_sync 本身不含这两张表 |

**跑 content_sync 之后会发生什么（重要）：**

- 服务器题库变成与本地一致：有真 H3，难度等级按本地更新。  
- **学生练习历史还在**（会话表没被这个文件删除）。  
- 历史里当时保存的**题干 / 作答 / 解析快照**一般仍能打开回看。  
- 题目表会重建，题目数字 id 可能变；旧记录上的「关联到哪道现题」可能对不上，但不影响看当时快照。  
- 部署新前端/后端后，才能在训练里看到「真 H3」这一档并抽到 `CAND-H3*`。

**不要做的：**

- 不要对服务器执行整份 `init.sql` 覆盖库。  
- 不要 DELETE/TRUNCATE 会话表「清场再导」。  
- 不要指望只拷代码、不跑 content_sync —— 那样服务器仍然没有真 H3，难度也不会更新。

---

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
3. **整章开训**：若 `SHOW COLUMNS FROM hs_math_train_sessions LIKE 'category_id'` 显示 `Null=NO`，执行  
   `db/migrate_hs_math_session_category_nullable.sql`（只改结构，不删会话）  
4. 再执行：`db/hs_math_content_sync.sql`（灌题库；含 DROP+CREATE **内容表**）  
5. 检查：

```sql
SELECT COUNT(*) AS drawable FROM hs_math_train_items
 WHERE pool='formal' AND status='approved' AND is_active=1;
-- 期望约 926（以 VERSION / 本地为准）

SELECT difficulty, COUNT(*) n FROM hs_math_train_items
 WHERE pool='formal' AND status='approved' AND is_active=1
 GROUP BY difficulty;
-- 参考：d1≈335 / d2≈478 / d3≈113

SELECT COUNT(*) AS true_h3 FROM hs_math_train_items
 WHERE code LIKE 'CAND-H3%' AND status='approved' AND is_active=1;
-- 期望约 13

SELECT COUNT(*) FROM hs_math_train_item_diagram_objects;
SELECT COUNT(*) FROM hs_math_specialties;  -- 10

-- 历史应仍在：
SELECT COUNT(*) FROM hs_math_train_sessions;
SELECT COUNT(*) FROM hs_math_train_session_items;
```

> 若服务器上**已有学生数学训练记录**，执行 content_sync 前请先备份  
> `hs_math_train_sessions` / `hs_math_train_session_items`；  
> content 表 ID 可能变化，旧会话 `item_id` 可能变 NULL，但**快照中的题干/答案/解析仍在**。

### B0. uploads 怎么处理（保留服务器答题历史）

包里的 `api/uploads/hs-math/` 下可能有两类目录：

| 目录 | 是什么 | 怎么做 |
|------|--------|--------|
| `item-diagrams/` | 题目自带的题干配图 | **合并拷贝到服务器**（缺图才补；可覆盖同名哈希文件） |
| `application-answers/` | **本地**学生/测试答题上传图 | **不要拷到服务器**；服务器原有目录原样保留 |

操作口诀：

- ❌ 不要把整个 `uploads` 或整个 `hs-math` 文件夹覆盖粘贴到服务器  
- ✅ 只把包里的 `item-diagrams` **合并进**服务器已有的  
  `（API工作目录）/uploads/hs-math/item-diagrams/`  
- ✅ 服务器上的 `uploads/hs-math/application-answers/` **碰都不要碰**  
- ✅ 数据库会话表也不要清空（答题文字/解析在库里，答题图在 application-answers）

Windows 示例（在服务器上，路径按你实际 API 目录改）：

```bat
xcopy /E /I /Y "D:\incoming\study-system\api\uploads\hs-math\item-diagrams\*" "D:\study-system\api\uploads\hs-math\item-diagrams\"
```

Linux 示例：

```bash
rsync -av release/study-system/api/uploads/hs-math/item-diagrams/ /path/to/api/uploads/hs-math/item-diagrams/
# 不要带 application-answers
```

> 你手头若是旧 ZIP（仍含 `application-answers`）：上传时**手动忽略该目录**即可，效果相同。

### B. 程序与配图

1. **停** API  
2. 备份服务器旧 `api/dist`、`web`（或 `html/study-system`）  
3. 覆盖： 
   - `api/dist` → 服务器 API `dist`  
   - `api/package.json`（依赖有变再 `pnpm i --prod`）  
   - **保留** `api/.env`  
   - **仅合并** `api/uploads/hs-math/item-diagrams/` → 服务器同路径  
     - **禁止**整夹覆盖 `uploads/` 或 `uploads/hs-math/`  
     - **禁止**拷贝/覆盖服务器上的 `uploads/hs-math/application-answers/`（那是学生答题图/历史）  
     - 其它学科 uploads 一律不动 
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
- 管理端：设置 → 高一数学 → 题库库存统计，drawable ≈ **926**  
- 训练难度有「真 H3」；有题的章节可抽到 `CAND-H3*`  
- 旧训练记录仍能打开（题干/作答/解析快照）  
- 带图应用题题干图可显示（`uploads/hs-math/item-diagrams`）  
- `GET /hs-math/admin/train-items/inventory-stats`（ADMIN）返回 200  

---

## Workbench 8.0：备份 + 同步（逐步点哪里）

> 适用于：服务器已有高一数学和答题记录。在 **连到服务器** 的那条连接上操作。

### 一、备份（同步前必做）

**方式 A（推荐，整库备份）**

1. 打开 MySQL Workbench → 点左侧你的**服务器连接**（连上 `study_system` 所在实例）。  
2. 菜单 **Server → Data Export**。  
3. 左侧勾选数据库 **`study_system`**（名字以你服务器为准）。  
4. 右侧建议选 **Dump Structure and Data**（结构+数据）。  
5. 勾选 **Export to Self-Contained File**，选一个安全路径，例如：  
   `D:\backups\study_system_before_hs_math_sync_20261029.sql`  
6. 建议勾上 **Include Create Schema**（若有该选项）。  
7. 点右下角 **Start Export**，等进度条跑完、显示成功。  
8. 确认该 `.sql` 文件体积不是 0；记下路径，出问题用它恢复。

**方式 B（只备份练习历史两张表，更快但不如整库稳）**

1. 同样 **Server → Data Export**。  
2. 展开 `study_system`，**只勾**：  
   - `hs_math_train_sessions`  
   - `hs_math_train_session_items`  
   （有答题图的话再勾 `hs_math_train_session_item_images`、`hs_math_train_session_item_diagrams`）  
3. 导出到单独文件，例如 `hs_math_sessions_backup_20261029.sql`。  
4. **仍建议有空再做一次方式 A 整库备份。**

**恢复（仅出事时用）**

1. **Server → Data Import**。  
2. 选 **Import from Self-Contained File**，选中备份的 `.sql`。  
3. Default Target Schema 选 `study_system`（若备份含建库语句则按提示）。  
4. **Start Import**。  
   注意：恢复会覆盖当前数据，确认后再点。

---

### 二、同步题库前：看要不要跑「整章开训」小迁移

1. 顶部工具栏点 **SQL 编辑器图标**（或菜单 File → New Query Tab），确认左上角 schema 是 **`study_system`**（可双击左侧 SCHEMAS 里的库名）。  
2. 粘贴执行：

```sql
SHOW COLUMNS FROM hs_math_train_sessions LIKE 'category_id';
```

3. 看结果里 **Null** 这一列：  
   - **YES** → 跳过下一步迁移。  
   - **NO** → 继续「三」。

---

### 三、（仅 Null=NO 时）执行 nullable 迁移

1. 菜单 **File → Open SQL Script…**  
2. 打开发布包里的：  
   `…\release\study-system\db\migrate_hs_math_session_category_nullable.sql`  
3. 确认当前库仍是 `study_system`。  
4. 点闪电图标 **Execute**（整份脚本执行）。  
5. 再跑一次上面的 `SHOW COLUMNS…`，确认 **Null=YES**。

---

### 四、同步题库：执行 `hs_math_content_sync.sql`

1. **确认备份已完成。**  
2. **File → Open SQL Script…**  
3. 打开：  
   `…\release\study-system\db\hs_math_content_sync.sql`  
   （约 1MB+，打开可能稍慢。）  
4. 左上角 / 左侧确认默认 schema = **`study_system`**。  
5. 点 **Execute** 执行整份脚本；等待完成（可能几十秒到几分钟）。  
6. 底部 Output 无红色报错即大致成功。

> 此文件会重建**题库内容表**（含难度更新 + 真 H3），**不会**DROP 学生会话表。

---

### 五、执行后立刻核对（同一查询窗口）

```sql
-- 可训练题量（期望约 926）
SELECT COUNT(*) AS drawable FROM hs_math_train_items
 WHERE pool='formal' AND status='approved' AND is_active=1;

SELECT difficulty, COUNT(*) n FROM hs_math_train_items
 WHERE pool='formal' AND status='approved' AND is_active=1
 GROUP BY difficulty;

-- 真 H3（期望约 13）
SELECT COUNT(*) AS true_h3 FROM hs_math_train_items
 WHERE code LIKE 'CAND-H3%' AND status='approved' AND is_active=1;

-- 历史还在（行数不应比备份前变少）
SELECT COUNT(*) AS sessions FROM hs_math_train_sessions;
SELECT COUNT(*) AS session_items FROM hs_math_train_session_items;
```

把这些数字记到 `SERVER_DEPLOYMENT_REGISTRY.md` 的「服务器当前状态」。

然后再去覆盖 **web / api/dist / uploads/hs-math** 并重载 nginx、重启 API（见上文 B/C）。

---

## 一句话

**Workbench 整库备份 →（按需）nullable → content_sync → 核对题量/会话 → 再覆盖 web/api/nginx。**
