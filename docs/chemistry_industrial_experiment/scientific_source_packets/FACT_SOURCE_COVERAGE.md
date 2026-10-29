# FACT_SOURCE_COVERAGE

覆盖状态含义：

- **SUPPORTED_BY_ACCESSED_SOURCE**：已打开来源正文含相关依据（仍 ≠ verified_by_admin）
- **PARTIALLY_SUPPORTED**：部分相关
- **SOURCE_FOUND_NOT_ACCESSED**：有 URL 但本环境未成功打开
- **UNSUPPORTED**：尚无可用访问证据
- **NEEDS_HUMAN_VERIFICATION**：必须管理员本人判断

| factId | 覆盖 | 主要 sourceId | 说明 |
|--------|------|---------------|------|
| SALT-F01 | PARTIALLY_SUPPORTED | SRC_JSNT_LABLIST, SRC_ZUST_NACL | 目录证实验存在；ZUST 述粗盐含泥沙等 |
| SALT-F02 | PARTIALLY_SUPPORTED | SRC_JSNT_LABLIST | 仅「粗盐提纯」条目；步骤细节靠 ZUST/失败来源摘要 |
| SALT-F03 | **SUPPORTED_BY_ACCESSED_SOURCE** | SRC_ZUST_NACL | 明确：不溶杂质溶解后**过滤**除去 |
| SALT-F04 | **SUPPORTED_BY_ACCESSED_SOURCE** | SRC_ZUST_NACL | 可溶杂质需另加试剂沉淀；对照案例「未覆盖化学除杂」 |
| SALT-F05 | SUPPORTED_BY_ACCESSED_SOURCE | SRC_ZUST_NACL | 高校流程含化学除杂 → 反证教学简化合理 |
| SALT-F06 | NEEDS_HUMAN_VERIFICATION | — | 校规/实验室安全，外部网页弱支撑 |
| SALT-F07 | PARTIALLY_SUPPORTED | SRC_JSNT_LABLIST | 高一必修实验目录含粗盐提纯 |
| GAS-F01 | PARTIALLY_SUPPORTED | — | 主要依案例/装置 Definition；外部洗气专题本环境访问失败 |
| GAS-F02 | SOURCE_FOUND_NOT_ACCESSED | SRC_SZ_CO2_TEACHER | 搜索摘要有长进短出；**504 未读正文** |
| GAS-F03 | NEEDS_HUMAN_VERIFICATION | — | 安全通识；无本环境成功抓取专项页 |
| GAS-F04 | NEEDS_HUMAN_VERIFICATION | — | 案例已标 unknown；保持 |
| GAS-F05 | SUPPORTED_BY_ACCESSED_SOURCE | （案例 fixture） | 仓库事实；外部不必强证「未指定」 |
| GAS-F06 | SUPPORTED_BY_ACCESSED_SOURCE | （案例 fixture） | schematic 声明 |
| SEA-F01 | **SUPPORTED_BY_ACCESSED_SOURCE** | SRC_SDUT_SEAWATER | 蒸发池→结晶池→粗盐/母液 |
| SEA-F02 | SUPPORTED_BY_ACCESSED_SOURCE | SRC_SDUT_SEAWATER | 饱和溶液再晒析出食盐 |
| SEA-F03 | SUPPORTED_BY_ACCESSED_SOURCE | SRC_SDUT_SEAWATER | 母液可提其他原料 → 简化合理 |
| SEA-F04 | SUPPORTED_BY_ACCESSED_SOURCE | （案例 steps）+ SDUT 晒盐链路无「过滤」主线 | 与 B4 答案「结晶」一致 |
| SEA-F05 | NEEDS_HUMAN_VERIFICATION | — | — |

## 汇总

| 状态 | 约计 |
|------|------|
| SUPPORTED_BY_ACCESSED_SOURCE | 8 |
| PARTIALLY_SUPPORTED | 4 |
| SOURCE_FOUND_NOT_ACCESSED | 1 |
| NEEDS_HUMAN_VERIFICATION | 5 |
| CONTRADICTED | 0 |

**注意：** 洗气案例外部证据最弱 → 管理员须补教材/实验册原文。
