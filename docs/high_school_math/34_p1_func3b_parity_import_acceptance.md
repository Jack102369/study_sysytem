# P1-FUNC-3B：函数奇偶性 25 题导入验收

**日期**：2026-10-24  
**库**：`study_system`  
**授权**：用户明确授权 P1-FUNC-3B；SHA `7aaa0d1880e55896ce7cb6365a2ff552b57c9820b83140e43620dcf0f95263d8`

---

## 1. 授权范围

- 文件：`parity_25.json`
- code：`HSMA-RJA-CH03-PARITY-0001` … `0025`
- 目标状态：全部 **draft** / pool=formal
- **未**批准；**未**写审核 passed

## 2. 文件版本

| 项 | 值 |
|----|-----|
| SHA-256 | `7aaa0d1880e55896ce7cb6365a2ff552b57c9820b83140e43620dcf0f95263d8`（与授权一致） |
| 题数 | 25 |
| 导入内容哈希 | `aae8cc4e3e9835be50ef996133ef737ff5abdf5b3e50c86bef2e98b03b602304` |

## 3. preview

```json
{
  "reused": true,
  "expiresAt": "2026-10-24T12:42:03.189Z"
}
```

## 4. confirm

| 项 | 值 |
|----|-----|
| HTTP | 201 |
| mode | created |
| successCount | 25 |
| failCount | 0 |

## 5. 数据库前后

| 项 | 前 | 后 |
|----|----|----|
| train_items | 85 | 110 |
| train_item_kps | 121 | 170 |
| CH01 draft | 80 | 80 |
| CH03 parity draft | 0 | 25 |
| approved formal | 0 | 0 |
| review_records | 0 | 0 |
| sessions | 39 | 39 |
| session_items | 195 | 195 |
| chem_specialties | 12 | 12 |
| 第三章 KP | 27 | 27 |
| 第一章 KP | 15 | 15 |

## 6. 内容一致性

- 一致：25/25
- 不一致：无

## 7. KP 关联

PASS（无孤立关联；主 KP 唯一）

## 8. 审核状态

- 人工材料：仍为 PENDING（未改文档状态为 APPROVED）
- 数据库 review 写入（parity）：0
- 数据库 approved：0
- 重点 0022/0023：仍待人工确认（draft/none）

## 9. 历史与其他模块

历史 sessions/session_items/chem/第一章 draft/KP 数：**受保护未变**

## 10. 下一阶段

**READY_FOR_PARITY_HUMAN_REVIEW**
