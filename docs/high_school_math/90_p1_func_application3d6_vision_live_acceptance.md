# APPLICATION-3D-6 · Qwen Vision 真实多模态批改联调

> **日期**：2026-10-25  
> **状态**：**PARTIAL** — 已对网页提交的 **1** 个双图满分样本完成 **1×** 真实 Qwen；未覆盖部分正确 / 错误 / 图象类答案  
> **真实 Qwen HTTP**：**1 / 6**（本轮 **1** 次；无重试）  
> **UI**：结果 API 可读 `graded` + rubric；浏览器刷新后应显示 AI 解析（本轮 Agent 未代点 UI）

---

## 1. 授权与范围

沿用用户授权：配置 Vision、重启 :3000、最多 6 次 HTTP、虚构手写测试图、落库、`ENABLED=false`、不扫历史、不改题库、不迁移。

本轮仅处理用户网页刚提交的一条：`sessionId=107` / `sessionItemId=330` / `item_id=151`。

---

## 2. 定位记录

库：`study_system` · `user_id=2` · `item_id=151` · `grade_result=review_required`（批改前）。

| 筛选 | 结果 |
|---|---|
| 多条历史 review_required | 有（15:4x 等联调残留） |
| **两个 imageIds** + 最近提交 | **唯一**：session **107** / item **330** |
| answered_at | 2026-10-25 21:00:59 |
| answer | `{"kind":"application","imageIds":["25","26"]}` |
| item_code | `HSMA-RJA-CH03-APP-0001` |
| session | completed · difficulty=2 · category=44 · planned=5 · actual=1 |

未猜测；未处理其他候选。

---

## 3. 图片检查（仅 25 / 26）

| imageId | sort | status | mime | size_bytes | 磁盘 | 结论 |
|---|---|---|---|---|---|---|
| 25 | 1 | submitted | image/png | 10982 | 存在 · PNG 合法 · 467×310 · ink≈2.4% | 正常 |
| 26 | 2 | submitted | image/png | 10241 | 存在 · PNG 合法 · 886×347 · ink≈0.8% · 非全白 | **稀疏墨迹，非损坏** |

属主 `user_id=2` · `session_item_id=330` · 顺序与 `imageIds` 一致。  
**未修改/删除图片。**  
UI「第二张接近空白」判定为白底稀疏手写 / 缩略图观感；原图可读 → **继续 Qwen**。

---

## 4. 真实 Qwen 批改

| 项 | 值 |
|---|---|
| 入口 | `pnpm --filter api run hs-math:application3d6-vision-live -- --sessionId=107 --sessionItemId=330` |
| Vision 全局开关 | **false**（仅 invoker 外发） |
| HTTP | **1** · ~9879ms · 无重试 |
| model（返回） | `qwen3.8-27b-orca-q8` |
| images 外发 | 2 张，顺序 25→26 |
| tokens | prompt 1436 · completion 520 · total 1956 |
| 落库状态 | `graded` / `ai_graded` · `ai_attempt_count=1` |

原始摘要：`docs/high_school_math/_tmp_application3d6_vision_live_raw.json`（无 API Key / 无 Base64）。

---

## 5. 评分与数学质量

| 项 | 期望 | 实际 |
|---|---|---|
| totalScore | 10 | **10** |
| maxScore | 10 | **10** |
| model | 3 | **3** |
| domain | 2 | **2** |
| solve | 3 | **3** |
| conclusion | 2 | **2** |
| confidence | — | 1 |
| recognitionWarnings | — | null |
| errors | — | [] |

识别摘要（节选）：

- 第1张：收入函数 `y=2400x-30x²`、整数定义域 `{30,…,60}`  
- 第2张：配方 `y=-30(x-40)²+48000`、最大值 `x=40` / `48000` 元  

判断：**双图均识别**；步骤顺序正确；未编造空白页内容；分项之和=总分；有个性化解析。  
样本为接近满分虚构解答 → 本轮未验证部分分 / 错解路径。

---

## 6. 数据库

| 字段 | 批改后 |
|---|---|
| grade_result | `graded` |
| grade_reason | `ai_graded` |
| ai_model | `qwen3.8-27b-orca-q8` |
| ai_graded_at | 2026-10-25 21:05:08 |
| ai_attempt_count | 1 |
| ai_grade_json | 有 · 无 storage_key / `.bin` 泄漏 |

session **107**：`correct=0` `wrong=0` `pending=0`（应用题不进 correct/wrong）。  
旧 session **51 / 55 / 56** 及其 items：**未变**（仍 `pending_ai`）。

---

## 7. 历史 / 结果 / 学情 API

短时 JWT（user_id=2）冒烟（不收录 token）：

| API | 结果 |
|---|---|
| `GET /hs-math/train/sessions/107` | **200** · item 330 `graded` · aiGrade 10/10 · rubric 齐全 · images 仅 `imageId/mimeType/sortOrder` |
| `GET /hs-math/train/sessions?page=1&pageSize=50` | **200** · 含 sessionId **107** · pending=0 · accuracy=null |
| `GET /hs-math/train/analytics` | **200** · overview 等键可读 |
| storage_key | **未泄漏** |

---

## 8. UI

Agent 未代刷浏览器。结果 API 已返回 `graded` + 解析；用户刷新结果页应可见。  
第二张缩略图仍可能显「空」，属展示/墨迹稀疏，非文件损坏。

---

## 9. 阶段

**APPLICATION-3D-6 = PARTIAL**（单样本双图满分联通；缺部分正确/错误/图象覆盖）  
**APPLICATION-3D = PARTIAL** · **APPLICATION-3 = PARTIAL** · **APPLICATION-3C = PASS**

---

## 10. 剩余风险 / 下一步

1. 补测：部分正确、明显错误、图象类答案（仍限虚构图 · 预算内 HTTP）。  
2. 第二张缩略图 UI 可后续优化（原图正常，非阻塞）。  
3. 保持 `HS_MATH_VISION_GRADING_ENABLED=false`；勿批量扫 `review_required`。  
4. CORE-1B 未启动。
