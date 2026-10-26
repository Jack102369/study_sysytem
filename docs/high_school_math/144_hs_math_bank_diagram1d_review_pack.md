# HS-MATH-BANK-DIAGRAM-1D-REVIEW-PACK — 独立数学审核材料包

> 日期：2026-10-26  
> **最终状态：`REVIEW_PACK_READY`**  
> 前置：064 = draft/cv2（STEM_FIX_PASS）· 四图离线已生成  
> **未**改题、**未**改图、**未**上传、**未** review/approve；制图 Agent **未**宣布独立审核通过

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 审核包目录 | `docs/high_school_math/diagrams/independent_review_pack/` |
| 包内文件 | 4×PNG + `review_questions.md` + `independent_review_instructions.md` |
| 敏感信息 | **无**（无 .env / JWT / DB 连接 / 学生数据） |
| 064 题干 | 材料使用**修订后**「塔顶的仰角为」· draft / cv=**2** |
| 独立审核 | **尚未完成**（待外部审核者） |
| 正式上传 | **尚未执行** |
| **状态** | **`REVIEW_PACK_READY`** |

---

## 2. 四题当前状态（只读 DB）

| code | itemId | status | cv | qtype |
|------|--------|--------|-----|-------|
| CAND-G1B-093 | 244 | approved | 1 | application |
| CAND-G1B-080 | 231 | approved | 1 | application |
| CAND-G1B-064 | 215 | **draft** | **2** | application |
| CAND-G1B-091 | 242 | approved | 1 | single |

064 题干摘录（材料包原文）：

```
塔高测量：距塔底 $40\text{m}$ 处测得塔顶的仰角为 $30^\circ$，求塔高（精确值）。
```

drawable 当前仍为 **112**（本阶段未复批）。

---

## 3. 图片 SHA256（审核包副本 = 源目录副本）

| 文件 | 像素 | bytes | SHA256 |
|------|------|------:|--------|
| CAND-G1B-093.png | 1000×720 | （见 meta） | 见下表 |
| CAND-G1B-080.png | 1000×720 | | |
| CAND-G1B-064.png | 1000×720 | | |
| CAND-G1B-091.png | 1000×720 | | |

精确哈希以 `_g1d_review_pack_meta.json` / 包内 `review_questions.md` 表为准；生成时校验：PNG 魔数通过、分辨率 ≥600×400、文件可打开。

| code | SHA256 |
|------|--------|
| 093 | `e12b2f2b2373d4545c6a79af55caa1f0c85c7d83f7b29d8a2cc5132671fe33f1` |
| 080 | `c01574e808ba150866781d4fd716348fb3331359c635ae5f1a4b46f137ef31fc` |
| 064 | `a3549131d845107b4c795242013f50beb048639b056b1c302e79276dc8b4abf7` |
| 091 | `616bf077867cdf62c1d2b3b064ee6d5e48528d585d03d4e69ce69dbbb4032a53` |

（与 139/`_manifest.json` 一致；本阶段**未修改**原图。）

---

## 4. 审核包文件清单

```
docs/high_school_math/diagrams/independent_review_pack/
  CAND-G1B-093.png
  CAND-G1B-080.png
  CAND-G1B-064.png
  CAND-G1B-091.png
  review_questions.md
  independent_review_instructions.md
```

- `review_questions.md`：四题完整题干 / 选项 / 答案 / 解析 / rubric / cv / status / 图片名  
- `independent_review_instructions.md`：外部审核独立性与 PASS/BLOCKED 要求  

---

## 5. 完整性与边界

| 检查 | 结果 |
|------|------|
| 包内仅允许文件 | ✓ |
| 064 不用旧「顶角」题干 | ✓ |
| 不含密钥/学生数据/备份 | ✓ |
| 作者自检未当作审核结论 | ✓ |
| 独立审核完成？ | **否** |
| 正式上传？ | **否** |

---

## 6. 下一步（须另授权 / 外部审核）

1. 将本目录交付外部独立数学审核者。  
2. 收集逐题 `PASS`/`BLOCKED` 书面结论。  
3. 064 仍须 **review → approve** 后 drawable 回 113。  
4. **勿**因材料包就绪自动上传正式插图。

---

## 7. 最终状态

```
REVIEW_PACK_READY
```

**停止。** 不得自动进入正式上传阶段。
