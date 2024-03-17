import Decimal from 'decimal.js'
import { titleCase } from 'title-case'

export const writeFile = async (
  path: string,
  data: string,
): Promise<boolean> => {
  try {
    await Bun.write(path, data, { createPath: true })
    return true
  } catch (err) {
    return false
  }
}

export const convertFromPercentage = (value: string) => {
  return parseFloat((parseFloat(value.replace('%', '')) / 100).toFixed(4))
}

export const localizedTitleCase = (str: string) => {
  return titleCase(str.toLocaleLowerCase(), {
    locale: 'hr-HR',
    smallWords: new Set(['i', 'u', 'na', 'iz', 'uz', 'pri', 'kod', 'pod']),
  })
}

export const basicKebabCase = (str: string) => {
  return str.replace(/[()]/g, '').replaceAll(/\s/g, '-').toLocaleLowerCase()
}

export function clamp(
  val: number,
  range: { min: number; max?: number } | { min?: number; max: number },
): number
export function clamp(val: number, range: [number, number]): number
export function clamp(
  val: number,
  range:
    | { min: number; max?: number }
    | { min?: number; max: number }
    | [number, number],
): number {
  let min: number, max: number

  if (Array.isArray(range)) {
    ;[min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY] = range
  } else {
    ; ({ min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } =
      range)
  }

  if (min > max) {
    throw new Error('max must be greater than min')
  }

  return Math.min(max, Math.max(min, val))
}

export const replaceDiacritics = (str: string) => {
  return str
    .replace(/š/i, 's')
    .replace(/č/i, 'c')
    .replace(/ć/i, 'c')
    .replace(/ž/i, 'z')
    .replace(/đ/i, 'd')
}

/**
 * Generate an array of numbers, from start to end (exclusive), incrementing by step.
 *
 * If only a single argument is provided, it generates an array from 0 to length (exclusive).
 *
 * If start is greater than end, the array is generated in reverse, decrementing by step.
 *
 * @category Array
 *
 * @example
 * // Usage with for...of:
 * for (const num of range(1, 5)) {
 *   console.log(num)
 * }
 * // => 1 2 3 4
 *
 * // Numbers from 0 to 4:
 * range(5)
 * // => [0, 1, 2, 3, 4]
 *
 * // Even numbers between 0 and 10:
 * range(0, 10, 2)
 * // => [0, 2, 4, 6, 8]
 *
 * // Descending range with negative step:
 * range(5, 0, -2)
 * // => [5, 3, 1]
 *
 * // Descending range with positive step:
 * range(5, 0, 2)
 * // => [5, 3, 1]
 *
 */
export function range(len: number): number[]
export function range(start: number, end: number, step?: number): number[]
export function range(...args: [number] | [number, number, number?]): number[] {
  let start: number, end: number, step: number, length: number

  if (args.length === 1) {
    ;[length] = args
    start = 0
    step = 1
    end = length - 1
  } else {
    ;[start, end, step = 1] = args
    length = Math.ceil(Math.abs((end - start) / step))
  }

  if (start === end) {
    return []
  }

  const isAsc = start < end

  if (isAsc && step < 0) {
    throw new Error('The step must be greater than 0.')
  }

  step = isAsc ? step : -Math.abs(step)

  const result = Array.from<number>({ length })

  for (let i = 0; i < length; i++) {
    result[i] = start + i * step
  }

  return result
}

/**
 * Check if value is between min and max (inclusive).
 *
 * @category Number
 *
 * @example
 *
 * isBetween(3, [1, 5]) // true
 * isBetween(5, [1, 5]) // true
 * isBetween(7, [1, 5]) // false
 *
 * isBetween(3, { min: 1, max: 5 }) // true
 * isBetween(5, { min: 1, max: 5 }) // true
 * isBetween(7, { min: 1, max: 5 }) // false
 */
export function isBetween(
  val: number,
  range: { min: number; max: number },
): boolean
export function isBetween(val: number, range: [number, number]): boolean
export function isBetween(
  val: number,
  range: { min: number; max: number } | [number, number],
): boolean {
  let min: number, max: number
  if (Array.isArray(range)) {
    ;[min, max] = range
  } else {
    ; ({ min, max } = range)
  }
  return val >= min && val <= max
}

export function toDecimal(num: number): Decimal {
  return new Decimal(num)
}
