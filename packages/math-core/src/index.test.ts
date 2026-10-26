import { describe, expect, it } from 'vitest'
import { MATH_CORE_VERSION, MASP_VERSION } from './index'

describe('@study/math-core', () => {
  it('exports MATH_CORE_VERSION', () => {
    expect(MATH_CORE_VERSION).toBe('0.0.1')
  })

  it('can resolve MASP_VERSION from math-protocol', () => {
    expect(MASP_VERSION).toBe('1.0')
  })
})
