# 工业装置图设计说明（STEP_13）

**更新：** 2026-10-29 11:28:24 +08:00（PHASE_A：HTTP + 双图）

## 原则

- 独立协议 `IndustrialApparatusDefinition` / `IndustrialApparatusPublic`（与流程图语义分离）
- AI 只出结构化 JSON；程序渲染 SVG；禁止任意 SVG 注入
- Public 白名单投影；不泄漏 internal / review / answer
- 教学 **schematic**，非工程施工图
- 资源复用 D043：`asset_type=industrial_apparatus_svg`（已预留）；不新建平行资源表

## AI 生成路径

| 路径 | 函数 | formal |
|------|------|--------|
| Mock | `generateIndustrialApparatusCandidateWithMock` | `development_only` + 阻断 formal |
| HTTP | `generateIndustrialApparatusCandidateWithHttp` | `ai_generated`；仍需质检+人审；无密钥 → `AI_UNAVAILABLE` |

两者均落盘 **双图**：流程占位 SVG（主）+ 装置 SVG（副，`apparatusSvg*` 字段）。

## Schema

- `schemaVersion` = `1.0`
- 组件：`componentId/type/displayLabel/ports/paramLabels/internal`
- 连接：`source/target` 组件+端口、`flowType`（gas/liquid/solid/coolant/heat/waste_gas）
- 哈希：`apparatusContentHash` / `publicContentHash`

## 设备类型（第一批）

reaction_vessel, gas_generator, heater, cooler, condenser, filter, distillation_unit, gas_washing_bottle, drying_tube, gas_collector, tail_gas_absorber, liquid_tank, solid_liquid_separator, pipe, valve, temperature_sensor, pressure_sensor, pressure_relief

不支持类型 → `UNSUPPORTED_COMPONENT_TYPE`，不生成伪图。

## 端口目录

见 `industrial-apparatus.ports.ts`：方向、介质、必要性、maxConnections。

## 渲染

`renderIndustrialApparatusSvg(public)` → 确定性 SVG；洗气瓶/冷凝器/蒸馏釜等可识别图元。

## 样例

`docs/chemistry_industrial_experiment/apparatus_samples/`

## 相关决策

D047（装置协议独立 + 复用 D043/D045 资源与会话快照）
