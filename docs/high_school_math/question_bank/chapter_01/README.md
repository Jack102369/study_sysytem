# 第一章题库（P1-0E / P1-0F-A）

教材：人教A版 · 普通高中数学必修第一册 · **集合与常用逻辑用语**

`specialtyCode`：`rja-ch1`

## 权威数据源（唯一维护入口）

**只允许修改：**

`apps/api/src/hs-math/util/hs-math-p1-0e-bank-items.ts`

下列文件均为**生成物**，禁止手工分头改造成不一致：

- 五个小节 JSON
- `chapter_01_all.json`
- `review_checklist.md`
- `review_book.md`
- `review_issues.md`（问题清单可由脚本重写；OPEN 说明可保留在文档中）

### 同步命令

```bash
pnpm --filter api run hs-math:p1-0e-check
pnpm --filter api run hs-math:p1-0fa-verify
```

1. `hs-math:p1-0e-check`：结构/协议校验，并写出全部导入用 JSON。  
2. `hs-math:p1-0fa-verify`：独立数学复核，并写出审核册/清单/问题清单。

## 文件一览

| 文件 | 说明 |
|------|------|
| `01_sets_concept.json` … `05_quantifiers.json` | 分小节导入 JSON（生成） |
| `chapter_01_all.json` | 80 题聚合（生成） |
| `review_book.md` | 人工审核册（生成） |
| `review_checklist.md` | 逐题复核表（生成） |
| `review_issues.md` | 问题与 OPEN 项（生成） |

正式 code：`HSMA-RJA-CH01-0001` … `HSMA-RJA-CH01-0080`

## 约束

- P1-0F-A **不写库**、不调用 confirm、不批准。
- 人工审核状态保持 **PENDING**。
- 结构/机器逻辑复核 PASS ≠ 人工 APPROVED。
