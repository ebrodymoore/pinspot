'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { Pin, Photo, Tag } from '@/lib/types'

export default function PublicProfilePage() {
  const params = useParams()
  const username = params.username as string

  const [profile, setProfile] = useState<any>(null)
  const [pins, setPins] = useState<(Pin & { photos: Photo[]; tags: Tag[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(
            `
            id,
            username,
            is_public,
            created_at,
            pins (
              id,
              latitude,
              longitude,
              location_name,
              visit_date,
              notes,
              source,
              created_at,
              updated_at,
              photos (
                id,
                storage_path,
                google_photo_id,
                display_order,
                taken_date
              ),
              tags (
                id,
                tag_name
              )
            )
          `
          )
          .eq('username', username)
          .eq('is_public', true)
          .single()

        if (userError || !userData) {
          setError('Profile not found or is private')
          return
        }

        setProfile(userData)
        setPins(userData.pins || [])
      } catch (err: any) {
        setError(err.message || 'Error loading profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 6v2m0-6H9m12 0h3m-3 0v2m0-4v-2" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This profile is private or does not exist.'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Go Home
          </Link>
        </div>
      </main>
    )
  }

  // Calculate statistics
  const totalPins = pins.length
  const totalPhotos = pins.reduce((acc, pin) => acc + pin.photos.length, 0)

  const countries = new Set<string>()
  pins.forEach((pin) => {
    const parts = pin.location_name.split(',')
    if (parts.length > 0) {
      const country = parts[parts.length - 1].trim()
      countries.add(country)
    }
  })

  const uniqueLocations = new Set(pins.map((pin) => pin.location_name))

  const tagCounts = new Map<string, number>()
  pins.forEach((pin) => {
    pin.tags.forEach((tag) => {
      tagCounts.set(tag.tag_name, (tagCounts.get(tag.tag_name) || 0) + 1)
    })
  })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">Pinspot</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.username}&apos;s Travels
              </h1>
              <p className="text-gray-600">
                Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
            <button
              onClick={() => {
                const url = `${window.location.origin}/map/${username}`
                navigator.clipboard.writeText(url)
                alert('Profile URL copied to clipboard!')
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Share Profile
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">Locations</p>
              <p className="text-3xl font-bold text-gray-900">{totalPins}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">Photos</p>
              <p className="text-3xl font-bold text-gray-900">{totalPhotos}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">Countries</p>
              <p className="text-3xl font-bold text-gray-900">{countries.size}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">Cities</p>
              <p className="text-3xl font-bold text-gray-900">{uniqueLocations.size}</p>
            </div>
          </div>
        </div>

        {/* Locations List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Locations</h2>

          {pins.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-600">No locations shared yet.</p>
            </div>
          ) : (
            pins.map((pin) => (
              <div key={pin.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {pin.location_name}
                    </h3>
                    {pin.visit_date && (
                      <p className="text-sm text-gray-600 mb-3">
                        Visited: {new Date(pin.visit_date).toLocaleDateString()}
                      </p>
                    )}
                    {pin.notes && (
                      <p className="text-gray-700 mb-3">{pin.notes}</p>
                    )}

                    {pin.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {pin.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          >
                            {tag.tag_name}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
                    </p>
                  </div>

                  {pin.photos.length > 0 && (
                    <div className="w-full md:w-48">
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        {pin.photos.length} photo{pin.photos.length !== 1 ? 's' : ''}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {pin.photos.slice(0, 6).map((photo) => (
                          <Image
                            key={photo.id}
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${photo.storage_path}`}
                            alt="Travel photo"
                            width={80}
                            height={80}
                            className="w-full h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
