// OpenStreetMap Nominatim Geocoding Service
// Free geocoding API with no API key required

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export interface NominatimPlace {
  place_id: number
  name: string
  display_name: string
  lat: string
  lon: string
  type: string
  class: string
  importance?: number
  address?: Record<string, string>
}

export interface GeocodedLocation {
  name: string
  address: string
  latitude: number
  longitude: number
  placeId: number
}

/**
 * Search for places using Nominatim autocomplete
 * @param query Search query (address, place name, etc)
 * @returns Array of matching places
 */
export async function searchPlaces(query: string): Promise<NominatimPlace[]> {
  if (!query || query.length < 2) return []

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '10',
    })

    const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: {
        'Accept': 'application/json',
        // Nominatim requires a User-Agent header
        'User-Agent': 'Pinspot-App (https://pinspot.vercel.app)',
      },
    })

    if (!response.ok) {
      console.error('Nominatim search error:', response.statusText)
      return []
    }

    const data: NominatimPlace[] = await response.json()
    return data
  } catch (error) {
    console.error('Error searching places:', error)
    return []
  }
}

/**
 * Reverse geocode coordinates to get address
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Place information including address
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<NominatimPlace | null> {
  try {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
      format: 'json',
      zoom: '18',
      addressdetails: '1',
    })

    const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Pinspot-App (https://pinspot.vercel.app)',
      },
    })

    if (!response.ok) {
      console.error('Nominatim reverse geocode error:', response.statusText)
      return null
    }

    const data: NominatimPlace = await response.json()
    return data
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    return null
  }
}

/**
 * Format a Nominatim place result into a usable location object
 */
export function formatPlace(place: NominatimPlace): GeocodedLocation {
  return {
    name: place.name || place.display_name.split(',')[0],
    address: place.display_name,
    latitude: parseFloat(place.lat),
    longitude: parseFloat(place.lon),
    placeId: place.place_id,
  }
}
