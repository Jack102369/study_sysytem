import {
  INDUSTRIAL_APPARATUS_PROTOCOL_VERSION,
  INDUSTRIAL_APPARATUS_SCHEMA_VERSION,
} from './industrial-apparatus.constants'
import { computeApparatusContentHash } from './industrial-apparatus.hash'
import type { IndustrialApparatusDefinition } from './industrial-apparatus.types'
import { ALL_CANDIDATE_CASES } from './industrial-case.fixtures'

const DISCLAIMER = '教学示意装置图（schematic），非工程施工图'

function finalize(
  draft: Omit<IndustrialApparatusDefinition, 'apparatusContentHash'>,
): IndustrialApparatusDefinition {
  const apparatusContentHash = computeApparatusContentHash(draft)
  return { ...draft, apparatusContentHash }
}

function caseMeta() {
  const c = ALL_CANDIDATE_CASES[0]
  return {
    caseCode: c?.caseCode || 'salt_purification_basic',
    caseVersion: c?.version || '1.0.0',
    caseContentHash: c?.contentHash || '0'.repeat(64),
  }
}

const meta = caseMeta()

/** 1 气体发生→净化→收集 */
export const APP_GAS_PURIFY_COLLECT = finalize({
  schemaVersion: INDUSTRIAL_APPARATUS_SCHEMA_VERSION,
  apparatusId: 'app_gas_purify_collect',
  ...meta,
  apparatusVersion: INDUSTRIAL_APPARATUS_PROTOCOL_VERSION,
  title: '气体发生-净化-收集',
  orientation: 'left_to_right',
  schematicDisclaimer: DISCLAIMER,
  reviewMetadata: { chemicallyReviewed: false, schematicOnly: true },
  components: [
    {
      componentId: 'gen1',
      componentType: 'gas_generator',
      displayLabel: '气体发生器',
      ports: [
        { portId: 'reagent_in', direction: 'in', media: ['liquid', 'solid'] },
        { portId: 'gas_out', direction: 'out', media: ['gas'] },
      ],
      internal: {},
    },
    {
      componentId: 'wash1',
      componentType: 'gas_washing_bottle',
      displayLabel: '洗气瓶',
      ports: [
        { portId: 'gas_in', direction: 'in', media: ['gas', 'waste_gas'] },
        { portId: 'gas_out', direction: 'out', media: ['gas', 'waste_gas'] },
      ],
      internal: {},
    },
    {
      componentId: 'collect1',
      componentType: 'gas_collector',
      displayLabel: '集气瓶',
      ports: [{ portId: 'gas_in', direction: 'in', media: ['gas'] }],
      internal: {},
    },
  ],
  connections: [
    {
      connectionId: 'c1',
      sourceComponentId: 'gen1',
      sourcePortId: 'gas_out',
      targetComponentId: 'wash1',
      targetPortId: 'gas_in',
      flowType: 'gas',
      displayLabel: '粗气',
    },
    {
      connectionId: 'c2',
      sourceComponentId: 'wash1',
      sourcePortId: 'gas_out',
      targetComponentId: 'collect1',
      targetPortId: 'gas_in',
      flowType: 'gas',
      displayLabel: '净气',
    },
  ],
})

/** 2 气体发生→净化→尾气 */
export const APP_GAS_PURIFY_TAIL = finalize({
  ...APP_GAS_PURIFY_COLLECT,
  apparatusId: 'app_gas_purify_tail',
  title: '气体发生-净化-尾气吸收(HCl示意)',
  components: [
    ...APP_GAS_PURIFY_COLLECT.components.filter((c) => c.componentId !== 'collect1'),
    {
      componentId: 'abs1',
      componentType: 'tail_gas_absorber',
      displayLabel: 'HCl尾气吸收',
      ports: [{ portId: 'gas_in', direction: 'in', media: ['gas', 'waste_gas'] }],
      internal: {},
    },
  ],
  connections: [
    APP_GAS_PURIFY_COLLECT.connections[0],
    {
      connectionId: 'c2t',
      sourceComponentId: 'wash1',
      sourcePortId: 'gas_out',
      targetComponentId: 'abs1',
      targetPortId: 'gas_in',
      flowType: 'waste_gas',
      displayLabel: 'HCl尾气',
    },
  ],
})

