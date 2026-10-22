# 高一化学 · 本地规则出题器阶段 A 报告

> 完成时间：2026-10-19  
> 范围：管理员预览确认 + substance/knowledge/reaction 等安全模板扩充  
> **未**调用 DeepSeek；**未**改 377 条知识正文/审核状态；**未**写入正式题池

---

## 1. 扩充前 / 后题库数量

| 指标 | 扩充前 | 扩充后 |
|------|--------|--------|
| 题库总数 | **94** | **594** |
| 正式池 formal | **0** | **0** |
| 测试池可用（active） | **94** | **576** |
| AI 试运行 `train.ai_trial.pa.*` | 0 | **500** |
| 旧 seed `train.test.*`（仍可用） | 9 | **9** |
| filler `train.ai_trial.cov.*` 仍激活 | 18 | **0**（行保留，`is_active=0`） |

- **新增题目：500**（两轮管理员确认写入：300 + 200）  
- 历史训练会话 / 答题记录：未删除任何 `chem_train_items` 行（filler 仅停用）

---

## 2. 新增能力与模板

### 管理端

| 入口 | 说明 |
|------|------|
| Web | 设置 → **化学出题器** `/settings/chemistry-generator` |
| API | `GET/POST /chemistry/admin/train-generator/{meta,utilization,preview,confirm}`（ADMIN） |
| CLI | `pnpm chem:gen-phase-a -- --preview` / `--apply --confirm --target=N` |

流程：**预览（题干/选项/答案/来源/难度/分类/跳过原因）→ 明确确认 → 才写库**。

### 安全限制（替代固定 80）

- 单次确认上限 **500**
- 目标题量由管理员配置；候选不足时**不复制凑数**
- 去重：题干规范化、同知识同模板角度、`contentFingerprint`（选项顺序无关）
- 分类不存在则跳过，**禁止随意挂靠**
- **不再生成** specialty_cover_filler

### 新增/强化模板（节选）

| 模板 ID | 知识类型 | 题型 | 难度 |
|---------|----------|------|------|
| `sub_formula_blank` | substance | blank，`answer_type=chem_formula` | 1 |
| `sub_formula_single` | substance | single | 1 |
| `sub_color_judge` / `sub_uses_judge` / `sub_chem_prop_judge` / `sub_common_name_judge` | substance | judge | 1–2 |
| `kp_fact_judge` / `kp_misconception_judge` / `kp_term_blank` | knowledge | judge/blank | 1–2 |
| `rxn_cond_judge` / `rxn_eq_identify` / `rxn_is_redox_judge` / `rxn_oxidant_single` / `rxn_reductant_single` / `rxn_phenomenon_judge` | reaction | judge/single | 1–2 |
| `el_symbol_*` / `el_z_blank` | element | blank/single | 1 |
| concept / formula / experiment 安全子集 | 同上 | 混合 | 1–2 |

化学式填空统一 `answer_type=chem_formula`（H2O≡H₂O；h2o 判错）；**不**把方程式当作化学式填空。

---

## 3. 239 条知识利用率

| 类型 | 扩充前已用 | 扩充后已用 | 白名单总数 |
|------|------------|------------|------------|
| substance | **0** | **24** | 24 |
| knowledge | **3** | **72** | 74 |
| reaction | **11** | **49** | 59 |
| element | 12 | **22** | 24 |
| concept | 3 | 3 | 21 |
| formula | 2 | 2 | 10 |
| experiment | 1 | 1 | 27 |
| **合计** | **32** | **173** | **239** |

利用率：13.4% → **72.4%**。

---

## 4. 专项 / 分类 / 难度 / 题型（测试池 active）

### 一级专项（12/12 有题）

| 专项 | 题量 |
|------|------|
| equation | 220 |
| redox | 111 |
| substance | 92 |
| memory | 68 |
| periodic | 21 |
| comprehensive | 20 |
| ion | 18 |
| calculation | 8 |
| experiment | 7 |
| organic | 6 |
| structure | 3 |
| inference | 2 |

### 二级分类

- 有题分类：**35** / 137（空分类保持空，未 filler 伪造）

### 难度

| 难度 | 题量 |
|------|------|
| 1 基础 | **409** |
| 2 提高 | **167** |
| 3 挑战 | **0**（阶段 A 未生成） |

### 题型

| 题型 | 题量 |
|------|------|
| judge | 345 |
| single | 158 |
| blank | 73（其中 chem_formula **24**） |

---

## 5. 去重与质量

| 检查 | 结果 |
|------|------|
| active 题干完全重复 | **0** |
| 同知识同角度重复写入 | 由稳定 code `train.ai_trial.pa.{template}.{source}` 幂等阻止 |
| 仅调换选项顺序 | fingerprint 排序选项文本，不计新题 |
| filler | 停用 18 道，未删除 |
| 自动质检失败 | 预览时记入 skipped（选项重复/答案键无效/化学式疑似方程等） |

跳过原因样例见：  
`docs/chemistry_trial_restore/local_generator_phase_a/phase_a_preview.json`

典型跳过：FIX/NEEDS_FIX、conditions 不明、无「易错」句、歧义有机/KMnO4 限制、分类不存在、同角度已存在。

---

## 6. 仍未覆盖的知识（摘要）

| 类型 | 未用约数 | 说明 |
|------|----------|------|
| reaction | ~10 | 多为 FIX 跳过或字段不足 |
| knowledge | ~2 | 首句/易错无法安全抽取 |
| element | ~2 | 字段或去重边界 |
| concept / formula / experiment | 多数 | 阶段 A 仅安全子集；留给阶段 B |

---

## 7. 验收对照

| 项 | 结果 |
|----|------|
| 管理员可选专项/分类/题型/难度/题量 | ✅ |
| 预览含题干/答案/来源/跳过原因 | ✅ |
| 确认后才写库 | ✅ |
| 生成超过 80 道试运行题 | ✅ 500 |
| substance/knowledge/reaction 利用率明显提高 | ✅ 24/72/49 |
| 不再依赖 filler | ✅ cov 全停用 |
| 无明显题干重复 | ✅ |
| 原 9 道测试题保留 | ✅ |
| 普通学生不可访问试运行池 | ✅（既有 ACL 未改） |
| 377 知识正文/审核状态不变 | ✅ |
| 化学式填空 `chem_formula` | ✅ 24 道 |

---

## 8. 是否具备进入阶段 B 的条件

**基本具备**，建议阶段 B 再做：

1. concept / formula / experiment 更细模板与计算参数化  
2. 提高题更多「条件比较 / 多知识关联」  
3. 挑战题（仅字段充分时）  
4. 空分类的**真实映射**（仍禁止 filler）  
5. 管理页批量按专项补洞与利用率仪表盘增强  

**现阶段不要**进入 OCR / AI 出题 / 正式池自动发布。

---

## 9. 关键路径

| 路径 | 用途 |
|------|------|
| `apps/api/src/chemistry/train/generator/*` | 生成器核心 + Admin API |
| `apps/web/src/views/settings/chemistry/ChemistryTrainGeneratorView.vue` | 管理页 |
| `docs/chemistry_trial_restore/local_generator_phase_a/` | 预览/写入结果 JSON |
| `pnpm chem:gen-phase-a`（apps/api） | CLI 预览/确认 |
