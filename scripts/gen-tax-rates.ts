import { load } from 'cheerio'
import {
  basicKebabCase,
  convertFromPercentage,
  localizedTitleCase,
  writeFile,
} from '../utils'
import { rawHtmlTables } from './data/raw-html-tables'

type PlaceTaxRecord = {
  jedinica: string
  nizaStopa: number
  visaStopa: number
}

const generateTaxRecords = () => {
  const taxRateRecords: PlaceTaxRecord[] = []

  const rows = rawHtmlTables
    .map((table) => {
      const $ = load(table)
      const rows = $('table table tbody td')
        .get()
        .map((td) => $(td).text())

      return rows
    })
    .flat()

  for (let i = 0; i < rows.length; i += 3) {
    const jedinica = rows[i]

    taxRateRecords.push({
      jedinica: localizedTitleCase(jedinica),
      nizaStopa: convertFromPercentage(rows[i + 1]),
      visaStopa: convertFromPercentage(rows[i + 2]),
    })
  }

  return taxRateRecords
}

const writeTaxRecords = async (taxRecords: PlaceTaxRecord[]) => {
  const written = await writeFile(
    'generated/porezi.json',
    JSON.stringify(taxRecords, null, 2),
  )
  if (written) {
    console.log('✅ Tax rates written to "/generated/porezi.json"')
  } else {
    console.error('❌ Error writing tax rates file')
  }
}
const writeGeneratedCode = async (content: string) => {
  const written = await writeFile('generated/places.ts', content)
  if (written) {
    console.log(
      '✅ Places code generated and written to "/generated/places.ts"',
    )
  } else {
    console.error('❌ Error writing places type file')
  }
}

const taxRecords = generateTaxRecords()
const places = taxRecords.map((record) => record.jedinica)

const PlaceTaxObject = taxRecords.reduce(
  (acc, record) => {
    const { jedinica, visaStopa, nizaStopa } = record
    const key = basicKebabCase(jedinica)
    acc[key] = {
      taxRateLow: nizaStopa,
      taxRateHigh: visaStopa,
    }
    return acc
  },
  {} as Record<string, { taxRateLow: number; taxRateHigh: number }>,
)

import prettier from 'prettier'

const generateCode = async () => {
  const comment = `
    // This file was generated by the "gen-tax-rates.ts" script. 
    // Do not modify it manually.
  `

  const PlaceTypeCode = `
    /**
     * Type for all places in 'porezi.json'.
    */
    export type Place = ${places.map((place) => `| '${place}'`).join(' ')}
  `

  const PlaceTaxCode = `
    /**
     * Tax rates for different places in Croatia.
     * Generated off of the data from 'porezi.json'.
    */
    export const PlaceTax = ${JSON.stringify(PlaceTaxObject, null, 2)} as const
  `

  const content = `${comment}\n\n${PlaceTypeCode}\n\n${PlaceTaxCode}`

  const formattedCode = await prettier.format(content, { parser: 'typescript' })

  return formattedCode
}

writeTaxRecords(taxRecords)

writeGeneratedCode(await generateCode())
