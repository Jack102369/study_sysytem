import { describe, expect, it } from 'vitest'
import { MASP_VERSION, maspVersionSchema } from './index'

describe('@study/math-protocol', () => {
  it('exports MASP_VERSION as 1.0', () => {
    expect(MASP_VERSION).toBe('1.0')
  })

  it('validates version envelope with zod', () => {
    const parsed = maspVersionSchema.parse({ maspVersion: '1.0' })
    expect(parsed.maspVersion).toBe(MASP_VERSION)
  })
})
