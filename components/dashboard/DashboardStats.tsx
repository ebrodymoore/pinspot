'use client'

import type { Pin, Photo, Tag } from '@/lib/types'

interface DashboardStatsProps {
  pins: (Pin & { photos: Photo[]; tags: Tag[] })[]
}

export default function DashboardStats({ pins }: DashboardStatsProps) {
  // Calculate statistics
  const totalPins = pins.length
  const totalPhotos = pins.reduce((acc, pin) => acc + pin.photos.length, 0)

  // Get unique countries and cities
  const locations = pins.map((pin) => pin.location_name)
  const uniqueLocations = new Set(locations)

  // Get unique countries (rough estimate from location names)
  const countries = new Set<string>()
  pins.forEach((pin) => {
    const parts = pin.location_name.split(',')
    if (parts.length > 0) {
      const country = parts[parts.length - 1].trim()
      countries.add(country)
    }
  })

  // Get tag breakdown
  const tagCounts = new Map<string, number>()
  pins.forEach((pin) => {
    pin.tags.forEach((tag) => {
      tagCounts.set(tag.tag_name, (tagCounts.get(tag.tag_name) || 0) + 1)
    })
  })

  // Get date range
  const dates = pins
    .filter((pin) => pin.visit_date)
    .map((pin) => new Date(pin.visit_date!).getTime())
    .sort((a, b) => a - b)

  const earliestDate = dates.length > 0 ? new Date(dates[0]) : null
  const latestDate = dates.length > 0 ? new Date(dates[dates.length - 1]) : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600 text-sm mb-1">Total Locations</p>
        <p className="text-3xl font-bold text-gray-900">{totalPins}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600 text-sm mb-1">Total Photos</p>
        <p className="text-3xl font-bold text-gray-900">{totalPhotos}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600 text-sm mb-1">Countries</p>
        <p className="text-3xl font-bold text-gray-900">{countries.size}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600 text-sm mb-1">Cities/Towns</p>
        <p className="text-3xl font-bold text-gray-900">{uniqueLocations.size}</p>
      </div>

      {earliestDate && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 text-sm mb-1">First Visit</p>
          <p className="text-lg font-semibold text-gray-900">
            {earliestDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
            })}
          </p>
        </div>
      )}

      {latestDate && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 text-sm mb-1">Latest Visit</p>
          <p className="text-lg font-semibold text-gray-900">
            {latestDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
            })}
          </p>
        </div>
      )}

      {tagCounts.size > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-2 lg:col-span-2">
          <p className="text-gray-600 text-sm mb-3 font-medium">Top Categories</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(tagCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([tag, count]) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {tag} ({count})
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
