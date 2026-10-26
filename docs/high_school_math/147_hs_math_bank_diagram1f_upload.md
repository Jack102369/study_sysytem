# HS-MATH-BANK-DIAGRAM-1F — 四道 REQUIRED 正式插图上传与升版

> 日期：2026-10-26  
> **最终状态：`DIAGRAM_UPLOAD_PASS`**  
> 前置：1C-MIGRATION_PASS · 1E 资产定稿 · 091 新版 PNG · 064 stem cv2  
> 经由 Admin `POST …/diagrams`；**未** review/approve；**未** SQL 写插图表；**未**改题干/答案

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 上传 | 093 / 080 / 064 / 091 各 1 张 PNG · HTTP **201** |
| drawable | **112 → 109**（先 093 后退 111，全部完成后 **109**） |
| 门禁 | content_version+1 · fingerprint 变 · 旧 review stale · approved→draft |
| 鉴权读 | Admin 200 + PNG SHA 一致；无 JWT **401**；非 Admin **403** |
| review/approve | **未执行** |
| **状态** | **`DIAGRAM_UPLOAD_PASS`** |

旁证：`_g1f_diagram_upload_result.json`（093 首传）· `_g1f_diagram_upload_continue_result.json`（093 复验 + 其余三题）

---

## 2. 上传前后状态

| code | id | 前 status/cv | 后 status/cv | objectId | linkId | sort |
|------|-----|--------------|--------------|----------|--------|------|
| CAND-G1B-093 | 244 | approved / 1 | **draft / 2** | 1 | 1 | 1 |
| CAND-G1B-080 | 231 | approved / 1 | **draft / 2** | 2 | 2 | 1 |
| CAND-G1B-064 | 215 | draft / 2 | **draft / 3** | 3 | 3 | 1 |
| CAND-G1B-091 | 242 | approved / 1 | **draft / 2** | 4 | 4 | 1 |

题干/答案/解析/rubric：**未改**（仅插图关联 + 升版）。

---

## 3. 图片 SHA256（审核终版 = 入库 content_sha256）

| code | SHA256 |
|------|--------|
| 093 | `e12b2f2b2373d4545c6a79af55caa1f0c85c7d83f7b29d8a2cc5132671fe33f1` |
| 080 | `c01574e808ba150866781d4fd716348fb3331359c635ae5f1a4b46f137ef31fc` |
| 064 | `a3549131d845107b4c795242013f50beb048639b056b1c302e79276dc8b4abf7` |
| 091 | `a77867e8beb43226cd1e230b043151a00e851f560026d7882c15b0a5584f19f8`（前缀 `a77867e8beb4`） |

尺寸均为 1000×720 PNG。私有存储：`apps/api/uploads/hs-math/item-diagrams/{aa}/{sha}.bin`。

---

## 4. fingerprint 变化（review-panel）

| code | 上传前 fp | 上传后 fp |
|------|-----------|-----------|
| 093 | `1886ab0e…` | `e464af24…` |
| 080 | `b508c189…` | `2601360d…` |
| 064 | `cd2b5a86…` | `2ab277fc…` |
| 091 | `5d76a476…` | `b93e4f06…` |

旧 review 仍为历史 cv（093#54@cv1、080#50@cv1、064#46@cv1、091#73@cv1）→ 对当前版本 **stale**。

---

## 5. API 与鉴权

| 调用 | 结果 |
|------|------|
| `POST /hs-math/admin/train-items/:id/diagrams` multipart `file` | 四次 **201** |
| `GET …/diagrams/:linkId/content` + Admin JWT | **200** `image/png` · SHA 匹配 |
| 同 URL 无 JWT | **401** |
| 同 URL 非 Admin JWT | **403** |
| 公开静态直链 | **未使用**（私有 `.bin`） |

未创建学生训练 session。

---

## 6. drawable

| 时点 | 数量 |
|------|------|
| 上传前 | **112** |
| 093 成功后 | 111 |
| 四题全部完成后 | **109** |

符合预期：064 本已出池；另三道 approved→draft 暂出池。**未**为凑数改状态。

---

## 7. 未执行事项

- review API  
- approve API  
- 改题干/答案/解析  
- 上传其他题图  
- 真实 AI / 重启 / git commit  

---

## 8. 后续（须另授权）

1. 四题人工 **review passed**（各自当前 cv + 新 fingerprint）。  
2. **approve**（confirmPublish）→ drawable 回升至含此四题。  
3. 可选：学生端开训验证 session 插图快照（另任务）。  
4. **勿**自动 review/approve。

---

## 9. 最终状态

```
DIAGRAM_UPLOAD_PASS
```

**停止。** 不得自动进入下一阶段。
