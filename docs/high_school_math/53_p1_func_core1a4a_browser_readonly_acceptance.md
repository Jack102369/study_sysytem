# P1-FUNC-CORE-1A-4A · 管理员来源/方法页 · 真实浏览器只读验收

> **阶段状态**：**PASS**  
> **范围**：只读浏览器 + 只读 SELECT + web build；**无**业务写接口、**无**种子、**无**审核/批准、**无**代码业务修改  
> **库**：`study_system`

---

## A. 执行结果

| 项 | 结果 |
|---|---|
| 阶段结论 | **PASS** |
| 浏览器实际打开 | **是**（Cursor IDE browser） |
| 管理员登录 | **成功**（复用既有会话；显示名 **adu**） |
| 数学业务写请求 | **未观察到**（未点击保存/审核/批准；未创建方法） |
| DB 业务变更 | **无**（验收前后分布一致） |
| Web build | **PASS**（exit 0） |
| Mock 自测 | **PASS**（18 checks；非写库） |

---

## B. 环境信息

| 项 | 值 |
|---|---|
| Web | `http://localhost:5173` · Vite · PID **13032** · 本仓库 `apps/web` |
| API | `http://localhost:3000` · `node --enable-source-maps dist/main.js` · PID **11544**（与 2D.2 部署一致） |
| 库 | `study_system` @ `127.0.0.1:3306` |
| 生产/第二库 | **否**（本地开发实例） |

---

## C. Web/API 状态

| 检查 | 结果 |
|---|---|
| `GET /health` | **200** `{"success":true,"data":{"app":"api","db":"ok"}}` |
| Web 首页 | **200** |
| 本阶段重启服务 | **未执行**（无授权需求） |

---

## D. 管理员登录情况

- 复用已打开标签会话；设置侧栏「高一数学」可见（含「解题方法词典」）。  
- 审核台显示「当前登录：**adu**」。  
- **未**修改密码、**未**新建账号、**未**伪造 JWT；报告不输出 token。  
- 本阶段**未**走登录表单（会话已有效）；无额外认证 POST 记录为数学业务写入。

---

## E. 方法词典页面

路径：`/settings/hs-math-methods`

| 检查 | 结果 |
|---|---|
| 路由 / 侧栏入口 | **PASS** |
| 页面渲染 / 标题 | **PASS** |
| 空状态文案 | **PASS**（「方法词典为空…正式种子须另授权」） |
| 搜索 / 状态筛选 / 新增·刷新 | **PASS** |
| 打开新增弹窗（code/名称/简介/排序/启用） | **PASS** |
| 输入临时 code → 取消 →「有未保存修改」 | **PASS**（取消关闭保留草稿；确定放弃关闭） |
| 点击保存 | **未执行** |
| 控制台 Vite overlay | **无** |

---

## F. 题目来源编辑

路径：`/settings/hs-math-train-items`  
样例：`HSMA-RJA-CH03-PARITY-0025`（draft · 基础）

| 检查 | 结果 |
|---|---|
| 列表加载 | **PASS**（≥20 行可见） |
| 编辑弹窗 / 题干·选项·解析 / KaTeX | **PASS** |
| content_version 展示 | **PASS**（`draft · content_version=2`） |
| 默认来源提示 | **PASS**（原创·未核实·许可未知 ≠ 已核实原创） |
| 中文选项 | **PASS**（原创/改编/真题；未核实/已核实；允许/未知/限制/禁止） |
| 临时切「高考真题改编」 | **PASS**（年份/试卷/题号/出处/改编说明出现；风险提示出现） |
| 保存 | **未点击**（取消 + 放弃） |

---

## G. 主辅方法编辑

| 检查 | 结果 |
|---|---|
| 关联方法多选 / 主要方法 | **PASS**（主方法在无关联时 disabled） |
| 词典为空提示 | **PASS** |
| 未保存 meta 黄条 | **PASS**（切换来源后） |
| 「保存来源与方法」按钮 | **可见；未点击** |
| 真实方法多选验收 | **N/A**（methods=0；不可冒充已验收） |

---

## H. 未保存内容保护

| 场景 | 结果 |
|---|---|
| 方法词典新增草稿关闭确认 | **PASS** |
| 题库来源修改关闭确认 | **PASS**（「有未保存修改，确认关闭？」） |
| 放弃后未写库 | **PASS**（见 M） |

---

## I. 审核工作台

路径：`/settings/hs-math-train-review`  
样例：`HSMA-RJA-CH01-0001`

