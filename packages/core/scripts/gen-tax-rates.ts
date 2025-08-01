import { load } from 'cheerio'
import prettier from 'prettier'
import {
  basicKebabCase,
  convertFromPercentage,
  localizedTitleCase,
  replaceDiacritics,
  writeFile,
} from './utils'

interface PlaceTaxesRecord {
  jedinica: string
  nizaStopa: number
  visaStopa: number
}

interface TaxDataMetadata {
  totalPlaces: number
  lastUpdated: string
  sourceUrl: string
  generatedAt: string
}

const SOURCE_URL = 'https://isplate.info/porez-na-dohodak-stope.aspx'

async function generateTaxRecords(): Promise<{ records: PlaceTaxesRecord[], metadata: TaxDataMetadata }> {
  console.log('🔄 Fetching initial page to get form data...')

  // First, get the initial page to extract form data
  const initialRes = await fetch(SOURCE_URL)
  if (!initialRes.ok) {
    throw new Error(
      `Failed to fetch "${SOURCE_URL}": ${initialRes.status} ${initialRes.statusText}`,
    )
  }

  const initialHtml = await initialRes.text()
  const $initial = load(initialHtml)

  // Extract form fields needed for the POST request
  const viewState = $initial('input[name="__VIEWSTATE"]').val() as string
  const viewStateGenerator = $initial('input[name="__VIEWSTATEGENERATOR"]').val() as string
  const eventValidation = $initial('input[name="__EVENTVALIDATION"]').val() as string

  if (!viewState || !viewStateGenerator || !eventValidation) {
    throw new Error('Could not extract required form fields from initial page')
  }

  console.log('🔄 Making POST request to get all Croatian places...')

  // Create form data for POST request to get all places
  const formData = new URLSearchParams({
    __EVENTTARGET: '',
    __EVENTARGUMENT: '',
    __VIEWSTATE: viewState,
    __VIEWSTATEGENERATOR: viewStateGenerator,
    __SCROLLPOSITIONX: '0',
    __SCROLLPOSITIONY: '0',
    __VIEWSTATEENCRYPTED: '',
    __EVENTVALIDATION: eventValidation,
    keywords: '',
    ctl00$ContentPlaceHolder1$opcija: 'opcija2', // This is the key field to show all places
    ctl00$ContentPlaceHolder1$txtTrazi: '',
    ctl00$ContentPlaceHolder1$btnPrikaziPrirez: 'Button',
    email: '',
  })

  // Make POST request with form data
  const res = await fetch(SOURCE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'max-age=0',
      'Origin': 'https://isplate.info',
      'Referer': 'https://isplate.info/porez-na-dohodak-stope.aspx',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    },
    body: formData,
  })

  if (!res.ok) {
    throw new Error(
      `Failed to fetch all places: ${res.status} ${res.statusText}`,
    )
  }

  const html = await res.text()
  const $ = load(html)
  const taxRateRecords: PlaceTaxesRecord[] = []

  console.log('🔄 Parsing tax rate data...')

  // Extract last updated date from the time element
  const timeElement = $('time[datetime]').first()
  const lastUpdatedDatetime = timeElement.attr('datetime')
  const lastUpdatedText = timeElement.text().trim()

  // Parse the clean date from text like "Zadnja izmjena: 10.03.2025"
  const cleanLastUpdated = lastUpdatedText.match(/Zadnja izmjena: (\d{2}\.\d{2}\.\d{4})/)
  const lastUpdatedDate = cleanLastUpdated ? cleanLastUpdated[1] : lastUpdatedDatetime || ''

  console.log(`📅 Source last updated: ${lastUpdatedDate}`)

  $('div.post-content article').each((_idx, article) => {
    let jedinica = $(article).find('h3 strong').first().text().trim()
    const spans = $(article)
      .find('tr.m-3 span.display-2')
      .slice(0, 2)

    const [low, high] = [$(spans[0]).text(), $(spans[1]).text()]

    if (jedinica && low && high) {
      // Special case for long compound place name
      if (jedinica.toLowerCase().includes('kaštelir-labinci-castelliere-s.domenica')) {
        jedinica = 'Kaštelir-Labinci'
      }
      else {
        jedinica = localizedTitleCase(jedinica)
      }

      taxRateRecords.push({
        jedinica,
        nizaStopa: convertFromPercentage(low),
        visaStopa: convertFromPercentage(high),
      })
    }
  })

  console.log(`✅ Parsed ${taxRateRecords.length} Croatian places`)

  const metadata: TaxDataMetadata = {
    totalPlaces: taxRateRecords.length,
    lastUpdated: lastUpdatedDate || new Date().toISOString().split('T')[0],
    sourceUrl: SOURCE_URL,
    generatedAt: new Date().toISOString(),
  }

  return { records: taxRateRecords, metadata }
}

