# P0-03 集成契约与接口规划

> 遵循现有约定：无全局 `/api` 前缀；成功 `{ success:true, data }`；失败 `{ success:false, message }`；JWT Bearer；管理端 `AdminGuard`。  
> Controllers 建议前缀：`math/...`、`math/admin/...`。

---

## 1. 模块接口边界

| 模块 | 对外提供 | 禁止泄漏 |
|------|----------|----------|
| math-protocol | 类型、`parseMasp()`/`assertMasp()`、动作枚举、版本 | 业务 DB |
| math-core | `solve(model, params)`、`grade(answer, expected)`、`reviewSchedule(...)`、`masteryReduce(...)` | HTTP、ORM |
| api/math | REST、事务、权限、任务编排 | 在 Controller 内写求解细节 |
| web | UI、播放器 | 信任客户端 userId / 最终答案 |
| math-renderer | 消费已校验 MASP + 配音清单 → mp4 | 自行改数学答案 |

---

## 2. 共享包职责与构建

### 2.1 `@study/math-protocol`

- `src/masp/types.ts`、`schema.ts`、`actions/registry.ts`、`version.ts`
- 构建：`tsc` 出 `dist/`；`exports` 指向 dist
- Web：Vite 解析 workspace；API：TS path 或 Node resolution

### 2.2 `@study/math-core`

- `src/models/transfer-equalize.ts`、`solver/index.ts`、`grade/`、`review/`、`mastery/`
- 仅依赖 protocol
- 单测：`vitest` 或 `node:test`（选型 P1 确认）

### 2.3 Workspace / 发布（契约级要求）

实施前必须完成架构文档 C1–C3：

1. `pnpm-workspace.yaml` 包含 `packages/*`
2. `apps/api`、`apps/web`、`apps/math-renderer` 的 `dependencies` 写 `"@study/math-protocol": "workspace:*"` 等
3. `pack-release.mjs`：**要么**构建期打进 api/web bundle，**要么**显式拷贝 packages 并安装；**现状不会自动支持**

根 `package.json` 建议增加：`dev:math-renderer`、`build:math-packages`（实施时再加）。

---

## 3. 学生端 API 规划

均需 `JwtAuthGuard`；`userId = CurrentUser.sub`。

| 能力 | 方法 / 路径（建议） | 说明 |
|------|---------------------|------|
| 首页 | `GET math/home` | 今日复习数、继续训练、掌握摘要 |
| 专题列表 | `GET math/topics` | 按年级 |
| 知识点 | `GET math/knowledge-points`、`GET math/knowledge-points/:id` | 仅 published |
| 题目预览 | `GET math/questions/:id` | 不含完整可作弊答案细节或按产品脱敏 |
| 开始训练 | `POST math/train/sessions` | body: topic/grade/count；返回 session+items（无答案） |
| 恢复 | `GET math/train/sessions/current` | in_progress |
| 会话详情 | `GET math/train/sessions/:id` | 属主校验 |
| 提交尝试 | `POST math/train/sessions/:id/items/:itemId/attempts` | 追加 attempt；幂等键可选 |
| 请求提示 | `POST .../items/:itemId/hints` | 写 learning_event；返回 hint |
| 播放动画 | `POST .../items/:itemId/animation` | 返回 masp；记 event |
| 生成变式 | `POST .../items/:itemId/variations` | 新 item 挂 source |
| 结束训练 | `POST math/train/sessions/:id/complete` | 幂等 |
| 取消 | `POST math/train/sessions/:id/cancel` | |
| 历史 | `GET math/train/sessions` | 分页 |
| 错题 | `GET math/mistakes`、`POST math/mistakes/practice` | |
| 今日复习 | `GET math/review/today`、`POST math/review/sessions` | |
| 掌握度 | `GET math/mastery` | |
| 学情 | `GET math/analytics` | days=7\|30 |

**访问边界**：学生不可访问 `math/admin/*`。

---

## 4. 管理员 API 规划

均需 `JwtAuthGuard` + `AdminGuard`。