/** 3 加热反应→冷凝→收集 */
export const APP_HEAT_CONDENSE = finalize({
  schemaVersion: INDUSTRIAL_APPARATUS_SCHEMA_VERSION,
  apparatusId: 'app_heat_condense',
  ...meta,
  apparatusVersion: INDUSTRIAL_APPARATUS_PROTOCOL_VERSION,
  title: '加热反应-冷凝-收集',
  orientation: 'left_to_right',
  schematicDisclaimer: DISCLAIMER,
  reviewMetadata: { chemicallyReviewed: false, schematicOnly: true },
  components: [
    {
      componentId: 'heat1',
      componentType: 'heater',
      displayLabel: '加热',
      ports: [{ portId: 'heat_out', direction: 'out', media: ['heat'] }],
      internal: {},
    },
    {
      componentId: 'rv1',
      componentType: 'reaction_vessel',
      displayLabel: '反应瓶',
      ports: [
        { portId: 'feed_in', direction: 'in', media: ['liquid', 'gas', 'solid'] },
        { portId: 'heat_in', direction: 'in', media: ['heat'] },
        { portId: 'product_out', direction: 'out', media: ['liquid', 'gas'] },
        { portId: 'vent', direction: 'out', media: ['gas', 'waste_gas'] },
      ],
      internal: {},
    },
    {
      componentId: 'cond1',
      componentType: 'condenser',
      displayLabel: '冷凝管',
      ports: [
        { portId: 'vapor_in', direction: 'in', media: ['gas'] },
        { portId: 'liquid_out', direction: 'out', media: ['liquid'] },
        { portId: 'coolant_in', direction: 'in', media: ['coolant', 'liquid'] },
        { portId: 'coolant_out', direction: 'out', media: ['coolant', 'liquid'] },
      ],
      internal: {},
    },
    {
      componentId: 'tank1',
      componentType: 'liquid_tank',
      displayLabel: '接收瓶',
      ports: [
        { portId: 'liquid_in', direction: 'in', media: ['liquid'] },
        { portId: 'liquid_out', direction: 'out', media: ['liquid'] },
      ],
      internal: {},
    },
    {
      componentId: 'coolsrc',
      componentType: 'cooler',
      displayLabel: '冷却水入口侧',
      ports: [
        { portId: 'coolant_in', direction: 'in', media: ['coolant', 'liquid'] },
        { portId: 'coolant_out', direction: 'out', media: ['coolant', 'liquid'] },
        { portId: 'process_in', direction: 'in', media: ['gas', 'liquid'] },
        { portId: 'process_out', direction: 'out', media: ['gas', 'liquid'] },
      ],
      internal: {},
    },
  ],
  connections: [
    {
      connectionId: 'h1',
      sourceComponentId: 'heat1',
      sourcePortId: 'heat_out',
      targetComponentId: 'rv1',
      targetPortId: 'heat_in',
      flowType: 'heat',
    },
    {
      connectionId: 'v1',
      sourceComponentId: 'rv1',
      sourcePortId: 'product_out',
      targetComponentId: 'cond1',
      targetPortId: 'vapor_in',
      flowType: 'gas',
      displayLabel: '蒸气',
    },
    {
      connectionId: 'l1',
      sourceComponentId: 'cond1',
      sourcePortId: 'liquid_out',
      targetComponentId: 'tank1',
      targetPortId: 'liquid_in',
      flowType: 'liquid',
    },
    {
      connectionId: 'cw_in',
      sourceComponentId: 'coolsrc',
      sourcePortId: 'coolant_out',
      targetComponentId: 'cond1',
      targetPortId: 'coolant_in',
      flowType: 'coolant',
      displayLabel: '冷却水进',
    },
    {
      connectionId: 'cw_out',
      sourceComponentId: 'cond1',
      sourcePortId: 'coolant_out',
      targetComponentId: 'coolsrc',
      targetPortId: 'coolant_in',
      flowType: 'coolant',
      displayLabel: '冷却水出',
    },
  ],
})

