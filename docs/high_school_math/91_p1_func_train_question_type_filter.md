# HS-MATH-TRAIN-TYPE-FILTER · 学生训练题型筛选

> **日期**：2026-10-25  
> **状态**：**代码完成**（需重启 API / 刷新 Web 后网页生效）  
> **UI**：UI_NOT_RUN（未真实浏览器点验）

---

## 1. 修改文件

| 文件 | 变更 |
|---|---|
| `apps/api/src/hs-math/dto/train-session.dto.ts` | 可选 `questionType` ∈ 五题型 |
| `apps/api/src/hs-math/train/hs-math-train.service.ts` | createSession 按题型过滤 |
| `apps/api/src/hs-math/util/hs-math-train-question-type.ts` | 纯函数筛选 / shortfall |
| `apps/api/src/hs-math/util/hs-math-train-question-type.selftest.ts` | 自测 |
| `apps/web/src/views/hs-math/HsMathTrainSetupView.vue` | 题型单选 |
| `apps/web/src/api/hs-math-train.ts` | body + `recognitionWarnings` 类型 |
| `apps/api/package.json` | `hs-math:train-question-type-selftest` |

---

## 2. API 协议

`POST /hs-math/train/sessions`

新增可选字段：

```json
{ "questionType": "application" }
```

允许：`single` | `multi` | `judge` | `numeric` | `application`  
未传：全部题型（兼容旧客户端）  
非法值：class-validator → **400**

仍强制：`pool=formal`、`status=approved`、`isActive`、章节+难度、顺序/随机。

题量不足：创建 `actualCount < plannedCount`，`shortfall` 提示；**不**抽 draft/disabled。

无匹配题：业务错误，如「暂无已批准的「application」题目」。

---

## 3. 兼容性

- 旧前端不传 `questionType` → 行为与改前一致。  
- 不改评分、图片上传、AI 批改链路。  
- **不硬编码** item 151；应用题 + 提高难度 + 对应分类，由正式规则抽到 APP-0001。

---

## 4. 测试

```bash
pnpm --filter api run hs-math:train-question-type-selftest
pnpm --filter api run build
pnpm --filter web run build
```

自测覆盖：省略/各题型/非法 allowlist/shortfall/空池。

---

## 5. 尚需重启

本轮**未**重启服务（任务禁止）。部署生效需：

1. 重启 API:3000（加载新 DTO/抽题）  
2. 刷新或重启 Vite Web  

---

## 6. 推荐学生路径（生效后）

高一数学 → 第三章专项 → **3.4 函数的应用（一）** 分类 → 难度 **提高** → 题型 **应用题** → 开始训练。
