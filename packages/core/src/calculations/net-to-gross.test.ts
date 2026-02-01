import type { NetToGrossConfig } from './net-to-gross'
import { describe, expect, it } from 'vitest'
import { grossToNet } from './gross-to-net'
import { netToGross as netToGrossReverse } from './net-to-gross'

describe('netToGross reverse calculation', () => {
  it('should calculate correct gross from expected net for defined place', () => {
    const expectedNet = 2732
    const expectedGross = 4000

    const result = netToGrossReverse(expectedNet, {
      place: 'sveta-nedelja-samobor',
    })

    expect(result).toBe(expectedGross)
  })

  it('should be consistent with grossToNet calculation', () => {
    const originalGross = 4000

    const config: NetToGrossConfig = {
      place: 'sveta-nedelja-samobor',
    }

    const calculatedNet = grossToNet(originalGross, config)
    const calculatedGross = netToGrossReverse(calculatedNet, config)

    expect(calculatedGross).toBe(originalGross)
  })
})
