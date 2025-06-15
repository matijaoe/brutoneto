# @brutoneto/core

Core library for Croatian salary calculations (bruto/neto conversions) with precise decimal arithmetic.

## Installation

```bash
npm install @brutoneto/core
# or
pnpm add @brutoneto/core
# or
yarn add @brutoneto/core
```

## Usage

### Basic Gross to Net Conversion

```typescript
import { grossToNet } from '@brutoneto/core'

// Simple conversion
const net = grossToNet(5000, { place: 'zagreb' })
console.log(net) // 3218

// With custom parameters
const netCustom = grossToNet(5000, {
  place: 'split',
  personalAllowanceCoefficient: 0.8,
  thirdPillarContribution: 200
})
```

### Detailed Breakdown

```typescript
import { grossToNetBreakdown } from '@brutoneto/core'

const breakdown = grossToNetBreakdown(5000, { place: 'zagreb' })
console.log(breakdown)
/*
{
  net: 3218,
  gross: 5000,
  totalCostToEmployer: 5825,
  pension: {
    firstPillar: 750,
    secondPillar: 250,
    thirdPillar: 0,
    mandatoryTotal: 1000,
    total: 1000
  },
  taxes: {
    lowerBracket: 782,
    higherBracket: 0,
    total: 782
  },
  healthInsurance: 825,
  // ... more details
}
*/
```

### Net to Gross Conversion

```typescript
import { netToGross } from '@brutoneto/core'

const gross = netToGross(3000, { place: 'zagreb' })
console.log(gross) // 4527.27
```

### Tax Information

```typescript
import {
  getDefaultTax,
  getPlaceTax,
  getPlaces,
  isValidPlace
} from '@brutoneto/core'

// Get tax rates for specific location
const zagrebTax = getPlaceTax('zagreb')
console.log(zagrebTax) // { name: 'Zagreb', taxRateLow: 0.23, taxRateHigh: 0.35 }

// Get all available places
const places = getPlaces()
console.log(places) // ['zagreb', 'split', 'rijeka', ...]

// Get default tax rates
const defaultTax = getDefaultTax()
console.log(defaultTax) // { taxRateLow: 0.2, taxRateHigh: 0.3 }

// Validate place name
console.log(isValidPlace('zagreb')) // true
console.log(isValidPlace('invalid')) // false
```

## Configuration Options

### SalaryConfig

```typescript
interface SalaryConfig {
  place?: Place // Croatian location
  taxRateLow?: number // Custom low tax rate (0-0.99)
  taxRateHigh?: number // Custom high tax rate (0-0.99)
  personalAllowanceCoefficient?: number // Coefficient (0.15-1.0)
  thirdPillarContribution?: number // Monthly contribution (0-750)
}
```

### Available Places

The library supports all Croatian cities and municipalities with their specific surtax rates:

- **Major cities**: `zagreb`, `split`, `rijeka`, `osijek`, `zadar`
- **All municipalities**: 556 total locations with specific tax rates
- **Validation**: Use `isValidPlace()` to check if a location is supported

## Constants

```typescript
import {
  BASIC_PERSONAL_ALLOWANCE,
  HIGH_TAX_BRACKET_THRESHOLD,
  MAX_PERSONAL_ALLOWANCE_COEFFICIENT,
  MIN_PERSONAL_ALLOWANCE_COEFFICIENT,
  THIRD_PILLAR_NON_TAXABLE_LIMIT
} from '@brutoneto/core'

console.log(HIGH_TAX_BRACKET_THRESHOLD) // 5000 (EUR)
console.log(BASIC_PERSONAL_ALLOWANCE) // 600 (EUR)
console.log(THIRD_PILLAR_NON_TAXABLE_LIMIT) // 750 (EUR)
```

## Utility Functions

### Precision Utilities

```typescript
import { percent, roundEuros } from '@brutoneto/core'

const rounded = roundEuros(1234.567) // 1234.57
const percentage = percent(0.23, 1000) // 230
```

### Calculation Utilities

```typescript
import {
  calcMandatoryPensionContribution,
  calcPersonalAllowance,
  calcTax,
  grossToTotal
} from '@brutoneto/core'

// Calculate pension contributions
const pension = calcMandatoryPensionContribution(5000) // 1000

// Calculate personal allowance
const allowance = calcPersonalAllowance(5000, 1.0, 'zagreb') // 600

// Calculate tax amount
const tax = calcTax(3400, 0.23, 0.35) // 782

// Calculate total employer cost
const total = grossToTotal(5000) // 5825
```

## Tax System Overview

The Croatian tax system implemented in this library includes:

- **Income Tax**: Two brackets (20% up to €5,000, 30% above)
- **Surtax**: Location-specific rates (0-18%)
- **Pension Contributions**:
  - 1st pillar: 15% (mandatory)
  - 2nd pillar: 5% (mandatory)
  - 3rd pillar: up to €750/month (optional, tax-deductible)
- **Health Insurance**: 16.5% of gross salary
- **Personal Allowance**: €600 base with coefficient (0.15-1.0)

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build package
pnpm build

# Generate tax data
pnpm generate

# Lint code
pnpm lint
```

## TypeScript Support

This package is written in TypeScript and includes full type definitions. All functions are strongly typed with proper interfaces for configuration objects and return values.

## Precision

All calculations use [Decimal.js](https://github.com/MikeMcl/decimal.js) for precise decimal arithmetic to avoid floating-point errors in financial calculations.
