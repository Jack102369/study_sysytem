# P1-FUNC-3A：函数奇偶性 25 题导入前预检

**日期**：2026-10-24  
**库**：`study_system`  
**阶段**：preview 允许；**confirm 禁止**

---

## 1. 题库版本

| 项 | 值 |
|----|-----|
| 文件 | `docs/high_school_math/question_bank/chapter_03/parity_25.json` |
| 大小 | 24578 bytes |
| SHA-256 | `7aaa0d1880e55896ce7cb6365a2ff552b57c9820b83140e43620dcf0f95263d8` |
| 导入内容哈希 | `aae8cc4e3e9835be50ef996133ef737ff5abdf5b3e50c86bef2e98b03b602304` |
| 题数 | 25 |
| code | HSMA-RJA-CH03-PARITY-0001 .. HSMA-RJA-CH03-PARITY-0025 |
| 题型 | {"single":12,"judge":4,"multi":5,"numeric":4} |
| 难度 | {"1":12,"2":9,"3":4} |
| 权威源一致 | PASS |
| 清单 | `parity_import_manifest.json` |

## 2. 数学复核（人工状态）

| code | 机器 | 人工 |
|------|------|------|
| HSMA-RJA-CH03-PARITY-0022 | NEEDS_HUMAN_REVIEW | **PENDING**（未自动通过） |
| HSMA-RJA-CH03-PARITY-0023 | NEEDS_HUMAN_REVIEW | **PENDING**（未自动通过） |
| 其余 23 | VERIFIED_* | PENDING |

说明：preview 若出现 MATH_HUMAN_REVIEW 类 warning，**不等于**人工 APPROVED。

## 3. 数据库基线（preview 前 / 后）

| 项 | 前 | 后 |
|----|----|----|
| train_items | 85 | 85 |
| train_item_kps | 121 | 121 |
| CH01 draft | 80 | （只读未改） |
| approved formal | 0 | 0 |
| review_records | 0 | 0 |
| sessions | 39 | 39 |
| session_items | 195 | 195 |
| chem_specialties | 12 | 12 |
| 第三章 KP | 27 | 27 |
| 3.2 KP | 12 | 12 |
| 奇偶性 4 KP 启用 | YES | |
| 25 code 冲突 | **0** | |
| P0 id1–5 | `[{"id":1,"code":"HS_MATH_P0_E2E_TEST_single","status":"disabled","pool":"formal"},{"id":2,"code":"HS_MATH_P0_E2E_TEST_multi","status":"disabled","pool":"formal"},{"id":3,"code":"HS_MATH_P0_E2E_TEST_judge","status":"disabled","pool":"formal"},{"id":4,"code":"HS_MATH_P0_E2E_TEST_numeric","status":"disabled","pool":"formal"},{"id":5,"code":"HS_MATH_P0_E2E_TEST_single2","status":"disabled","pool":"formal"}]` | |

**数据库变化：无写入**（preview 前后 items/kps 一致）。

## 4. preview

| 项 | 值 |
|----|-----|
| 状态 | **PASS** |
| errorCount | 0 |
| warningCount | 25 |
| canConfirm | true |
| warning 分类 | {"MATH_HUMAN_REVIEW":25} |
| hasPreviewToken | true |

### warning 样本

```json
[
  {
    "code": "HSMA-RJA-CH03-PARITY-0001",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0002",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0003",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0004",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0005",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0006",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0007",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0008",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0009",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0010",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0011",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0012",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0013",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0014",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0015",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0016",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0017",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0018",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0019",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0020",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0021",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0022",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0023",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0024",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  },
  {
    "code": "HSMA-RJA-CH03-PARITY-0025",
    "warnings": [
      {
        "level": "warning",
        "code": "MATH_HUMAN_REVIEW",
        "message": "结构合法不等于数学正确；批准前须人工核对题干/答案/解析"
      }
    ]
  }
]
```

### error 样本

```json
[]
```

## 5. 阻断问题

- （无）

## 6. 用户授权状态

**WAITING_FOR_CONFIRM_AUTHORIZATION**

未获明确授权前：**禁止 confirm**。

## 7. 下一阶段

**READY_FOR_CONFIRM_AUTHORIZATION**
