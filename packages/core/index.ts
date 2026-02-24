// Main salary calculations
export {
  grossToNet,
  grossToNetBreakdown,
  type SalaryConfig,
} from './src/calculations/gross-to-net'

// Gross-two-to-net calculation
export {
  grossTwoToNet,
  grossTwoToNetBreakdown,
} from './src/calculations/gross-two-to-net'

// Net-to-gross calculation
export {
  netToGross,
  type NetToGrossConfig,
} from './src/calculations/net-to-gross'

// Calculation utilities (for custom calculations)
export {
  calcMandatoryPensionContribution,
  calcPersonalAllowance,
  calcTax,
  grossToTotal,
  totalToGross,
} from './src/calculations/salary'

export {
  BASIC_PERSONAL_ALLOWANCE,
  HIGH_TAX_BRACKET_THRESHOLD,
  MAX_PERSONAL_ALLOWANCE_COEFFICIENT,
  MIN_PERSONAL_ALLOWANCE_COEFFICIENT,
  PERSONAL_ALLOWANCE_COEFFICIENT,
  RATE,
  THIRD_PILLAR_NON_TAXABLE_LIMIT,
} from './src/constants'

export {
  Place,
  PlaceName,
  PlacesMetadata,
} from './src/data/places'

export {
  getDefaultTax,
  getPlaces,
  getPlacesMetadata,
  getPlacesOptions,
  getPlacesTaxes,
  getPlaceTax,
  isValidPlace,
} from './src/places'

// Precision utilities (optional for custom calculations)
export {
  assertFinitePositive,
  assertValidSalary,
  percent,
  roundEuros,
} from './src/utils/precision'
