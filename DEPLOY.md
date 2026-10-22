# 学习系统 — 服务器部署说明

## 产物结构

```
release/study-system/
  web/                 # 前端静态文件（nginx / 任意静态服务器）
  api/
    dist/              # Nest 编译结果
    package.json
    .env.example
    start.sh
  services/
    ocr/               # 通用 OCR（9100，不含 .venv，服务器首次 pip install）
    ocr-formula/       # 公式/智能 OCR（9101）
  docs/
    paddleocr-windows.md
  db/                  # init.sql + 各 migrate_*.sql
  deploy/nginx.conf.example
  DEPLOY.md
```

## 服务器要求

- Node.js >= 18（建议 20 LTS）
- MySQL 8
- Nginx（推荐）或其它静态托管
- pnpm（`npm i -g pnpm`）用于安装 API 生产依赖
- 若用错题 OCR：Python 3.10+（Windows 见 `docs/paddleocr-windows.md`）

## 1. 数据库

```bash
mysql -u root -p < db/init.sql
# 若是从旧库升级，按顺序执行 db/migrate_*.sql（已执行过的跳过）
```

创建数据库用户、库名，与 `api/.env` 一致。

英文听力（Piper）见 [docs/piper-windows.md](./docs/piper-windows.md)；迁移脚本：`db/migrate_listening_materials.sql`。

结构教练迁移：`db/migrate_writing_coach.sql`。

学情心情 / 积分奖励 / 知识卡片（若旧库升级）：
`db/migrate_user_study_prefs.sql`、`db/migrate_user_points_rewards.sql`、`db/migrate_knowledge_cards.sql`。  
若曾部署过旧版「背诵卡」结构，再执行 `db/migrate_knowledge_cards_v2.sql`（公式定理库）。
电子宠物：`db/migrate_pet_assistant.sql`（`.env` 可设 `PET_CHAT_DAILY_LIMIT`）。
Nginx 反代需包含 `study-prefs`、`points`、`knowledge-cards`、`pet-assistant`。

## 2. 后端 API

```bash
cd api
cp .env.example .env
# 编辑 .env：DB_*、JWT_SECRET、PORT（默认 3000）
# OCR（可选）：
#   OCR_BASE_URL=http://127.0.0.1:9100
#   OCR_FORMULA_BASE_URL=http://127.0.0.1:9101
pnpm install --prod
mkdir -p uploads
node dist/main.js
# 或：chmod +x start.sh && ./start.sh
# 推荐用 pm2：
#   pm2 start dist/main.js --name study-api
```

注意：`uploads` 目录在 **api 进程工作目录** 下（与 `dist` 同级的 `uploads`）。

首次部署后，用 SQL 将某账号设为管理员（若迁移未做）：

```sql
UPDATE users SET role='ADMIN' WHERE email='你的邮箱';
```

## 2.1 OCR 旁路服务（可选，错题识别）

打包**不含** Python 虚拟环境与模型，需在服务器首次安装依赖后启动：

```bat
REM 通用 OCR 9100
cd services\ocr
start.bat

REM 另开窗口：公式/智能 9101
cd services\ocr-formula
start.bat
```

健康检查：`http://127.0.0.1:9100/health`、`http://127.0.0.1:9101/health`。  
详细说明：`docs/paddleocr-windows.md`。

## 3. 前端

### 方式 A：Nginx 同域反代（推荐）

打包时让前端走当前域名（空 base）：

```bash
# 在开发机
set VITE_API_BASE_URL=
pnpm pack:release
```

服务器上把 `web/` 放到 nginx root，引用 `deploy/nginx.conf.example`。  
浏览器访问 `http://服务器`，接口与页面同域，无跨域问题。

若挂在 `/study-system/`，打包前设置 `VITE_BASE=/study-system/`（见仓库 `apps/web/.env.production`）。

### 方式 B：API 单独端口

打包时写死 API 地址：

```bash
set VITE_API_BASE_URL=http://你的服务器IP:3000
pnpm pack:release
```

nginx 只托管 `web/`，并开放 3000 防火墙；需保证 CORS（当前 API 已 `origin: true`）。

改 API 地址后必须 **重新 `pnpm pack`**，因为地址会打进前端 JS。

## 4. 防火墙

- 80（或 443）：Web
- 若方式 B：再放行 3000
- OCR 仅监听 127.0.0.1，**不要**对公网开放 9100/9101

## 5. 验证

- `http://服务器/health` → `{"success":true,...}`（同域反代时）
- 或 `http://服务器:3000/health`
- 打开页面登录；设置 → 用户管理（管理员）

## 常见问题

| 现象 | 处理 |
|------|------|
| 前端接口 404 / 返回 HTML | 未按 nginx 示例反代 API，或 `VITE_API_BASE_URL` 错误 |
| 上传视频失败 | nginx `client_max_body_size`；API 上限 500MB |
| 登录后无「用户管理」 | 账号 `role` 不是 `ADMIN`，执行上面 UPDATE |
| bcrypt 安装失败 | 服务器装 build-essential / python3 后再 `pnpm i --prod` |
| OCR 失败 | 未启动 9100/9101，或 `api/.env` 未配置 OCR_*_URL |
