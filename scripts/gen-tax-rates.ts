import { load } from "cheerio"
import { rawHtmlTables } from "./data/raw-html-tables"
import { convertFromPercentage } from "../utils"

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
      const rows = $("table table tbody td")
        .get()
        .map((td) => $(td).text())

      return rows
    })
    .flat()

  for (let i = 0; i < rows.length; i += 3) {
    const jedinica = rows[i]

    taxRateRecords.push({
      jedinica,
      nizaStopa: convertFromPercentage(rows[i + 1]),
      visaStopa: convertFromPercentage(rows[i + 2]),
    })
  }

  return taxRateRecords
}

const writeTaxRecords = async (taxRecords: PlaceTaxRecord[]) => {
  try {
    await Bun.write("data/porezi.json", JSON.stringify(taxRecords, null, 2), {
      createPath: true,
    })
    console.log('✅ Tax rates written to "data/porezi.json"')
  } catch (err) {
    console.error("❌ Error writing tax rates file", err)
  }
}

const taxRecords = generateTaxRecords()

writeTaxRecords(taxRecords)