/** 4 蒸馏 */
export const APP_DISTILL = finalize({
  schemaVersion: INDUSTRIAL_APPARATUS_SCHEMA_VERSION,
  apparatusId: 'app_distill',
  ...meta,
  apparatusVersion: INDUSTRIAL_APPARATUS_PROTOCOL_VERSION,
  title: '蒸馏-冷凝-产品收集',
  orientation: 'left_to_right',
  schematicDisclaimer: DISCLAIMER,
  reviewMetadata: { chemicallyReviewed: false, schematicOnly: true },
  components: [
    {
      componentId: 'dist1',
      componentType: 'distillation_unit',
      displayLabel: '蒸馏釜',
      ports: [
        { portId: 'feed_in', direction: 'in', media: ['liquid'] },
        { portId: 'vapor_out', direction: 'out', media: ['gas'] },
        { portId: 'residue_out', direction: 'out', media: ['liquid'] },
      ],
      internal: {},
    },
    {
      componentId: 'cond1',
      componentType: 'condenser',
      displayLabel: '冷凝器',
      ports: [
        { portId: 'vapor_in', direction: 'in', media: ['gas'] },
        { portId: 'liquid_out', direction: 'out', media: ['liquid'] },
        { portId: 'coolant_in', direction: 'in', media: ['coolant', 'liquid'] },
        { portId: 'coolant_out', direction: 'out', media: ['coolant', 'liquid'] },
      ],
      internal: {},
    },
    {
      componentId: 'prod',
      componentType: 'liquid_tank',
      displayLabel: '馏出液',
      ports: [
        { portId: 'liquid_in', direction: 'in', media: ['liquid'] },
        { portId: 'liquid_out', direction: 'out', media: ['liquid'] },
      ],
      internal: {},
    },
    {
      componentId: 'coolsrc',
      componentType: 'cooler',
      displayLabel: '冷却回路',
      ports: [
        { portId: 'coolant_in', direction: 'in', media: ['coolant', 'liquid'] },
        { portId: 'coolant_out', direction: 'out', media: ['coolant', 'liquid'] },
        { portId: 'process_in', direction: 'in', media: ['gas', 'liquid'] },
        { portId: 'process_out', direction: 'out', media: ['gas', 'liquid'] },
      ],
      internal: {},
    },
  ],
  connections: [
    {
      connectionId: 'd1',
      sourceComponentId: 'dist1',
      sourcePortId: 'vapor_out',
      targetComponentId: 'cond1',
      targetPortId: 'vapor_in',
      flowType: 'gas',
    },
    {
      connectionId: 'd2',
      sourceComponentId: 'cond1',
      sourcePortId: 'liquid_out',
      targetComponentId: 'prod',
      targetPortId: 'liquid_in',
      flowType: 'liquid',
    },
    {
      connectionId: 'cw1',
      sourceComponentId: 'coolsrc',
      sourcePortId: 'coolant_out',
      targetComponentId: 'cond1',
      targetPortId: 'coolant_in',
      flowType: 'coolant',
    },
    {
      connectionId: 'cw2',
      sourceComponentId: 'cond1',
      sourcePortId: 'coolant_out',
      targetComponentId: 'coolsrc',
      targetPortId: 'coolant_in',
      flowType: 'coolant',
    },
  ],
})

