import type {
  IndustrialApparatusComponentType,
  IndustrialApparatusMediaType,
  IndustrialApparatusPortDirection,
} from './industrial-apparatus.constants'

export type ApparatusPortCatalogEntry = {
  portId: string
  direction: IndustrialApparatusPortDirection
  media: IndustrialApparatusMediaType[]
  required: boolean
  maxConnections: number
  note?: string
}

/**
 * 设备合法端口目录（教学示意）。
 * 未列出的端口 → INVALID_PORT / UNKNOWN_*_PORT。
 */
export const APPARATUS_PORT_CATALOG: Record<
  IndustrialApparatusComponentType,
  ApparatusPortCatalogEntry[]
> = {
  reaction_vessel: [
    { portId: 'feed_in', direction: 'in', media: ['liquid', 'gas', 'solid'], required: false, maxConnections: 3 },
    { portId: 'heat_in', direction: 'in', media: ['heat'], required: false, maxConnections: 2 },
    { portId: 'product_out', direction: 'out', media: ['liquid', 'gas'], required: false, maxConnections: 2 },
    { portId: 'vent', direction: 'out', media: ['gas', 'waste_gas'], required: false, maxConnections: 1 },
  ],
  gas_generator: [
    { portId: 'reagent_in', direction: 'in', media: ['liquid', 'solid'], required: false, maxConnections: 2 },
    { portId: 'gas_out', direction: 'out', media: ['gas'], required: true, maxConnections: 2 },
  ],
  heater: [
    { portId: 'heat_out', direction: 'out', media: ['heat'], required: true, maxConnections: 2 },
  ],
  cooler: [
    { portId: 'coolant_in', direction: 'in', media: ['coolant', 'liquid'], required: false, maxConnections: 1 },
    { portId: 'coolant_out', direction: 'out', media: ['coolant', 'liquid'], required: false, maxConnections: 1 },
    { portId: 'process_in', direction: 'in', media: ['gas', 'liquid'], required: false, maxConnections: 1 },
    { portId: 'process_out', direction: 'out', media: ['gas', 'liquid'], required: false, maxConnections: 1 },
  ],
  condenser: [
    { portId: 'vapor_in', direction: 'in', media: ['gas'], required: true, maxConnections: 1 },
    { portId: 'liquid_out', direction: 'out', media: ['liquid'], required: true, maxConnections: 1 },
    { portId: 'coolant_in', direction: 'in', media: ['coolant', 'liquid'], required: true, maxConnections: 1 },
    { portId: 'coolant_out', direction: 'out', media: ['coolant', 'liquid'], required: true, maxConnections: 1 },
  ],
  filter: [
    { portId: 'slurry_in', direction: 'in', media: ['liquid', 'solid'], required: true, maxConnections: 1 },
    { portId: 'filtrate_out', direction: 'out', media: ['liquid'], required: true, maxConnections: 1 },
    { portId: 'cake_out', direction: 'out', media: ['solid'], required: false, maxConnections: 1 },
  ],
  distillation_unit: [
    { portId: 'feed_in', direction: 'in', media: ['liquid'], required: true, maxConnections: 1 },
    { portId: 'vapor_out', direction: 'out', media: ['gas'], required: true, maxConnections: 1 },
    { portId: 'residue_out', direction: 'out', media: ['liquid'], required: false, maxConnections: 1 },
  ],
  gas_washing_bottle: [
    { portId: 'gas_in', direction: 'in', media: ['gas', 'waste_gas'], required: true, maxConnections: 1 },
    { portId: 'gas_out', direction: 'out', media: ['gas', 'waste_gas'], required: true, maxConnections: 1 },
  ],
  drying_tube: [
    { portId: 'gas_in', direction: 'in', media: ['gas'], required: true, maxConnections: 1 },
    { portId: 'gas_out', direction: 'out', media: ['gas'], required: true, maxConnections: 1 },
  ],
  gas_collector: [
    { portId: 'gas_in', direction: 'in', media: ['gas'], required: true, maxConnections: 1 },
  ],
  tail_gas_absorber: [
    { portId: 'gas_in', direction: 'in', media: ['gas', 'waste_gas'], required: true, maxConnections: 1 },
  ],
  liquid_tank: [
    { portId: 'liquid_in', direction: 'in', media: ['liquid'], required: false, maxConnections: 2 },
    { portId: 'liquid_out', direction: 'out', media: ['liquid'], required: false, maxConnections: 2 },
  ],
  solid_liquid_separator: [
    { portId: 'feed_in', direction: 'in', media: ['liquid', 'solid'], required: true, maxConnections: 1 },
    { portId: 'liquid_out', direction: 'out', media: ['liquid'], required: true, maxConnections: 1 },
    { portId: 'solid_out', direction: 'out', media: ['solid'], required: false, maxConnections: 1 },
  ],
  pipe: [
    { portId: 'a', direction: 'bidirectional', media: ['gas', 'liquid', 'coolant', 'waste_gas'], required: true, maxConnections: 1 },
    { portId: 'b', direction: 'bidirectional', media: ['gas', 'liquid', 'coolant', 'waste_gas'], required: true, maxConnections: 1 },
  ],
  valve: [
    { portId: 'a', direction: 'bidirectional', media: ['gas', 'liquid', 'coolant'], required: true, maxConnections: 1 },
    { portId: 'b', direction: 'bidirectional', media: ['gas', 'liquid', 'coolant'], required: true, maxConnections: 1 },
  ],
  temperature_sensor: [
    { portId: 'sense', direction: 'in', media: ['heat', 'liquid', 'gas'], required: false, maxConnections: 1 },
  ],
  pressure_sensor: [
    { portId: 'sense', direction: 'in', media: ['gas', 'liquid'], required: false, maxConnections: 1 },
  ],
  pressure_relief: [
    { portId: 'vessel_in', direction: 'in', media: ['gas'], required: true, maxConnections: 1 },
    { portId: 'vent_out', direction: 'out', media: ['gas', 'waste_gas'], required: true, maxConnections: 1 },
  ],
}

export function getPortCatalog(
  type: IndustrialApparatusComponentType,
): ApparatusPortCatalogEntry[] {
  return APPARATUS_PORT_CATALOG[type] || []
}

export function findPortSpec(
  type: IndustrialApparatusComponentType,
  portId: string,
): ApparatusPortCatalogEntry | undefined {
  return getPortCatalog(type).find((p) => p.portId === portId)
}
