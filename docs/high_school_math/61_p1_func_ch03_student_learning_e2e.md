# P1-FUNC · CH03 3.2 学生正式学习闭环验证

> **库**：`study_system` @ `127.0.0.1`（`DESKTOP-MCIO9LF` · MySQL 8.0.44）  
> **执行时间**：`2026-10-25T12:28:00+08:00`～`12:29:10+08:00`  
> **测试账号**：现有 **ADMIN**（`user_id=2`，角色 ADMIN）——用户明确授权可用于本轮学习 API 测试  
> **API 基址**：`http://127.0.0.1:3000`  
> **结果**：**3.2 API 学习闭环 = PASS**  
> **学生 UI**：`STUDENT_UI_NOT_RUN`（无浏览器操作证据；未建设自动化）  
> **4B**：仍 **BLOCKED**  
> 快照：`db/backups/_ch03_admin_student_e2e_20261025.json`  
> 终态保护：`db/backups/_ch03_admin_student_e2e_final_protect.json`

---

## 1. 执行前核验

| # | 条件 | 结果 |
|---|---|---|
| 1 | 管理员身份 | **PASS**（`id=2` · `role=ADMIN` · 未禁用） |
| 2 | 可调用学生练习 API | **PASS**（`POST /hs-math/train/sessions` → HTTP 201） |
| 3 | 库=`study_system` · 非生产 | **PASS** |
| 4 | approved=12 · formal · rja-ch3/3.2 | **PASS** |
| 5 | 无积分/化学写入路径于 train 服务 | **PASS**（代码无 chem/points；事后计数未变） |

说明：学生训练控制器仅 `JwtAuthGuard`，**未**按 USER 角色拒绝 ADMIN；以 ADMIN JWT 的 `sub` 作为 `user_id` 写入会话。

---

## 2. 正式抽题

| session_id | 用途 | diff | pool | actual | 抽中 code（摘要） |
|---:|---|---:|---|---:|---|
| 40 | 首轮（HTTP 201 修正前已完成） | 1 | formal | 5 | 0001,0002,0005,0006,0007 |
| 41 | 主测：single/judge 对错 + 幂等 | 1 | formal | 5 | 同上 |
| 42 | multi 正确 | 2 | formal | 1 | 0012 |
| 43 | multi 错误 | 2 | formal | 1 | 0012 |
| 44–45 | numeric 补测占位（count=5 未抽到） | 1 | formal | 5 | **cancelled**（未作答） |
| 46 | numeric 正确（count=10） | 1 | formal | 10 | 含 **0015** |
| 47 | numeric 错误（count=10） | 1 | formal | 10 | 含 **0015** |

抽题断言：

- 全部 `pool_mode=formal`
- 全部为 `HSMA-RJA-CH03-PARITY-*` approved 题
- **无** draft / disabled / test 池泄漏
- 未跨 specialty/category（固定 `specialtyId=18` · `categoryId=42`）

**A. 正式抽题：PASS**

---

## 3. 四题型判分

| qtype | 正确用例 | 错误用例 |
|---|---|---|
| single | 0001 → correct（sess 41） | 0005/0006 → wrong（sess 41） |
| judge | 0002 → correct（sess 41） | 0007 → wrong（sess 41） |
| multi | 0012 → correct（sess 42） | 0012 → wrong（sess 43） |
| numeric | 0015 → correct（sess 46） | 0015 → wrong（sess 47） |

幂等 / 覆盖：

| 检查 | 结果 |
|---|---|
| 重复 `POST .../submit` | `submitMeta.idempotent=true`；计数不变 |
| 完成后 `PATCH .../answers` | HTTP **409**（任务已结束） |

**B. 四题型判分：PASS**

---

## 4. 结果持久化 / 历史 / 学情

| 检查 | 结果 |
|---|---|
| 重新 GET 已完成会话 | status=completed；含标准答案与解析 |
| 历史列表含本轮 session | PASS（缺漏列表为空） |
| 其他用户（user_id=1）读 ADMIN 会话 | HTTP **404** |
| analytics | HTTP 200；overview.completedSessions=**6**；rja-ch3 聚合一致 |

终态 analytics（ADMIN）：completedSessions=6 · totalQuestions=32 · correct=10 · wrong=22 · accuracy=0.3125

**C. 结果持久化：PASS**  
**D. 历史记录：PASS**  
**E. 学情统计：PASS**  
**F. 学生 UI：NOT_RUN**

---

## 5. 数据保护

| 指标 | 本轮前（首跑前基线） | 终态 |
|---|---:|---:|
| items | 110 | **110** |
| approved/draft/disabled | 12/93/5 | **12/93/5** |
| methods / item_methods / reviews | 11/16/12 | **11/16/12** |
| users | 2 | **2**（未建号） |
| chem_specialties | 12 | **12** |
| user_points 行数 | 2 | **2** |
| user_id=1 sessions | 37 | **37**（未变） |
| user_id=2 sessions | 2 → | **10**（本轮新增 8：id 40–47） |

本轮新增 session_id：**40, 41, 42, 43, 44, 45, 46, 47**  
（44/45 为 cancelled；其余 completed。）  
**未**删除、**未**改写既有会话内容。

---

## 6. 验收结论

| 分项 | 状态 |
|---|---|
| A 正式抽题 | **PASS** |
| B 四题型判分 | **PASS** |
| C 结果持久化 | **PASS** |
| D 历史记录 | **PASS** |
| E 学情统计 | **PASS** |
| F 学生 UI | **NOT_RUN** |
| **3.2 API 学习闭环** | **PASS** |
| P1-FUNC-CORE-1A-4B | **BLOCKED**（保持） |

注意：API PASS ≠ 浏览器 UI PASS。

---

## 7. 业务缺口（非本轮范围）

1. 学生浏览器 UI 手工/自动化冒烟未做。  
2. 难度 1 下 `count=5` 顺序抽题可能抽不到唯一 numeric（0015）——产品层可提示题量/难度；本轮用 `count=10` 覆盖。  
3. 第三章其余小节（3.1/3.3/3.4）题库与闭环未验。  
4. 不进 CORE-1B。
