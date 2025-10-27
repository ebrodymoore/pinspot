'use client'

import { useEffect, useRef, useState } from 'react'
import L, { LatLng, Map as LeafletMap } from 'leaflet'
import 'leaflet.markercluster'
import type { Pin, Photo, Tag } from '@/lib/types'
import PinPopup from './PinPopup'
import { createEmojiPinIcon } from '@/lib/map-icons'

interface LeafletMapProps {
  pins: (Pin & { photos: Photo[]; tags: Tag[] })[]
  onAddPin?: (latLng: LatLng) => void
  onSelectPin?: (pin: Pin & { photos: Photo[]; tags: Tag[] }) => void
  editable?: boolean
}

export default function LeafletMapComponent({
  pins,
  onAddPin,
  onSelectPin,
  editable = false,
}: LeafletMapProps) {
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<L.MarkerClusterGroup | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Custom pin icon - emoji
  const pinIcon = createEmojiPinIcon()

  useEffect(() => {
    if (mapRef.current) return

    // Initialize map
    const map = L.map('leaflet-map', {
      center: [20, 0],
      zoom: 3,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }),
      ],
    })

    // Add marker cluster layer
    const markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 80,
      disableClusteringAtZoom: 16,
    }) as L.MarkerClusterGroup

    map.addLayer(markerClusterGroup)
    markersRef.current = markerClusterGroup

    // Handle map click to add pin
    if (editable) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onAddPin) {
          onAddPin(e.latlng)
        }
      })
    }

    // Add zoom control
    map.zoomControl.setPosition('topleft')

    // Add locate control
    const LocateControl = L.Control.extend({
      onAdd: () => {
        const btn = L.DomUtil.create('button', 'leaflet-control-locate')
        btn.title = 'Locate me'
        btn.innerHTML = '🎯'
        btn.style.cssText = `
          background-color: white;
          border: 2px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          padding: 8px 12px;
          font-size: 16px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
        `

        btn.addEventListener('click', () => {
          navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords
            map.setView([latitude, longitude], 13)
          })
        })

        return btn
      },
    })

    new LocateControl({ position: 'topleft' }).addTo(map)

    mapRef.current = map

    setMapReady(true)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [editable, onAddPin])

  // Update markers when pins change
  useEffect(() => {
    if (!mapReady || !markersRef.current) return

    markersRef.current.clearLayers()

    pins.forEach((pin) => {
      const marker = L.marker([pin.latitude, pin.longitude], { icon: pinIcon })

      marker.bindPopup(
        L.popup({ maxWidth: 300 }).setContent(
          `<div id="popup-${pin.id}" style="min-width: 250px;"></div>`
        )
      )

      marker.on('popupopen', () => {
        const popupElement = document.getElementById(`popup-${pin.id}`)
        if (popupElement) {
          // We'll render React component here via root.render
          const root = createRoot(popupElement)
          root.render(<PinPopup pin={pin} onSelect={() => onSelectPin?.(pin)} />)
        }
      })

      markersRef.current?.addLayer(marker)
    })
  }, [pins, mapReady, onSelectPin, pinIcon])

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg">
      <div
        id="leaflet-map"
        className="w-full"
        style={{ height: '500px' }}
      />
    </div>
  )
}

// Simple import for React root
import { createRoot } from 'react-dom/client'
