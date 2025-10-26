import { google } from 'googleapis'
import axios from 'axios'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.warn('Missing Google OAuth environment variables')
}

export function getGoogleAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
}

export function getAuthorizationUrl() {
  const oauth2Client = getGoogleAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/photoslibrary.readonly',
    ],
    prompt: 'consent',
  })
}

export async function getAccessTokenFromCode(code: string) {
  const oauth2Client = getGoogleAuthClient()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getGoogleAuthClient()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

interface PhotoItem {
  id: string
  filename: string
  mimeType: string
  mediaMetadata: {
    creationTime: string
    width: string
    height: string
    photo?: Record<string, any>
  }
}

interface GeoLocation {
  latitude: number
  longitude: number
}

interface PhotoItemWithLocation extends PhotoItem {
  geoLocation?: GeoLocation
}

export async function fetchPhotosWithLocation(
  accessToken: string,
  dateRange?: { start: Date; end: Date }
) {
  const photosWithLocation: PhotoItemWithLocation[] = []
  let pageToken: string | undefined

  try {
    do {
      const response = await axios.post(
        'https://photoslibrary.googleapis.com/v1/mediaItems:search',
        {
          pageSize: 100,
          pageToken,
          filters: {
            dateFilter: dateRange ? {
              ranges: [
                {
                  startDate: {
                    year: dateRange.start.getFullYear(),
                    month: dateRange.start.getMonth() + 1,
                    day: dateRange.start.getDate(),
                  },
                  endDate: {
                    year: dateRange.end.getFullYear(),
                    month: dateRange.end.getMonth() + 1,
                    day: dateRange.end.getDate(),
                  },
                },
              ],
            } : undefined,
            mediaTypeFilter: {
              mediaTypes: ['PHOTO'],
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data.mediaItems) {
        photosWithLocation.push(...response.data.mediaItems)
      }

      pageToken = response.data.nextPageToken
    } while (pageToken)

    return photosWithLocation
  } catch (error) {
    console.error('Error fetching photos from Google Photos:', error)
    throw error
  }
}

export async function getPhotoMetadataWithLocation(
  photoId: string,
  accessToken: string
): Promise<GeoLocation | null> {
  try {
    const response = await axios.get(
      `https://photoslibrary.googleapis.com/v1/mediaItems/${photoId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (response.data?.geoLocation?.latitude && response.data?.geoLocation?.longitude) {
      return {
        latitude: response.data.geoLocation.latitude,
        longitude: response.data.geoLocation.longitude,
      }
    }

    return null
  } catch (error) {
    console.error(`Error fetching photo metadata for ${photoId}:`, error)
    return null
  }
}

export async function downloadPhotoBuffer(photoUrl: string): Promise<Buffer> {
  try {
    const response = await axios.get(photoUrl, {
      responseType: 'arraybuffer',
    })
    return Buffer.from(response.data)
  } catch (error) {
    console.error('Error downloading photo:', error)
    throw error
  }
}

export function parsePhotoUrl(photoUrl: string): string {
  // Google Photos URLs come with =w1920-h1080 or similar params
  // We want to remove those for cleaner storage
  return photoUrl.split('=')[0]
}

export async function batchFetchPhotoLocations(
  photoIds: string[],
  accessToken: string,
  batchSize = 10
) {
  const results = new Map<string, GeoLocation | null>()

  for (let i = 0; i < photoIds.length; i += batchSize) {
    const batch = photoIds.slice(i, i + batchSize)
    const promises = batch.map(id =>
      getPhotoMetadataWithLocation(id, accessToken).then(location => ({
        id,
        location,
      }))
    )

    const batchResults = await Promise.all(promises)
    batchResults.forEach(({ id, location }) => {
      results.set(id, location)
    })

    // Rate limiting: wait 1 second between batches
    if (i + batchSize < photoIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return results
}

export interface OAuthTokens {
  access_token: string
  refresh_token?: string
  expiry_date?: number
  scope?: string
  token_type?: string
}
