# P1-FUNC · 第三章首批 12 题正式批准验收

> **授权**：用户明确授权仅对指定 12 道 PARITY 题执行正式 approve  
> **库**：`study_system` @ `127.0.0.1`  
> **执行时间**：`2026-10-25T12:16:33+08:00`～`12:16:35+08:00`  
> **API**：`PATCH /hs-math/admin/train-items/:id/status` · `{ status: "approved", confirmPublish: true }`  
> **结果**：**PASS**（12/12 批准成功）  
> **未改**：题干/答案/解析/KP/难度/方法/来源/审核记录  
> **4B**：仍 **BLOCKED**  
> 快照：`db/backups/_ch03_approve_12_20261025.json`

---

## 1. 批准前实时复核

| 检查 | 结果 |
|---|---|
| 12 题存在且 draft | PASS |
| 当前版 passed + 指纹匹配 + 无 STALE | PASS |
| canPublish=true · publishBlockReasons=[] | PASS×12 |
| 来源仍 original/unverified/unknown | PASS（未改） |
| 方法关联 16 | PASS |

阻塞题：**无** → 进入批准。

---

## 2. 批准结果清单

| code | ver | fingerprint（前缀） | HTTP | DB status | 来源未变 |
|---|---:|---|---:|---|---|
| PARITY-0001 | 2 | 45d4ad41… | 200 | **approved** | 是 |
| PARITY-0002 | 2 | 2bcce5a1… | 200 | **approved** | 是 |
| PARITY-0005 | 2 | 6ae18da3… | 200 | **approved** | 是 |
| PARITY-0006 | 2 | 47c92adb… | 200 | **approved** | 是 |
| PARITY-0007 | 2 | ae966a69… | 200 | **approved** | 是 |
| PARITY-0010 | 2 | 97b2e41b… | 200 | **approved** | 是 |
| PARITY-0011 | 2 | 6d21785a… | 200 | **approved** | 是 |
| PARITY-0012 | 2 | 175f2c25… | 200 | **approved** | 是 |
| PARITY-0015 | 2 | 0f6a522d… | 200 | **approved** | 是 |
| PARITY-0019 | 2 | 0a038497… | 200 | **approved** | 是 |
| PARITY-0020 | 3 | 57a3e3ea… | 200 | **approved** | 是 |
| PARITY-0025 | 3 | 4344fe14… | 200 | **approved** | 是 |

完整 fingerprint 见批准前 panel / 快照 JSON。  
失败：**0**。未使用 SQL UPDATE 绕过门禁。

---

## 3. 批准后数据库核验

| 指标 | 前 | 后 |
|---|---:|---:|
| items | 110 | **110** |
| approved | 0 | **12**（仅目标 12；其他 approved=0） |
| draft | 105 | **93** |
| disabled | 5 | **5** |
| methods | 11 | **11** |
| item_methods | 16 | **16** |
| reviews | 12 | **12**（未增删） |
| 非目标 98 题 status/cv/来源 | — | **未变化** |
| 来源字段 | original/unverified/unknown | **保持不变** |

异常：**无**。

---

## 4. 来源合规说明

保持 `original` + `unverified` + `unknown`。  
**不得**描述为已核实原创。  
按既定 `assertSourceAllowsFormalPublish` 规则允许 formal 批准；本轮**未**改门禁、**未**改来源。

---

## 5. 学生练习条件

- formal + approved + active：**12** 题（均属 `rja-ch3` / `3.2`）  
- **具备**学生端专项正式抽题的最小条件（池非空）  
- 本验收**未**创建学生练习会话  

---

## 6. 下一步（须另授权）

1. 学生端只读冒烟：创建 `rja-ch3` 专项会话，确认能抽到本批题。  
2. 扩充 3.1/3.3 题或第二批 3.2。  
3. 不自动进 CORE-1B；4B 保持非 PASS。
