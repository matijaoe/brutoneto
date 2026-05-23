// DOO (d.o.o.) calculations
export {
  calculateDoo,
  calculateDooSimple,
  type DooBreakdown,
  type DooConfig,
} from './src/calculations/doo'

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

// Non-taxable benefits ("neoporezivi primici")
export {
  type BenefitCategory,
  type BenefitFlow,
  calculateNonTaxableBenefits,
  type MealMode,
  NON_TAXABLE_BENEFIT_LIMITS_2026,
  type NonTaxableBenefitItem,
  type NonTaxableBenefitKey,
  type NonTaxableBenefitsBreakdown,
  type NonTaxableBenefitsConfig,
} from './src/calculations/non-taxable-benefits'

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
  CORPORATE_TAX_RATE,
  DIRECTOR_MINIMUM_GROSS,
  DIVIDEND_TAX_RATE,
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
