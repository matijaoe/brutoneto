import type { NetToGrossConfig } from './net-to-gross'
import { describe, expect, it } from 'vitest'
import { grossToNet } from './gross-to-net'
import { netToGross } from './net-to-gross'

/**
 * Helper: asserts that the roundtrip preserves the net value exactly,
 * and the recovered gross is very close to the original.
 *
 * Due to intermediate rounding in calcTax, grossToNet can be non-monotonic
 * near rounding flip points — multiple gross values may produce the same net.
 * The guaranteed invariant is: grossToNet(netToGross(grossToNet(G))) === grossToNet(G).
 * The recovered gross is typically exact, and always within ±0.02 EUR.
 */
function assertRoundtrip(gross: number, config: NetToGrossConfig = {}) {
  const net = grossToNet(gross, config)
  const recoveredGross = netToGross(net, config)

  // The recovered gross must produce exactly the same net (net-level roundtrip)
  expect(
    grossToNet(recoveredGross, config),
    `Net roundtrip failed for gross=${gross}: net=${net}, recoveredGross=${recoveredGross}`,
  ).toBe(net)

  // The recovered gross should be very close to the original
  expect(
    Math.abs(recoveredGross - gross),
    `Gross deviation too large for gross=${gross}: expected ~${gross}, got ${recoveredGross}`,
  ).toBeLessThanOrEqual(0.02)
}

