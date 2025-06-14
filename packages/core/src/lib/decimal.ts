// eslint-disable-next-line no-restricted-imports
import Decimal from 'decimal.js'

// ---------------------------------------------------------------------------
//  Global settings – run ONCE per Node process / Bun worker
// ---------------------------------------------------------------------------
Decimal.set({
  rounding: Decimal.ROUND_HALF_UP,
})

// ---------------------------------------------------------------------------
//  Re-export the configured class so callers don't import 'decimal.js' directly
// ---------------------------------------------------------------------------
export { Decimal }
export default Decimal // default export for ergonomic `import Decimal from`
