'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import DestinationForm from '@/components/destinations/DestinationForm'
import DestinationCard from '@/components/destinations/DestinationCard'
import type { Pin, Photo, Tag } from '@/lib/types'

export default function DestinationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [destinations, setDestinations] = useState<(Pin & { photos: Photo[]; tags: Tag[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'destinations' | 'settings'>('destinations')
  const [showForm, setShowForm] = useState(false)
  const [editingPin, setEditingPin] = useState<(Pin & { photos: Photo[]; tags: Tag[] }) | null>(null)

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
      await fetchDestinations(user.id)
      setLoading(false)
    }

    getUser()
  }, [router])

  const fetchDestinations = async (userId: string) => {
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

      setDestinations(data || [])
    } catch (error) {
      console.error('Error fetching destinations:', error)
    }
  }

  const handleAddDestination = () => {
    setEditingPin(null)
    setShowForm(true)
  }

  const handleEditDestination = (pin: Pin & { photos: Photo[]; tags: Tag[] }) => {
    setEditingPin(pin)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingPin(null)
  }

  const handleFormSave = async () => {
    await fetchDestinations(user.id)
    handleFormClose()
  }

  const handleDeleteDestination = async (pinId: string) => {
    if (!confirm('Are you sure you want to delete this destination?')) return

    try {
      const { error } = await supabase.from('pins').delete().eq('id', pinId)

      if (error) throw error

      await fetchDestinations(user.id)
    } catch (error) {
      console.error('Error deleting destination:', error)
      alert('Failed to delete destination')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg"></div>
              <span className="text-xl font-bold text-gray-900">Pinspot</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Map
              </Link>
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

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('destinations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'destinations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Destinations
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'destinations' ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Destinations</h1>
                <p className="text-gray-600">
                  {destinations.length} {destinations.length === 1 ? 'destination' : 'destinations'}
                </p>
              </div>
              <button
                onClick={handleAddDestination}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                + Add Destination
              </button>
            </div>

            {/* Destination Grid */}
            {showForm ? (
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {editingPin ? 'Edit Destination' : 'Add New Destination'}
                </h2>
                <DestinationForm
                  userId={user?.id}
                  pin={editingPin}
                  onClose={handleFormClose}
                  onSave={handleFormSave}
                />
              </div>
            ) : destinations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.553-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 16.382V5.618a1 1 0 00-1.553-.894L15 7"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No destinations yet</h3>
                <p className="text-gray-600 mb-6">Start creating your travel collection by adding your first destination!</p>
                <button
                  onClick={handleAddDestination}
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Your First Destination
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {destinations.map((destination) => (
                  <DestinationCard
                    key={destination.id}
                    destination={destination}
                    onEdit={() => handleEditDestination(destination)}
                    onDelete={() => handleDeleteDestination(destination.id)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Settings Tab */}
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

              {/* Public Profile Setting */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Public Profile</h3>
                    <p className="text-gray-600 mt-1">Make your destinations visible to others</p>
                  </div>
                  <Link
                    href={`/map/${user?.email?.split('@')[0]}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    View Profile
                  </Link>
                </div>
              </div>

              {/* Account Setting */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-gray-900">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <button
                onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
