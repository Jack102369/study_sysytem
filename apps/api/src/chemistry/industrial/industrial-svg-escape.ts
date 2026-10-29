/** SVG / XML 文本与属性转义（禁止未转义拼接） */
export function escapeSvgText(raw: string): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function sanitizeSvgCoord(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}
