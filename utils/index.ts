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

export const ensureFloat = (num: number, decimals = 2) => {
  return parseFloat(num.toFixed(decimals))
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
    ;({ min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } =
      range)
  }

  if (min > max) {
    throw new Error('max must be greater than min')
  }

  return Math.min(max, Math.max(min, val))
}
