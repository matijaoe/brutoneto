import type { z } from 'zod'

export function isNumber(val: unknown): val is number {
  try {
    return Number(val) === val
  }
  catch {
    return false
  }
}

export function isString(val: unknown): val is string {
  return typeof val === 'string'
}

/**
 * Convert a value to a number, using `Number()`.
 *
 * If the conversion fails, fallback value is returned. `undefined` by default.
 *
 * @example
 * toNumber('1') // 1
 * toNumber('1.5') // 1.5
 * toNumber('1.5.5') // undefined
 * toNumber('123foo', 0) // 0
 * toNumber('foo', 'bar') // 'bar'
 */
export function toNumber<T = undefined>(val: unknown, fallback?: T): number | T {
  if (isNumber(val)) {
    return val
  }
  const n = isString(val) ? Number(val) : Number.NaN
  return Number.isNaN(n) ? fallback as T : n
}

/**
 * Convert a value to a number, using `parseFloat()`.
 *
 * If the conversion fails, fallback value is returned. `undefined` by default.
 *
 * @example
 * toNumber('1') // 1
 * toNumber('1.5') // 1.5
 * toNumber('1.5.5') // 1.5
 * toNumber('123foo', 0) // 123
 * toNumber('foo', 'bar') // 'bar'
 */
export function looseToNumber<T = undefined>(val: unknown, fallback?: T): number | T {
  if (isNumber(val)) {
    return val
  }
  const n = isString(val) ? Number.parseFloat(val) : Number.NaN

  return Number.isNaN(n) ? fallback as T : n
}

export function extractZodErrorMessage(err: z.ZodError) {
  return err.errors.map((error: z.ZodIssue) => {
    if (!error.path?.length) {
      return error.message
    }
    // const receivedValue = error.
    return `Field <${error.path.join('.')}>: ${error.message}`
  }).join('; ')
}