/** 5 过滤 */
export const APP_FILTER = finalize({
  schemaVersion: INDUSTRIAL_APPARATUS_SCHEMA_VERSION,
  apparatusId: 'app_filter_wash',
  ...meta,
  apparatusVersion: INDUSTRIAL_APPARATUS_PROTOCOL_VERSION,
  title: '过滤-洗涤-产品',
  orientation: 'left_to_right',
  schematicDisclaimer: DISCLAIMER,
  reviewMetadata: { chemicallyReviewed: false, schematicOnly: true },
  components: [
    {
      componentId: 'f1',
      componentType: 'filter',
      displayLabel: '过滤器',
      ports: [
        { portId: 'slurry_in', direction: 'in', media: ['liquid', 'solid'] },
        { portId: 'filtrate_out', direction: 'out', media: ['liquid'] },
        { portId: 'cake_out', direction: 'out', media: ['solid'] },
      ],
      internal: {},
    },
    {
      componentId: 'filtrate',
      componentType: 'liquid_tank',
      displayLabel: '滤液',
      ports: [
        { portId: 'liquid_in', direction: 'in', media: ['liquid'] },
        { portId: 'liquid_out', direction: 'out', media: ['liquid'] },
      ],
      internal: {},
    },
  ],
  connections: [
    {
      connectionId: 'f1c',
      sourceComponentId: 'f1',
      sourcePortId: 'filtrate_out',
      targetComponentId: 'filtrate',
      targetPortId: 'liquid_in',
      flowType: 'liquid',
    },
  ],
})

/** 6 带阀门仪表 */
export const APP_VALVE_SENSOR = finalize({
  schemaVersion: INDUSTRIAL_APPARATUS_SCHEMA_VERSION,
  apparatusId: 'app_valve_sensor',
  ...meta,
  apparatusVersion: INDUSTRIAL_APPARATUS_PROTOCOL_VERSION,
  title: '阀门与检测仪表示意',
  orientation: 'left_to_right',
  schematicDisclaimer: DISCLAIMER,
  reviewMetadata: { chemicallyReviewed: false, schematicOnly: true },
  components: [
    {
      componentId: 'tank',
      componentType: 'liquid_tank',
      displayLabel: '储罐',
      ports: [
        { portId: 'liquid_in', direction: 'in', media: ['liquid'] },
        { portId: 'liquid_out', direction: 'out', media: ['liquid'] },
      ],
      internal: {},
    },
    {
      componentId: 'v1',
      componentType: 'valve',
      displayLabel: '阀门',
      ports: [
        { portId: 'a', direction: 'bidirectional', media: ['gas', 'liquid', 'coolant'] },
        { portId: 'b', direction: 'bidirectional', media: ['gas', 'liquid', 'coolant'] },
      ],
      internal: {},
    },
    {
      componentId: 't1',
      componentType: 'temperature_sensor',
      displayLabel: '温度计',
      ports: [
        { portId: 'sense', direction: 'in', media: ['heat', 'liquid', 'gas'] },
      ],
      internal: {},
    },
  ],
  connections: [
    {
      connectionId: 'p1',
      sourceComponentId: 'tank',
      sourcePortId: 'liquid_out',
      targetComponentId: 'v1',
      targetPortId: 'a',
      flowType: 'liquid',
    },
  ],
})

/** 8 故意错误连接：洗气进出反接 */
export const APP_INVALID_WASH = finalize({
  schemaVersion: INDUSTRIAL_APPARATUS_SCHEMA_VERSION,
  apparatusId: 'app_invalid_wash',
  ...meta,
  apparatusVersion: INDUSTRIAL_APPARATUS_PROTOCOL_VERSION,
  title: '错误样例：洗气瓶未完整连接',
  orientation: 'left_to_right',
  schematicDisclaimer: DISCLAIMER,
  intentionallyInvalid: true,
  reviewMetadata: { chemicallyReviewed: false, schematicOnly: true, notes: 'invalid teaching counterexample' },
  components: [
    {
      componentId: 'gen1',
      componentType: 'gas_generator',
      displayLabel: '发生器',
      ports: [
        { portId: 'reagent_in', direction: 'in', media: ['liquid', 'solid'] },
        { portId: 'gas_out', direction: 'out', media: ['gas'] },
      ],
      internal: {},
    },
    {
      componentId: 'wash1',
      componentType: 'gas_washing_bottle',
      displayLabel: '洗气瓶',
      ports: [
        { portId: 'gas_in', direction: 'in', media: ['gas', 'waste_gas'] },
        { portId: 'gas_out', direction: 'out', media: ['gas', 'waste_gas'] },
      ],
      internal: {},
    },
  ],
  connections: [],
})