| 检查 | 结果 |
|---|---|
| 队列 | **PASS**（共 **105** 条；审核态 none） |
| 题干/选项/答案/解析/KP | **PASS** |
| KaTeX | **PASS**（`.katex` ≥ 6） |
| 来源展示 | **PASS**（原创 · 未核实 · 许可未知 + 默认兼容警告） |
| 主/辅方法区 | **PASS**（无主方法 / 无辅助方法） |
| 指纹 / v1 / draft | **PASS** |
| 正式批准 | **disabled**（门禁保留） |
| 审核通过/退回/暂缓 | **未点击** |

---

## J. 版本一致性

| 场景 | 结果 |
|---|---|
| 自然加载 panel 与 getById 同版本 | **PASS**（v1=v1，可合并展示） |
| 冲突模拟 | **PASS（前端本地态）**：将 `itemDetail.contentVersion` 改为 100 → 出现「题目已更新…」；隐藏来源/方法；审核三按钮 + 批准均 **disabled**；有「刷新一致数据」 |
| 说明 | 冲突为 **UI 状态模拟**，**非**真实 DB 并发；不得冒充写库并发验收 |

---

## K. Network 请求

| 观察 | 结果 |
|---|---|
| 页面加载 | 数学管理页脚本 / 资源 **200** |
| 本阶段操作 | 仅打开/查看/本地改表单/取消；**未**点保存、审核、批准、导入 confirm |
| 业务写 | **无证据**表明发送了 methods POST、content-meta PUT、reviews POST、status PATCH |
| 自动写库 | **未发现** → 非 BLOCKED |

> 完整 XHR 方法名 HAR 未全量落盘；结论基于「未触发写 UI」+ 验收后 DB 不变。

---

## L. 控制台错误

- Vite error overlay：**无**  
- 阻断性前端报错：**未观察到**

---

## M. 数据库只读核对

**LAST_VERIFIED**：`2026-10-25T01:39:13Z`（UTC；只读 SELECT）

| 指标 | 值 | 相对 2D.2 基线 |
|---|---|---|
| train_items | **110** | 一致 |
| draft / disabled / approved | **105 / 5 / 0** | 一致 |
| reviews | **0** | 一致 |
| methods / item_methods | **0 / 0** | 一致 |
| sessions / session_items | **39 / 195** | 一致 |
| chem_specialties | **12** | 一致 |
| PARITY 难度 1/2/3 | **16 / 7 / 2**（共 25） | 一致预期 |

**结论**：本阶段 **无业务数据变更**。

---

## N. Web build

```
pnpm --filter web build  → exit 0
node apps/web/scripts/hs-math-p1-func-core1a31.selftest.mjs → 18 PASS
```

既有 chunk 体积警告，非阻塞。

---

## O. PASS / FAIL / NOT_RUN 清单

| 项 | 状态 |
|---|---|
| 环境确认 | PASS |
| 管理员登录 | PASS |
| 方法词典页 / 空态 | PASS |
| 来源编辑 / 默认值 | PASS |
| 主辅方法区（空词典） | PASS（结构） |
| 未保存保护 | PASS |
| 审核工作台 / KaTeX | PASS |
| 版本一致（自然） | PASS |
| 版本冲突（UI 模拟） | PASS |
| Network 无业务写 | PASS（观察+DB） |
| 控制台 | PASS |
| Web build | PASS |
| DB 只读核对 | PASS |
| 真实保存验收 | **NOT_RUN**（属 4B/写库授权） |
| 方法种子 | **NOT_RUN** |
| 人工审核/批准 | **NOT_RUN**（禁止） |

---

## P. 风险与缺陷

1. 方法词典仍空 → 真实多选关联 UI 只能验空态。  
2. Network HAR 未全量归档；依赖操作纪律 + DB 复核。  
3. 版本冲突仅为前端态模拟。  
4. 题库编辑弹窗在确认关闭时偶发多层 MessageBox 残留观感（不影响未写库；可后续 UX 打磨，非安全）。

---

## Q. 下一阶段建议

1. **CORE-1A-4B**（须另授权）：隔离写库验收 content-meta / 方法 CRUD。  
2. 可选：方法词典正式种子。  
3. 正式批准 E2E / **CORE-1B** 仍未授权。

---

## 变更文件（本阶段）

仅文档：

- `docs/high_school_math/53_p1_func_core1a4a_browser_readonly_acceptance.md`（本报告）  
- `docs/high_school_math/PROJECT_HANDOFF.md`

**无**业务代码修改；**无**迁移；**无**种子。
