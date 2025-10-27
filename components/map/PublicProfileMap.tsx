'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Pin, Photo, Tag } from '@/lib/types'

interface PublicProfileMapProps {
  pins: (Pin & { photos: Photo[]; tags: Tag[] })[]
}

// Custom pin icon
const pinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function PublicProfileMap({ pins }: PublicProfileMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainerRef.current || !pins.length) return

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [pins[0].latitude, pins[0].longitude],
        10
      )

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current)
    }

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer)
      }
    })

    // Add markers for each pin
    pins.forEach((pin) => {
      if (mapRef.current) {
        const marker = L.marker([pin.latitude, pin.longitude], { icon: pinIcon })
          .bindPopup(`
            <div class="w-48">
              <h3 class="font-semibold text-gray-900">${pin.location_name}</h3>
              ${pin.visit_date ? `<p class="text-sm text-gray-600">Visited: ${new Date(pin.visit_date).toLocaleDateString()}</p>` : ''}
              ${pin.notes ? `<p class="text-sm text-gray-700 mt-2">${pin.notes}</p>` : ''}
              ${
                pin.tags.length > 0
                  ? `<div class="flex flex-wrap gap-1 mt-2">
                       ${pin.tags.map((tag) => `<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">${tag.tag_name}</span>`).join('')}
                     </div>`
                  : ''
              }
            </div>
          `)
          .addTo(mapRef.current)
      }
    })

    // Fit bounds to all markers
    if (pins.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(pins.map((pin) => [pin.latitude, pin.longitude]))
      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [pins])

  if (pins.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden h-96 flex items-center justify-center">
        <p className="text-gray-600">No locations to display on map</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
      <div ref={mapContainerRef} className="w-full h-96" />
    </div>
  )
}