async function writeTaxRecords(taxRecords: PlaceTaxesRecord[], metadata: TaxDataMetadata) {
  const written = await writeFile(
    'src/data/places.json',
    JSON.stringify(taxRecords, null, 2),
  )

  const metadataWritten = await writeFile(
    'src/data/places-metadata.json',
    JSON.stringify(metadata, null, 2),
  )

  if (written) {
    console.log('✅ Tax rates written to "/src/data/places.json"')
  }
  else {
    console.error('❌ Error writing tax rates file')
  }

  if (metadataWritten) {
    console.log('✅ Metadata written to "/src/data/places-metadata.json"')
  }
  else {
    console.error('❌ Error writing metadata file')
  }
}
async function writeGeneratedCode(content: string) {
  const written = await writeFile('src/data/places.ts', content)
  if (written) {
    console.log(
      '✅ Places code generated and written to "/src/data/places.ts"',
    )
  }
  else {
    console.error('❌ Error writing places type file')
  }
}

const { records: taxRecords, metadata } = await generateTaxRecords()
const placeNames = taxRecords.map(record => record.jedinica)

const PlaceMap = taxRecords.reduce(
  (acc, record) => {
    const { jedinica, visaStopa, nizaStopa } = record
    const key = basicKebabCase(replaceDiacritics(jedinica))
    acc[key] = {
      name: jedinica,
      taxRateLow: nizaStopa,
      taxRateHigh: visaStopa,
    }
    return acc
  },
  {} as Record<string, { name: string, taxRateLow: number, taxRateHigh: number }>,
)

const places = Object.keys(PlaceMap)

async function generateCode() {
  // ---------------------------------------------------------------------
  // ⚠️  AUTO-GENERATED FILE – DO NOT EDIT MANUALLY.
  // ---------------------------------------------------------------------
  const headerComment = `// This file was generated by "gen-tax-rates.ts".`

  const mapJSDoc = `
/**
 * Tax rates for different places in Croatia.
 * Data source: "${SOURCE_URL}" → serialized to "places.json".
 */`.trim()

  const placeMapCode = `export const PlaceMap = ${JSON.stringify(
    PlaceMap,
    null,
    2,
  )} as const`

  const placeAliasCode = `export type Place = keyof typeof PlaceMap`

  const placesArrayCode = `export const places: Place[] = ${JSON.stringify(
    places,
    null,
    2,
  )} as const`

  // Proper string-literal union: one pipe per line for readability
  const placeNameUnion = placeNames.map(p => `'${p}'`).join('\n  | ')
  const placeNameCode = `export type PlaceName =\n  | ${placeNameUnion}`

  // Add metadata export
  const metadataCode = `export const PlacesMetadata = ${JSON.stringify(
    metadata,
    null,
    2,
  )} as const`

  // Assemble the file in a predictable order
  const rawContent = [
    headerComment,
    '',
    mapJSDoc,
    placeMapCode,
    '',
    placeAliasCode,
    '',
    placesArrayCode,
    '',
    placeNameCode,
    '',
    metadataCode,
  ].join('\n\n')

  return prettier.format(rawContent, { parser: 'typescript' })
}

await writeTaxRecords(taxRecords, metadata)

await writeGeneratedCode(await generateCode())