| 能力 | 路径前缀建议 |
|------|----------------|
| 知识库 CRUD/状态 | `math/admin/knowledge-points` |
| 依赖 | `math/admin/knowledge-dependencies` |
| 模板 | `math/admin/templates` |
| 题目 | `math/admin/questions` |
| AI 生成任务 | `POST math/admin/generation/jobs`、`GET .../jobs/:id` |
| 数学验证触发 | `POST math/admin/questions/:id/validate-math` |
| 教学脚本 | `math/admin/teaching-scripts` |
| MASP 校验 | `POST math/admin/masp/validate` |
| 视频任务 | `math/admin/render-jobs` |
| 私有视频下载 | `GET math/admin/videos/:id/content`（流式，非静态） |
| 审核/发布 | `POST .../publish`、`POST .../reject` |

前端：`/settings/math-*` + `requiresAdmin`；SettingsLayout 硬编码入口。

---

## 5. DeepSeek 复用契约

```
MathModule
  imports: [AiReferenceModule, AuthModule, TypeOrmModule.forFeature(...)]
  providers: [MathDeepseekAdapter, ...]

MathDeepseekAdapter
  - 注入 DeepseekClientService
  - 仅调用其底层能力或新增「数学专用方法」：优先在 Adapter 内用 fetch 包装
    （若必须改 Client：单独任务说明，默认禁止改既有 generateSimilar 等行为）
  - Adapter 职责：超时 AbortSignal、有限重试、严格 Schema 解析题干 JSON
  - 输出：文案字段；答案字段由 math-core 填入
```

`AiAccessService.assertCanUseAi`：管理生成可仅 Admin；学生侧若用 AI 讲解再套用。

---

## 6. AI 生产接口（逻辑）

**Job 状态**：`queued|running|succeeded|failed|cancelled`  
**内容阶段**：与题目 `lifecycle_status` 对齐。

流水线步骤（服务端编排，非 AI 自主）：

1. 选 KP + template → 参数采样（core）  
2. `solve` → answer_payload  
3. DeepSeek 生成 stem（Adapter）  
4. 一致性检查（数字/关系与 params 一致）  
5. 教学脚本生成（可 AI 文案 + 程序结构）  
6. MASP 生成/填充 → `assertMasp`  
7. 状态推进至 REVIEW_PENDING  
8. 人工审核 → APPROVED → PUBLISHED  

失败：`attempt_count++`；可重试至上限；**幂等键**防止重复造题。

---

## 7. 视频任务接口

Worker 轮询伪契约：

```
claim: UPDATE math_render_jobs SET status='leased', lease_owner=?, lease_until=?
       WHERE status IN ('queued','leased') AND (lease_until IS NULL OR lease_until < NOW())
       LIMIT 1
complete: status=succeeded, output_path=private...
fail: attempt_count++; if < max then queued else dead
```

API：`POST math/admin/render-jobs`（idempotency_key）；`GET` 状态；发布接口将文件登记为 `storage_class=public`。

---

## 8. MASP 协议边界（摘要）

### 8.1 四层

| 层 | 职责 |
|----|------|
| mathematics | 对象量、守恒、目标状态；可机器校验 |
| teaching | 步骤文案、提问、目标认知 |
| visual | 舞台对象（糖、盘子）与外观 |
| playback | 时间轴、动作序列、交互点、可自动播放 |

### 8.2 动作注册

`protocol` 内 `ACTION_REGISTRY`：如 `move.count`、`highlight`、`ask`、`wait`；未知 action → 校验失败。

### 8.3 版本

`maspVersion: "1.0.0"`；播放器/渲染器声明支持范围。

### 8.4 Web 与 Remotion

共享同一份 `masp_json`（protocol 校验后）；Web 映射到 SVG；Remotion 映射到序列帧；**不得**两套互相矛盾的数学层。

---

## 9. 完整示例：移多补少（18 / 12 → 移 3 → 15 / 15）

以下为**教学数据示例**（非最终 Schema 定稿）；入库前须通过 `assertMasp`。

