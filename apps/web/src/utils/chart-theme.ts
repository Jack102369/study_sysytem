export type ChartType = 'line' | 'bar'

export interface ChartPalette {
  score: string
  classRank: string
  schoolRank: string
  bar: string
  barAlt: string
  axis: string
  split: string
  legend: string
}

const light: ChartPalette = {
  score: '#1677ff',
  classRank: '#fa8c16',
  schoolRank: '#f5222d',
  bar: '#1677ff',
  barAlt: '#13c2c2',
  axis: '#606266',
  split: '#ebeef5',
  legend: '#606266',
}

/** 深色底高对比、更醒目 */
const dark: ChartPalette = {
  score: '#69b1ff',
  classRank: '#ffd666',
  schoolRank: '#ff7875',
  bar: '#36cfc9',
  barAlt: '#b37feb',
  axis: '#c0c4cc',
  split: '#3a4150',
  legend: '#e5eaf3',
}

export function getChartPalette(isDark: boolean): ChartPalette {
  return isDark ? dark : light
}

/** 折线/柱状共用系列样式 */
export function seriesStyle(
  type: ChartType,
  color: string,
  opts?: {
    smooth?: boolean
    lineWidth?: number
    /** 名次轴（inverse）柱子从上方延伸，数字标在柱端外侧 */
    rankAxis?: boolean
    labelColor?: string
  },
) {
  if (type === 'bar') {
    return {
      type: 'bar' as const,
      itemStyle: {
        color,
        borderRadius: opts?.rankAxis ? [0, 0, 3, 3] : [3, 3, 0, 0],
      },
      barMaxWidth: 28,
      label: {
        show: true,
        position: opts?.rankAxis ? ('bottom' as const) : ('top' as const),
        color: opts?.labelColor ?? color,
        fontSize: 11,
        fontWeight: 600 as const,
      },
    }
  }
  return {
    type: 'line' as const,
    smooth: opts?.smooth ?? true,
    itemStyle: { color },
    lineStyle: { color, width: opts?.lineWidth ?? 2 },
    symbol: 'circle',
    symbolSize: 8,
  }
}
