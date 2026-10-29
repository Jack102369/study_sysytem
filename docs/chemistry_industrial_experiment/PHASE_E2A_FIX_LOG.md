# PHASE_E2-A · 修复记录

| 字段 | 值 |
|------|-----|
| 修改日期 | 2026-10-29 |
| 批次 | `industrial_formal_candidate_20261029_121958` |
| 脚本 | `chem:industrial-phase-e2a-revise` |
| 机器日志 | `formal_candidate_batches/.../e2a_fix_log.json` |

---

## 规则层

| 文件 | 原因 | 影响 | 回归 |
|------|------|------|------|
| `industrial-quality.constants.ts` | FILTER_SOLUBLE_SALT 误伤正确教学表述 | 工艺维度 | quality-selftest 正/反例 |
| `industrial-case.fixtures.ts` | 新增 `CASE_GAS_WASH_TEACHING`（仍 draft/unverified） | cand_02 案例对齐 | case-selftest |

---

## 候选修订

### cand_63284abdddf24cee

| 项 | 值 |
|----|-----|
| 修改 | 题干/解析澄清（不溶杂质）；非答案变更 |
| 流程/装置 | 流程重渲染（同内容哈希可幂等）；无装置 |
| rev1→当前 audit | `c52f78311de0…` → `83651f1b22d1…` |
| 质检 | blocking 2→2（仅发布闸门）；QUALITY_BLOCKERS 0 |
| 需重新人审 | **是**（revision 递增；humanDecision=null） |

### cand_8ce596acabc64f26

| 项 | 值 |
|----|-----|
| 修改 | 案例→`gas_wash_teaching_basic`；stub 绑定真实 version/hash；装置 meta 对齐 |
| 原 blocking | 4（含 CURR_CATEGORY、DIAG_CASE_BIND） |
| 现 blocking | 2（仅 CURR_CASE_TRUST、CHEM_SOURCE_VERIFIED） |
| rev1 audit | `2e676c5cdc5e…` |
| 当前 audit | `5d8e06f29a79…` |
| 流程 SVG | `21d7bfe65f95…` → `bf825f900264…` |
| 装置 SVG | `d1e70920d636…`（内容未变，hash 复用） |
| 需重新人审 | **是** |

### cand_03bf94425958444b

| 项 | 值 |
|----|-----|
| 修改 | 解析改写消除误判措辞；规则收窄后 FILTER 不再 fail |
| 原 blocking | 3（含 FILTER_SOLUBLE_SALT） |
| 现 blocking | 2 |
| rev1 audit | `36ed3885de53…` |
| 当前 audit | `e54861a90eef…` |
| 双图 | 流程 `f2729bf85748…`；装置 `255a5b54473c…`（稳定） |
| 需重新人审 | **是** |

### cand_312c51e0c9e249f7

| 项 | 值 |
|----|-----|
| 修改 | 难度 3→2；知识点对齐案例；题干注明来源未核验 |
| 原 | blocking 2 + 难度/KP unknown |
| 现 | blocking 2；unknown 14→12 |
| rev1 audit | `9659638fe7f3…` |
| 当前 audit | `30c49a534627…` |
| NO_CHANGE 图 | 流程 SVG 哈希未变 `a06bc63331a9…` |
| 需重新人审 | **是** |

---

## 未做（禁止项）

- 未自动 approve / 未伪造 verified / 未改案例 published  
- 未 formal 写库 / 未 KB 实绑 / 未建会话  
- 未改 PHASE_D Mock 批次  
- 未将 unknown 改 pass  

---

## 测试

| 脚本 | 结果 |
|------|------|
| chem:industrial-phase-e2a-selftest | PASS |
| chem:industrial-quality-selftest | PASS |
| chem:industrial-case-selftest | PASS |
| chem:industrial-phase-e1-selftest | PASS |
| chem:industrial-phase-d-selftest | PASS |
| api/web build | PASS |
