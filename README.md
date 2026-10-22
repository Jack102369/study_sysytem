# 学习系统

Vue3 + NestJS monorepo（pnpm workspace）。

## 快速开始

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
# 填写 DB_* 与 JWT_SECRET
pnpm install
pnpm dev
```

- Web：http://localhost:5173
- API：http://localhost:3000/health
- 接口示例：`docs/api.http`

## 功能模块

| 模块 | 路径 |
|------|------|
| 仪表盘 | `/` |
| 错题 | `/errors` |
| 今日复习 | `/reviews` |
| 错题统计 | `/errors/stats` |
| 成绩 | `/assessments` |
| 趋势/洞察 | `/assessments/trends` |
| 基础配置 | `/settings/*` |

注册用户会自动写入内置标签与考试类型；老用户可在设置页点「初始化内置标签/考试类型」。

## 生产打包

```bash
# 同域 nginx 反代（推荐）
# PowerShell:
$env:VITE_API_BASE_URL=""
pnpm pack:release

# 或 API 单独端口：
$env:VITE_API_BASE_URL="http://你的服务器IP:3000"
pnpm pack:release
```

产物在 `release/study-system/`，部署步骤见 [DEPLOY.md](./DEPLOY.md)。
