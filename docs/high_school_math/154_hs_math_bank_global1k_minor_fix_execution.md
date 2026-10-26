# HS-MATH-BANK-GLOBAL-1K-FIX-EXEC — 022 / 093 MINOR 正式修订

> 日期：2026-10-26  
> **最终状态：`MINOR_FIX_EXEC_PASS`**  
> 前置：153 `MINOR_FIX_PLAN_READY`  
> 经由 Admin `PATCH /hs-math/admin/train-items/:id`；**未** review/approve；**未**动插图

旁证：`_g1k_minor_fix_exec_result.json`

---

## 1. 结论摘要

| 项 | 结果 |
|----|------|
| 022 | rubric 已替换 · **approved→draft** · **cv1→2** · fp 已变 |
| 093 | analysis 已替换 · **approved→draft** · **cv2→3** · fp 已变 |
| 093 插图 SHA | **不变** `e12b2f2b2373d454…fe33f1` |
| drawable | **113 → 111** |
| review / approve | **未执行**（确认） |
| 其他 CAND 题 | 其余 approved CAND 仍为 **98**（未扩改） |
| **状态** | **`MINOR_FIX_EXEC_PASS`** |

---

## 2. 执行前核验（与 153 一致）

| code | id | status/cv | 要点 |
|------|-----|-----------|------|
| 022 | 173 | approved/1 | 旧 rubric keys=`s`,`m`（`s` 抄题干） |
| 093 | 244 | approved/2 | 短解析；图 1 张 SHA 匹配 |
| drawable | | **113** | |

指纹前缀：022 `9a8980a8…` · 093 `e464af24…`。有效 review 存在于旧 cv。

---

## 3. API 调用

| 题 | 方法 | body 要点 | HTTP |
|----|------|-----------|------|
| 022 | `PATCH …/train-items/173` | `answerPayloadJson`（全量 application：kind/maxScore/standardAnswer + 新 rubric）· `expectedContentVersion=1` | **200** |
| 093 | `PATCH …/train-items/244` | 仅 `analysis` · `expectedContentVersion=2` | **200** |

Admin：`userId=2`。

---

## 4. 022 差异

| 字段 | 前 | 后 |
|------|----|----|
| status | approved | **draft** |
| contentVersion | 1 | **2** |
| fingerprint | `9a8980a8…918c6ea3` | `d89ca50f…60579935` |
| rubric | s(3)+m(5) | **proc(3)+m(5)** |
| standardAnswer / stem / analysis / difficulty | — | **未变** |
| 当前 cv 上 passed review | 有（旧#36@cv1） | **无**（旧审 stale） |

新 rubric criteria：过程须推出 \(x=5\)（禁止仅抄 \(S(x)=x(10-x)\)）；结果 \(S_{\max}=25\)。

022 完成后瞬时 drawable=**112**。

---

## 5. 093 差异

| 字段 | 前 | 后 |
|------|----|----|
| status | approved | **draft** |
| contentVersion | 2 | **3** |
| fingerprint | `e464af24…8c781375` | `67e3fd86…341066d0` |
| analysis | 无点积展开 | **含** \(\overrightarrow{BD_1}=(-1,1,1)\) 等及两组点积 \(=0\) |
| stem / answer / rubric | — | **未变** |
| diagrams | 1 · SHA `e12b2f2b…` | **1 · 同 SHA** |
| 当前 cv 上 passed review | 有（#134@cv2） | **无**（stale） |

---

## 6. 门禁与未执行项

- 旧 review 对当前版本 **失效**（无当前 cv 的 passed）。  
- **未**调用 `POST …/reviews`、**未** `PATCH …/status` approve。  
- **未** SQL 改状态；**未**改其他题；**未**上传/删图。

---

## 7. 完成后状态

| code | status / cv | 下一步 |
|------|-------------|--------|
| 022 | draft / **2** | 须另授权：review → approve |
| 093 | draft / **3** | 同上；保留图 |
| drawable | **111** | 两题均 approve 后预期回 **113** |

---

## 8. 状态

**`MINOR_FIX_EXEC_PASS`**

完成后停止。不得自动 review/approve，不得进入第二批导入。
