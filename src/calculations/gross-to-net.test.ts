import { describe, expect, it } from 'vitest'
import { grossToNet } from './gross-to-net'

describe('grossToNet', () => {
  it('should calculate correct net salary for defined place', () => {
    const gross = 4000
    const expectedNet = 2732

    const result = grossToNet(gross, {
      place: 'sveta-nedelja-samobor',
    })
    expect(result).toBe(expectedNet)
  })

  it('should calculate net salary usingo default tax rates', () => {
    const gross = 4000
    const expectedNet = 2680

    const result = grossToNet(gross)
    expect(result).toBe(expectedNet)
  })
})
