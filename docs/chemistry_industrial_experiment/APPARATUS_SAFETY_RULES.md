# 工业装置安全规则说明（STEP_13）

**更新：** 2026-10-29 11:07:36 +08:00

实现：`industrial-apparatus-safety.ts`  
原则：**unknown ≠ pass**；规则有适用范围与局限。

| 规则 ID | 范围 | 判定 | 局限 |
|---------|------|------|------|
| WASH_BOTTLE_IO | 洗气瓶 | 进出气管须均有连接 | 不验证浸没深度 |
| CONDENSER_PORTS | 冷凝器 | 蒸气/液体/冷却水端口齐全 | — |
| CONDENSER_COUNTERFLOW | 冷凝器 | 严格逆流 → **unknown** | 需几何信息 |
| HARMFUL_TAIL_GAS | 有害尾气标签 | 无吸收装置 → fail | 标签启发式 |
| TAIL_GAS_NEED | 气体发生无吸收 | **unknown** | 取决于气体性质 |
| SIPHON_RISK | 发生器直连吸收/收集 | fail/unknown | 示意拓扑 |
| CLOSED_HEATING | 加热+反应容器无泄压 | fail/unknown | 示意 |
| FLAMMABLE_NEAR_HEAT | 易燃气体+加热 | **unknown** | 无法判定间距 |

故意错误样例（`intentionallyInvalid`）禁止正式发布。