/** 9 倒吸风险 */
export const APP_SIPHON_RISK = finalize({
  schemaVersion: INDUSTRIAL_APPARATUS_SCHEMA_VERSION,
  apparatusId: 'app_siphon_risk',
  ...meta,
  apparatusVersion: INDUSTRIAL_APPARATUS_PROTOCOL_VERSION,
  title: '倒吸风险示意（错误样例）',
  orientation: 'left_to_right',
  schematicDisclaimer: DISCLAIMER,
  intentionallyInvalid: true,
  reviewMetadata: { chemicallyReviewed: false, schematicOnly: true, notes: 'invalid' },
  components: [
    {
      componentId: 'gen1',
      componentType: 'gas_generator',
      displayLabel: '发生器',
      ports: [
        { portId: 'reagent_in', direction: 'in', media: ['liquid', 'solid'] },
        { portId: 'gas_out', direction: 'out', media: ['gas'] },
      ],
      internal: {},
    },
    {
      componentId: 'abs1',
      componentType: 'tail_gas_absorber',
      displayLabel: '吸收瓶',
      ports: [{ portId: 'gas_in', direction: 'in', media: ['gas', 'waste_gas'] }],
      internal: {},
    },
  ],
  connections: [
    {
      connectionId: 'bad',
      sourceComponentId: 'gen1',
      sourcePortId: 'gas_out',
      targetComponentId: 'abs1',
      targetPortId: 'gas_in',
      flowType: 'gas',
    },
  ],
})

/** 10 密闭加热风险 */
export const APP_CLOSED_HEAT = finalize({
  schemaVersion: INDUSTRIAL_APPARATUS_SCHEMA_VERSION,
  apparatusId: 'app_closed_heat',
  ...meta,
  apparatusVersion: INDUSTRIAL_APPARATUS_PROTOCOL_VERSION,
  title: '密闭加热风险示意（错误样例）',
  orientation: 'left_to_right',
  schematicDisclaimer: DISCLAIMER,
  intentionallyInvalid: true,
  reviewMetadata: { chemicallyReviewed: false, schematicOnly: true, notes: 'invalid' },
  components: [
    {
      componentId: 'heat1',
      componentType: 'heater',
      displayLabel: '加热',
      ports: [{ portId: 'heat_out', direction: 'out', media: ['heat'] }],
      internal: {},
    },
    {
      componentId: 'rv1',
      componentType: 'reaction_vessel',
      displayLabel: '密闭反应瓶',
      ports: [
        { portId: 'feed_in', direction: 'in', media: ['liquid', 'gas', 'solid'] },
        { portId: 'heat_in', direction: 'in', media: ['heat'] },
        { portId: 'product_out', direction: 'out', media: ['liquid', 'gas'] },
        { portId: 'vent', direction: 'out', media: ['gas', 'waste_gas'] },
      ],
      internal: {},
    },
  ],
  connections: [
    {
      connectionId: 'h',
      sourceComponentId: 'heat1',
      sourcePortId: 'heat_out',
      targetComponentId: 'rv1',
      targetPortId: 'heat_in',
      flowType: 'heat',
    },
  ],
})

export const ALL_APPARATUS_SAMPLES: IndustrialApparatusDefinition[] = [
  APP_GAS_PURIFY_COLLECT,
  APP_GAS_PURIFY_TAIL,
  APP_HEAT_CONDENSE,
  APP_DISTILL,
  APP_FILTER,
  APP_VALVE_SENSOR,
  APP_INVALID_WASH,
  APP_SIPHON_RISK,
  APP_CLOSED_HEAT,
]
