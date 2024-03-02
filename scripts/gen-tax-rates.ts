import { load } from 'cheerio'
import { convertFromPercentage, localizedTitleCase, writeFile } from '../utils'
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
    'data/porezi.json',
    JSON.stringify(taxRecords, null, 2)
  )
  if (written) {
    console.log('✅ Tax rates written to "data/porezi.json"')
  } else {
    console.error('❌ Error writing tax rates file')
  }
}

const taxRecords = generateTaxRecords()

writeTaxRecords(taxRecords)
