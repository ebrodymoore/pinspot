import axios from 'axios'

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

interface NominatimAddress {
  country?: string
  state?: string
  city?: string
  town?: string
  village?: string
  county?: string
  postcode?: string
  display_name: string
}

interface NominatimResult {
  lat: string
  lon: string
  address: NominatimAddress
  display_name: string
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{
  display_name: string
  country?: string
  city?: string
  state?: string
}> {
  try {
    const response = await axios.get<NominatimResult>(
      `${NOMINATIM_BASE_URL}/reverse`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          zoom: 10,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'Pinspot-Travel-Map',
        },
      }
    )

    const { address, display_name } = response.data

    // Extract meaningful location name
    const city = address.city || address.town || address.village || address.county
    const country = address.country
    const state = address.state

    let locationName = display_name

    // Create a cleaner location name
    if (city && country) {
      locationName = `${city}, ${country}`
      if (state && state !== city && state !== country) {
        locationName = `${city}, ${state}, ${country}`
      }
    }

    return {
      display_name: locationName,
      country,
      city,
      state,
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    // Return a generic location name
    return {
      display_name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    }
  }
}

export async function geocode(
  locationName: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await axios.get<NominatimResult[]>(
      `${NOMINATIM_BASE_URL}/search`,
      {
        params: {
          q: locationName,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'Pinspot-Travel-Map',
        },
      }
    )

    if (response.data.length === 0) {
      return null
    }

    const result = response.data[0]
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    }
  } catch (error) {
    console.error('Error geocoding:', error)
    return null
  }
}

export async function extractCountryAndCity(
  latitude: number,
  longitude: number
): Promise<{ country?: string; city?: string }> {
  try {
    const { country, city } = await reverseGeocode(latitude, longitude)
    return { country, city }
  } catch (error) {
    console.error('Error extracting country and city:', error)
    return {}
  }
}
