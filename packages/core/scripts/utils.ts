import { titleCase } from 'title-case'
import { Decimal } from '../src/lib/decimal'

export async function writeFile(path: string, data: string): Promise<boolean> {
  try {
    await Bun.write(path, data, { createPath: true })
    return true
  }
  catch {
    return false
  }
}

export function convertFromPercentage(value: string) {
  const percentage = Number.parseFloat(value.replace('%', '')) / 100
  return new Decimal(percentage).toDP(4).toNumber()
}

export function localizedTitleCase(str: string) {
  return titleCase(str.toLocaleLowerCase(), {
    locale: 'hr-HR',
    smallWords: new Set(['i', 'u', 'na', 'iz', 'uz', 'pri', 'kod', 'pod']),
  })
}

export function basicKebabCase(str: string) {
  return str.replace(/[()]/g, '').replaceAll(/\s/g, '-').toLocaleLowerCase()
}

export function replaceDiacritics(str: string) {
  return str
    .replace(/š/i, 's')
    .replace(/č/i, 'c')
    .replace(/ć/i, 'c')
    .replace(/ž/i, 'z')
    .replace(/đ/i, 'd')
}
