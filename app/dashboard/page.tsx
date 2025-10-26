'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import DashboardMap from '@/components/dashboard/DashboardMap'
import DashboardStats from '@/components/dashboard/DashboardStats'
import PinFilters from '@/components/dashboard/PinFilters'
import type { Pin, Photo, Tag } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [pins, setPins] = useState<(Pin & { photos: Photo[]; tags: Tag[] })[]>([])
  const [filteredPins, setFilteredPins] = useState<(Pin & { photos: Photo[]; tags: Tag[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)
      await fetchPins(user.id)
      setLoading(false)
    }

    getUser()
  }, [router])

  const fetchPins = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('pins')
        .select(`
          *,
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
        `)
        .eq('user_id', userId)
        .order('visit_date', { ascending: false })

      if (error) throw error

      setPins(data || [])
      setFilteredPins(data || [])
    } catch (error) {
      console.error('Error fetching pins:', error)
    }
  }

  useEffect(() => {
    // Filter pins based on selected tags and search query
    let filtered = pins

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((pin) =>
        pin.tags.some((tag) => selectedTags.includes(tag.tag_name))
      )
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((pin) =>
        pin.location_name.toLowerCase().includes(query)
      )
    }

    setFilteredPins(filtered)
  }, [pins, selectedTags, searchQuery])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your map...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">Pinspot</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href={`/map/${user?.email?.split('@')[0]}`}
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Public Profile
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Settings
            </Link>
            <button
              onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Travels</h1>
          <p className="text-gray-600">
            {pins.length} {pins.length === 1 ? 'location' : 'locations'} pinned
          </p>
        </div>

        {/* Stats */}
        <DashboardStats pins={pins} />

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Map View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                List View
              </button>
            </div>
          </div>

          <PinFilters pins={pins} selectedTags={selectedTags} onTagsChange={setSelectedTags} />
        </div>

        {/* Main Content */}
        {viewMode === 'map' ? (
          <DashboardMap pins={filteredPins} userId={user?.id} onPinsChange={() => fetchPins(user?.id)} />
        ) : (
          <div className="space-y-4">
            {filteredPins.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 003 16.382V5.618a1 1 0 011.553-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 16.382V5.618a1 1 0 00-1.553-.894L15 7" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations found</h3>
                <p className="text-gray-600 mb-6">Start mapping your travels by adding your first pin!</p>
                <Link
                  href="/settings"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Location
                </Link>
              </div>
            ) : (
              filteredPins.map((pin) => (
                <div key={pin.id} className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{pin.location_name}</h3>
                  {pin.visit_date && (
                    <p className="text-sm text-gray-600 mb-2">
                      Visited: {new Date(pin.visit_date).toLocaleDateString()}
                    </p>
                  )}
                  {pin.notes && <p className="text-gray-700 mb-4">{pin.notes}</p>}
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
                  {pin.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {pin.photos.map((photo) => (
                        <Image
                          key={photo.id}
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${photo.storage_path}`}
                          alt="Travel photo"
                          width={80}
                          height={80}
                          className="h-20 w-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  )
}
