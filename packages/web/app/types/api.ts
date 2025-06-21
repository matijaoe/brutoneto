export type PlacesMetadata = {
  totalPlaces: number
  lastUpdated: string
  generatedAt: string
  sourceUrl: string
}

export type PlaceData = {
  key: string
  name: string
  taxRateLow: number
  taxRateHigh: number
}

export type PlacesTaxesResponse = {
  places: PlaceData[] // Array of place objects with key, name, and tax rates
  metadata: PlacesMetadata
}
