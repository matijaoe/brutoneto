import type { Place } from '../generated/places'
import { PlaceMap } from '../generated/places'

/**
 * Checks if a given place is a valid Place.
 * @param place - The place to check.
 * @returns A boolean indicating whether the place is a valid Place.
 */
export function isValidPlace(place: string): place is Place {
  return place in PlaceMap
}

export function getPlaceTax(place: Place) {
  return PlaceMap[place]
}
