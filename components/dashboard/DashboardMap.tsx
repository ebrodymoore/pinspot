'use client'

import { useRef, useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { Pin, Photo, Tag } from '@/lib/types'
import AddPinModal from './AddPinModal'
import { supabase } from '@/lib/supabase'
import { createEmojiPinIcon } from '@/lib/map-icons'

interface DashboardMapProps {
  pins: (Pin & { photos: Photo[]; tags: Tag[] })[]
  userId: string
  onPinsChange: () => void
}

export default function DashboardMap({
  pins,
  userId,
  onPinsChange,
}: DashboardMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.MarkerClusterGroup | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    null
  )

  const pinIcon = createEmojiPinIcon()

  useEffect(() => {
    if (mapRef.current) return

    const map = L.map('dashboard-map', {
      center: [20, 0],
      zoom: 3,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }),
      ],
    })

    const markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 80,
      disableClusteringAtZoom: 16,
    }) as L.MarkerClusterGroup

    map.addLayer(markerClusterGroup)
    markersRef.current = markerClusterGroup

    // Handle map click
    map.on('click', (e: L.LeafletMouseEvent) => {
      setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
      setShowAddModal(true)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers
  useEffect(() => {
    if (!markersRef.current) return

    markersRef.current.clearLayers()

    pins.forEach((pin) => {
      const marker = L.marker([pin.latitude, pin.longitude], { icon: pinIcon })

      const popupContent = `
        <div style="min-width: 250px; padding: 8px;">
          <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">${pin.location_name}</h3>
          ${pin.visit_date ? `<p style="font-size: 12px; color: #666; margin-bottom: 8px;">${new Date(pin.visit_date).toLocaleDateString()}</p>` : ''}
          ${pin.notes ? `<p style="font-size: 12px; color: #555; margin-bottom: 8px;">${pin.notes}</p>` : ''}
          ${pin.tags.length > 0 ? `<div style="margin-bottom: 8px; font-size: 11px;">${pin.tags.map(t => `<span style="display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 3px; margin-right: 4px;">${t.tag_name}</span>`).join('')}</div>` : ''}
          <button onclick="window.location.href='#pin-${pin.id}'" style="background: #2563eb; color: white; padding: 4px 12px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">View</button>
        </div>
      `

      marker.bindPopup(popupContent)
      markersRef.current?.addLayer(marker)
    })
  }, [pins, pinIcon])

  const handleAddPin = async (pinData: any) => {
    try {
      const { error } = await supabase.from('pins').insert([
        {
          user_id: userId,
          latitude: selectedLocation?.lat,
          longitude: selectedLocation?.lng,
          location_name: pinData.location_name,
          visit_date: pinData.visit_date || null,
          notes: pinData.notes || null,
          source: 'manual',
        },
      ])

      if (error) throw error

      setShowAddModal(false)
      setSelectedLocation(null)
      onPinsChange()
    } catch (error) {
      console.error('Error adding pin:', error)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div
          id="dashboard-map"
          className="w-full"
          style={{ height: '600px' }}
        />
      </div>

      {showAddModal && selectedLocation && (
        <AddPinModal
          location={selectedLocation}
          onSave={handleAddPin}
          onClose={() => {
            setShowAddModal(false)
            setSelectedLocation(null)
          }}
        />
      )}
    </>
  )
}
