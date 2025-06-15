import type { Place } from '@brutoneto/core'
import { isValidPlace } from '@brutoneto/core'

const PLACE_SHORTCUTS: Partial<Record<Place, string[]>> = {
  'zagreb': ['zg'],
  'sveta-nedelja-samobor': ['svn'],
  'samobor': ['smb'],
}

// Create reverse mapping for quick lookup
const SHORTCUT_TO_PLACE: Record<string, Place> = {}
Object.entries(PLACE_SHORTCUTS).forEach(([place, shortcuts]) => {
  shortcuts.forEach((shortcut) => {
    SHORTCUT_TO_PLACE[shortcut.toLowerCase()] = place as Place
  })
})

/**
 * Resolve place shortcuts to full place names
 * @param place - Place name or shortcut
 * @returns Full place name as Place type or original string
 */
export function resolvePlaceShortcut(place: string): Place | string {
  const lowerPlace = place.toLowerCase()
  return SHORTCUT_TO_PLACE[lowerPlace] || place
}

/**
 * Validate place name, supporting shortcuts
 * @param place - Place name or shortcut
 * @returns True if valid place (including shortcuts)
 */
export function isValidPlaceWithShortcuts(place: string): boolean {
  const resolvedPlace = resolvePlaceShortcut(place)
  return isValidPlace(resolvedPlace)
}

/**
 * Get all available shortcuts mapped to their full place names
 * @returns Object with shortcuts as keys and full names as values
 */
export function getShortcutMapping(): Record<string, string> {
  return { ...SHORTCUT_TO_PLACE }
}

/**
 * Get all shortcuts for a specific place
 * @param place - Place name
 * @returns Array of shortcuts for the place
 */
export function getShortcutsForPlace(place: Place): string[] {
  return PLACE_SHORTCUTS[place] ?? []
}

/**
 * Get all place shortcuts organized by place
 * @returns Object with place names as keys and arrays of shortcuts as values
 */
export function getAllPlaceShortcuts(): Partial<Record<Place, string[]>> {
  return { ...PLACE_SHORTCUTS }
}
