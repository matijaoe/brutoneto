import { RATE } from '../constants'
import type { Place } from '../generated/places'
import { PlaceMap, places } from '../generated/places'

/**
 * Checks if a given place is a valid Place.
 * @param {string} place - The place to check.
 * @returns {boolean} A boolean indicating whether the place is a valid Place.
 */
export function isValidPlace(place: string): place is Place {
  return place in PlaceMap
}

/**
 * Retrieves the tax information for a given place.
 */
export function getPlaceTax(place: Place) {
  return PlaceMap[place]
}

/**
 * Retrieves the taxes for all places.
 */
export function getPlacesTaxes() {
  return PlaceMap
}

/**
 * Generates options for places, suitable for use in UI components like dropdowns.
 */
export function getPlacesOptions() {
  return Object.keys(PlaceMap).map((place) => ({
    value: place,
    label: place,
  }))
}

/**
 * Retrieves all places.
 */
export function getPlaces() {
  return places
}

/**
 * Retrieves the default tax rates.
 */
export function getDefaultTax() {
  return {
    taxRateLow: RATE.TAX_LOW_BRACKET,
    taxRateHigh: RATE.TAX_HIGH_BRACKET,
  }
}
