export {
  isValidPlace,
  getPlaceTax,
  getPlacesTaxes,
  getPlacesOptions,
  getPlaces,
  getDefaultTax,
} from './src/places'

// Main salary calculations
export {
  grossToNetBreakdown,
  grossToNet,
  type SalaryConfig,
} from './src/calculations/gross-to-net'

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
} from './src/calculations/salary'

export {
  RATE,
  BASIC_PERSONAL_ALLOWANCE,
  HIGH_TAX_BRACKET_THRESHOLD,
  MIN_PERSONAL_ALLOWANCE_COEFFICIENT,
  PERSONAL_ALLOWANCE_COEFFICIENT,
  MAX_PERSONAL_ALLOWANCE_COEFFICIENT,
  THIRD_PILLAR_NON_TAXABLE_LIMIT,
} from './src/constants'

export {
  Place,
  PlaceName,
} from './src/data/places'

// Precision utilities (optional for custom calculations)
export {
  roundEuros,
  assertValidSalary,
  assertFinitePositive,
  percent,
} from './src/utils/precision'
