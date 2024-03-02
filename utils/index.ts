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
