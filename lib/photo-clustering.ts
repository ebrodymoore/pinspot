import * as turf from '@turf/turf'
import { reverseGeocode } from './geocoding'
import type { PhotoWithLocation, LocationCluster } from './types'

const CLUSTER_RADIUS_KM = 1 // Group photos within 1km

export async function clusterPhotosByLocation(
  photos: PhotoWithLocation[]
): Promise<LocationCluster[]> {
  if (photos.length === 0) {
    return []
  }

  const clusters: LocationCluster[] = []
  const processedIndices = new Set<number>()

  for (let i = 0; i < photos.length; i++) {
    if (processedIndices.has(i)) {
      continue
    }

    const basePhoto = photos[i]
    const basePoint = turf.point([basePhoto.longitude, basePhoto.latitude])

    const clusterPhotos: PhotoWithLocation[] = [basePhoto]
    processedIndices.add(i)

    // Find all photos within CLUSTER_RADIUS_KM
    for (let j = i + 1; j < photos.length; j++) {
      if (processedIndices.has(j)) {
        continue
      }

      const otherPhoto = photos[j]
      const otherPoint = turf.point([otherPhoto.longitude, otherPhoto.latitude])

      const distance = turf.distance(basePoint, otherPoint, { units: 'kilometers' })

      if (distance <= CLUSTER_RADIUS_KM) {
        clusterPhotos.push(otherPhoto)
        processedIndices.add(j)
      }
    }

    // Calculate cluster center
    const points = clusterPhotos.map(p => turf.point([p.longitude, p.latitude]))
    const centroid = turf.centroid(turf.featureCollection(points))
    const [longitude, latitude] = centroid.geometry.coordinates

    // Get location name
    const { display_name: locationName } = await reverseGeocode(latitude, longitude)

    // Sort photos by date
    const sortedPhotos = clusterPhotos.sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    )

    clusters.push({
      latitude,
      longitude,
      locationName,
      photos: sortedPhotos,
      earliestTimestamp: sortedPhotos[0].timestamp,
    })
  }

  // Sort clusters by earliest timestamp
  return clusters.sort((a, b) =>
    a.earliestTimestamp.getTime() - b.earliestTimestamp.getTime()
  )
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const point1 = turf.point([lon1, lat1])
  const point2 = turf.point([lon2, lat2])
  return turf.distance(point1, point2, { units: 'kilometers' })
}

export function getPhotoGroupsWithinRadius(
  photos: PhotoWithLocation[],
  radiusKm: number = CLUSTER_RADIUS_KM
): Map<string, PhotoWithLocation[]> {
  const groups = new Map<string, PhotoWithLocation[]>()

  for (const photo of photos) {
    let foundGroup = false

    for (const [groupKey, groupPhotos] of groups) {
      const basePhoto = groupPhotos[0]
      const distance = calculateDistance(
        basePhoto.latitude,
        basePhoto.longitude,
        photo.latitude,
        photo.longitude
      )

      if (distance <= radiusKm) {
        groupPhotos.push(photo)
        foundGroup = true
        break
      }
    }

    if (!foundGroup) {
      const key = `${photo.latitude.toFixed(4)}_${photo.longitude.toFixed(4)}`
      groups.set(key, [photo])
    }
  }

  return groups
}
