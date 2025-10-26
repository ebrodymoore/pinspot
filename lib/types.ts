export interface User {
  id: string
  username: string
  email: string
  is_public: boolean
  last_import_date: string | null
  created_at: string
}

export interface Pin {
  id: string
  user_id: string
  latitude: number
  longitude: number
  location_name: string
  visit_date: string | null
  notes: string | null
  source: 'manual' | 'google_photos'
  created_at: string
  updated_at: string
}

export interface Photo {
  id: string
  pin_id: string
  storage_path: string
  google_photo_id: string | null
  display_order: number
  taken_date: string | null
}

export interface Tag {
  id: string
  pin_id: string
  tag_name: string
}

export interface ImportJob {
  id: string
  user_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  photos_imported: number
  pins_created: number
  started_at: string
  completed_at: string | null
  error_message: string | null
}

export interface GooglePhotoMetadata {
  id: string
  filename: string
  mimeType: string
  mediaMetadata: {
    creationTime: string
    width: string
    height: string
    photo?: {
      cameraMake?: string
      cameraModel?: string
      focalLength?: number
      apertureFNumber?: number
      isoEquivalent?: number
      exposureTime?: string
    }
    video?: {
      duration: string
      fps: number
      status: string
    }
  }
  filename_lowercase?: string
}

export interface PhotoWithLocation {
  id: string
  filename: string
  latitude: number
  longitude: number
  timestamp: Date
  mimeType: string
}

export interface LocationCluster {
  latitude: number
  longitude: number
  locationName: string
  photos: PhotoWithLocation[]
  earliestTimestamp: Date
}

export interface DashboardStats {
  totalPins: number
  totalPhotos: number
  countriesVisited: number
  citiesVisited: number
  dateRange: {
    earliest: string | null
    latest: string | null
  }
  tagBreakdown: {
    tagName: string
    count: number
  }[]
}

export interface ShareableProfile {
  username: string
  isPublic: boolean
  stats: DashboardStats
  pins: (Pin & { photos: Photo[]; tags: Tag[] })[]
}