describe('netToGross', () => {
  describe('basic correctness', () => {
    it('should calculate correct gross from expected net for defined place', () => {
      const result = netToGross(2732, { place: 'sveta-nedelja-samobor' })
      expect(result).toBe(4000)
    })

    it('should calculate correct gross with default rates', () => {
      const result = netToGross(2680)
      // grossToNet(4000) === 2680 with default rates
      expect(result).toBe(4000)
    })
  })

  describe('roundtrip: default rates (20%/30%)', () => {
    const values = [
      750,
      1000,
      1234.56,
      1500,
      2000,
      2500,
      3000,
      3500,
      4000,
      4500,
      5000,
      5500,
      6000,
      6500,
      7000,
      7500,
      8000,
      8888.88,
      10000,
      12000,
      12345.67,
      15000,
      15432.19,
      20000,
      25000,
      30000,
      40000,
      50000,
      75000,
      99999.99,
      100000,
    ]

    it.each(values)('grossToNet -> netToGross roundtrip for gross=%s', (gross) => {
      assertRoundtrip(gross)
    })
  })

  describe('roundtrip: Zagreb (23%/33%)', () => {
    const config: NetToGrossConfig = { place: 'zagreb' }
    const values = [
      1000,
      2000,
      3000,
      4000,
      5000,
      6000,
      7000,
      8000,
      10000,
      12345.67,
      15000,
      15432.19,
      20000,
      30000,
      50000,
      75000,
      99999.99,
    ]

    it.each(values)('roundtrip for gross=%s with Zagreb rates', (gross) => {
      assertRoundtrip(gross, config)
    })
  })

  describe('roundtrip: Sveta Nedelja Samobor (18%/28%)', () => {
    const config: NetToGrossConfig = { place: 'sveta-nedelja-samobor' }
    const values = [
      1000,
      2000,
      3000,
      4000,
      5000,
      6000,
      7000,
      8000,
      10000,
      12345.67,
      15000,
      15432.19,
      20000,
      30000,
      50000,
      75000,
      99999.99,
    ]

    it.each(values)('roundtrip for gross=%s with Sveta Nedelja rates', (gross) => {
      assertRoundtrip(gross, config)
    })
  })

  describe('roundtrip: bracket boundary sweep', () => {
    // The tax bracket boundary is at taxable income = 5000.
    // With default coefficient=1: personalAllowance = 600
    // income = gross * 0.80, taxableIncome = income - 600
    // taxableIncome = 5000 when gross = (5000 + 600) / 0.80 = 7000
    //
    // Near the boundary, intermediate rounding in calcTax can cause
    // grossToNet to be non-monotonic (e.g., gross 7009.97 and 7009.99
    // both give the same net, while 7009.98 gives a lower net).
    // When multiple gross values map to the same net, the roundtrip on
    // gross may not be exact, but the NET roundtrip must always hold:
    // grossToNet(netToGross(grossToNet(G))) === grossToNet(G)
    const boundaryValues: number[] = []
    for (let g = 6990; g <= 7010; g += 0.01) {
      boundaryValues.push(Math.round(g * 100) / 100)
    }

    it.each(boundaryValues)('net roundtrip at bracket boundary gross=%s', (gross) => {
      const net = grossToNet(gross)
      const recoveredGross = netToGross(net)
      // The recovered gross must produce exactly the same net
      expect(
        grossToNet(recoveredGross),
        `Net roundtrip failed for gross=${gross}: net=${net}, recoveredGross=${recoveredGross}`,
      ).toBe(net)
      // And should be within 0.02 EUR of the original gross
      expect(
        Math.abs(recoveredGross - gross),
        `Gross deviation too large for gross=${gross}: got ${recoveredGross}`,
      ).toBeLessThanOrEqual(0.02)
    })
  })

  describe('roundtrip: personalAllowanceCoefficient variations', () => {
    const coefficients = [
      0.5,
      1.5,
      2,
      3.5,
      6,
    ]
    const grossValues = [
      2000,
      5000,
      10000,
      20000,
      50000,
    ]

    for (const coeff of coefficients) {
      for (const gross of grossValues) {
        it(`roundtrip for gross=${gross}, coefficient=${coeff}`, () => {
          assertRoundtrip(gross, { personalAllowanceCoefficient: coeff })
        })
      }
    }
  })

  describe('roundtrip: combined place + coefficient', () => {
    const cases = [
      {
        place: 'zagreb' as const,
        personalAllowanceCoefficient: 2,
        grossValues: [
          3000,
          8000,
          15000,
          50000,
        ],
      },
      {
        place: 'zagreb' as const,
        personalAllowanceCoefficient: 4,
        grossValues: [
          5000,
          10000,
          30000,
        ],
      },
      {
        place: 'sveta-nedelja-samobor' as const,
        personalAllowanceCoefficient: 1.5,
        grossValues: [
          3000,
          7000,
          20000,
        ],
      },
    ]

    for (const { place, personalAllowanceCoefficient, grossValues } of cases) {
      for (const gross of grossValues) {
        it(`roundtrip for gross=${gross}, place=${place}, coeff=${personalAllowanceCoefficient}`, () => {
          assertRoundtrip(gross, { place, personalAllowanceCoefficient })
        })
      }
    }
  })

  describe('net-level roundtrip: grossToNet(netToGross(N)) === N', () => {
    const netValues = [
      500,
      1000,
      1500,
      2000,
      2500,
      3000,
      3500,
      4000,
      4500,
      5000,
      6000,
      7000,
      8000,
      9000,
      10000,
      15000,
      20000,
      30000,
      50000,
      75000,
    ]
    const configs: { label: string, config: NetToGrossConfig }[] = [
      { label: 'default rates', config: {} },
      { label: 'Zagreb', config: { place: 'zagreb' } },
      { label: 'Sveta Nedelja', config: { place: 'sveta-nedelja-samobor' } },
      { label: 'coefficient 2', config: { personalAllowanceCoefficient: 2 } },
    ]

    for (const { label, config } of configs) {
      for (const net of netValues) {
        it(`grossToNet(netToGross(${net})) === ${net} [${label}]`, () => {
          const gross = netToGross(net, config)
          expect(
            grossToNet(gross, config),
            `Net-level roundtrip failed: netToGross(${net}) = ${gross}, grossToNet(${gross}) ≠ ${net}`,
          ).toBe(net)
        })
      }
    }
  })

  describe('user-provided net (not from grossToNet)', () => {
    it('should return a gross whose forward net is as close as possible to target', () => {
      const targetNets = [
        1500,
        2000,
        2500,
        3000,
        4000,
        5000,
        7500,
        10000,
        20000,
        50000,
      ]

      for (const targetNet of targetNets) {
        const gross = netToGross(targetNet)
        const forwardNet = grossToNet(gross)

        // The forward net should be within 0.01 of the target
        expect(
          Math.abs(forwardNet - targetNet),
          `For targetNet=${targetNet}, got gross=${gross}, forwardNet=${forwardNet}`,
        ).toBeLessThanOrEqual(0.01)

        // No adjacent cent should be strictly closer
        const grossUp = Math.round((gross + 0.01) * 100) / 100
        const grossDown = Math.round((gross - 0.01) * 100) / 100
        const netUp = grossToNet(grossUp)
        const netDown = grossDown > 0 ? grossToNet(grossDown) : Infinity

        expect(
          Math.abs(netUp - targetNet),
          `gross+0.01 should not be strictly closer: targetNet=${targetNet}`,
        ).toBeGreaterThanOrEqual(Math.abs(forwardNet - targetNet))

        if (grossDown > 0) {
          expect(
            Math.abs(netDown - targetNet),
            `gross-0.01 should not be strictly closer: targetNet=${targetNet}`,
          ).toBeGreaterThanOrEqual(Math.abs(forwardNet - targetNet))
        }
      }
    })
  })

  describe('edge cases', () => {
    it('should return 0 for net=0', () => {
      expect(netToGross(0)).toBe(0)
    })

    it('should handle very small gross values', () => {
      assertRoundtrip(1)
      assertRoundtrip(10)
      assertRoundtrip(100)
    })

    it('should throw for negative net', () => {
      expect(() => netToGross(-1)).toThrow()
    })

    it('should throw for unknown place', () => {
      expect(() => netToGross(2000, { place: 'nonexistent' as any })).toThrow()
    })
  })
})
