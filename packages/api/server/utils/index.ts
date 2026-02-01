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

export function extractZodErrorMessage(err: z.ZodError | any) {
  // Zod v4 format - error.message contains JSON string
  if (typeof err.message === 'string' && err.message.startsWith('[')) {
    try {
      const errors = JSON.parse(err.message)
      if (Array.isArray(errors)) {
        return errors.map((error: any) => {
          if (!error.path?.length) {
            return error.message || 'Validation error'
          }
          return `Field <${error.path.join('.')}>: ${error.message}`
        }).join('; ')
      }
    }
    catch {
      // Fall through to old format handling
    }
  }

  // Zod v3 format - error.errors is array
  if (err.errors && Array.isArray(err.errors)) {
    return err.errors.map((error: z.ZodIssue) => {
      if (!error.path?.length) {
        return error.message
      }
      return `Field <${error.path.join('.')}>: ${error.message}`
    }).join('; ')
  }

  return err.message || 'Validation error'
}