```json
{
  "maspVersion": "1.0.0",
  "id": "demo-transfer-equalize-18-12-3",
  "locale": "zh-CN",
  "mathematics": {
    "modelType": "transfer_equalize",
    "params": {
      "left": 18,
      "right": 12,
      "transfer": 3
    },
    "invariants": [
      { "type": "sum_conserved", "total": 30 }
    ],
    "states": [
      {
        "id": "s0",
        "left": 18,
        "right": 12,
        "label": "初始"
      },
      {
        "id": "s1",
        "left": 15,
        "right": 15,
        "label": "转移后"
      }
    ],
    "transitions": [
      {
        "from": "s0",
        "to": "s1",
        "action": "transfer",
        "fromSide": "left",
        "toSide": "right",
        "count": 3
      }
    ],
    "expectedAnswer": {
      "transfer": 3,
      "finalLeft": 15,
      "finalRight": 15
    }
  },
  "teaching": {
    "title": "移多补少，两边一样多",
    "grade": 2,
    "steps": [
      {
        "id": "t1",
        "say": "左边有 18 颗糖，右边有 12 颗糖。",
        "goal": "读懂多少"
      },
      {
        "id": "t2",
        "say": "要想两边一样多，可以从多的一边移一些到少的一边。",
        "goal": "理解移多补少"
      },
      {
        "id": "t3",
        "say": "两边相差 6 颗，移一半也就是 3 颗，两边就都是 15 颗。",
        "goal": "算出转移量"
      },
      {
        "id": "t4",
        "say": "现在两边都是 15 颗，一样多了。",
        "goal": "验证"
      }
    ],
    "checkpoints": [
      {
        "afterStep": "t2",
        "prompt": "应该从哪边往哪边移？",
        "expect": { "fromSide": "left", "toSide": "right" }
      }
    ]
  },
  "visual": {
    "stage": { "width": 800, "height": 450 },
    "objects": [
      {
        "id": "plateL",
        "type": "plate",
        "x": 180,
        "y": 280,
        "label": "左边"
      },
      {
        "id": "plateR",
        "type": "plate",
        "x": 620,
        "y": 280,
        "label": "右边"
      },
      {
        "id": "candies",
        "type": "tokenGroup",
        "token": "candy",
        "layout": "grid"
      }
    ],
    "skins": { "candy": { "shape": "circle", "fill": "#e85d4c" } }
  },
  "playback": {
    "autoplay": false,
    "canPause": true,
    "canReplay": true,
    "fps": 30,
    "timeline": [
      {
        "at": 0,
        "actions": [
          { "op": "spawnTokens", "target": "candies", "side": "left", "count": 18 },
          { "op": "spawnTokens", "target": "candies", "side": "right", "count": 12 },
          { "op": "say", "stepId": "t1" }
        ]
      },
      {
        "at": 90,
        "actions": [{ "op": "say", "stepId": "t2" }]
      },
      {
        "at": 150,
        "actions": [
          { "op": "ask", "checkpointId": "after-t2" }
        ],
        "waitForInteraction": true
      },
      {
        "at": 180,
        "actions": [
          {
            "op": "move.count",
            "from": "left",
            "to": "right",
            "count": 3,
            "durationFrames": 45
          },
          { "op": "say", "stepId": "t3" }
        ]
      },
      {
        "at": 240,
        "actions": [
          { "op": "assertState", "stateId": "s1" },
          { "op": "say", "stepId": "t4" },
          { "op": "highlight", "targets": ["plateL", "plateR"] }
        ]
      }
    ]
  }
}
```

**数学层校验（core，非 AI）**：`18+12=30`，`18-3=15`，`12+3=15`，`transfer=(left-right)/2` 当差为偶数。

---

## 10. 现有系统集成要求清单

| 项 | 要求 | 现状 |
|----|------|------|
| AppModule | `imports: [MathModule]` | 未做 |
| Router / Layout | `/math/**`、Settings 管理项 | 未做 |
| nginx | 白名单加 `math` | **冲突，必须改** |
| workspace | `packages/*` | **冲突，必须改** |
| pack:release | 共享包/Worker 说明与拷贝 | **冲突，必须改** |
| .env.example | Worker、私有存储路径、可选数学 AI 超时 | 建议追加 |
| 化学 / 通用错题 | 零修改 | 约束 |

---

## 11. 前端集成契约

- Axios：`apps/web/src/api/http.ts` + 新建 `math.ts` / `math-admin.ts`
- 动画：`components/math-animation` 只接受已校验 MASP；校验可在 API 侧完成，前端二次 `assertMasp` 可选
- 不做全局菜单系统重构

---

*文档：`docs/math/04-integration-contracts.md`*
