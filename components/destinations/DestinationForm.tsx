'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { Pin, Photo, Tag } from '@/lib/types'

interface DestinationFormProps {
  userId: string
  pin?: (Pin & { photos: Photo[]; tags: Tag[] }) | null
  onClose: () => void
  onSave: () => void
}

export default function DestinationForm({ userId, pin, onClose, onSave }: DestinationFormProps) {
  const [locationName, setLocationName] = useState(pin?.location_name || '')
  const [visitDate, setVisitDate] = useState(pin?.visit_date || '')
  const [notes, setNotes] = useState(pin?.notes || '')
  const [latitude, setLatitude] = useState(pin?.latitude.toString() || '')
  const [longitude, setLongitude] = useState(pin?.longitude.toString() || '')
  const [isFavorite, setIsFavorite] = useState(pin ? pin.location_name.startsWith('⭐') : false)
  const [tags, setTags] = useState<string[]>(pin?.tags.map((t) => t.tag_name) || [])
  const [tagInput, setTagInput] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>(pin?.photos || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setPhotos([...photos, ...selectedFiles])
  }

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const removeExistingPhoto = async (photoId: string) => {
    try {
      const { error } = await supabase.from('photos').delete().eq('id', photoId)
      if (error) throw error
      setExistingPhotos(existingPhotos.filter((p) => p.id !== photoId))
    } catch (err) {
      console.error('Error deleting photo:', err)
    }
  }

  const uploadPhotos = async (pinId: string): Promise<string[]> => {
    const uploadedPaths: string[] = []

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      const fileName = `${pinId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      try {
        const { error } = await supabase.storage.from('photos').upload(fileName, file)

        if (error) throw error

        uploadedPaths.push(fileName)
      } catch (err) {
        console.error(`Error uploading photo ${i + 1}:`, err)
      }
    }

    return uploadedPaths
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!locationName.trim() || !latitude || !longitude) {
        setError('Please fill in location name, latitude, and longitude')
        setLoading(false)
        return
      }

      const finalLocationName = isFavorite ? `⭐ ${locationName}` : locationName

      if (pin) {
        // Update existing pin
        const { error: updateError } = await supabase
          .from('pins')
          .update({
            location_name: finalLocationName,
            visit_date: visitDate || null,
            notes: notes || null,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          })
          .eq('id', pin.id)

        if (updateError) throw updateError

        // Delete old tags and create new ones
        await supabase.from('tags').delete().eq('pin_id', pin.id)

        if (tags.length > 0) {
          const tagInserts = tags.map((tag) => ({
            pin_id: pin.id,
            tag_name: tag,
          }))
          const { error: tagError } = await supabase.from('tags').insert(tagInserts)
          if (tagError) throw tagError
        }

        // Upload new photos
        if (photos.length > 0) {
          const uploadedPaths = await uploadPhotos(pin.id)

          const photoInserts = uploadedPaths.map((path, index) => ({
            pin_id: pin.id,
            storage_path: path,
            display_order: existingPhotos.length + index,
          }))

          const { error: photoError } = await supabase.from('photos').insert(photoInserts)
          if (photoError) throw photoError
        }
      } else {
        // Create new pin
        const { data: newPin, error: pinError } = await supabase
          .from('pins')
          .insert([
            {
              user_id: userId,
              location_name: finalLocationName,
              visit_date: visitDate || null,
              notes: notes || null,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              source: 'manual',
            },
          ])
          .select()

        if (pinError) throw pinError
        if (!newPin || newPin.length === 0) throw new Error('Failed to create pin')

        const newPinId = newPin[0].id

        // Add tags
        if (tags.length > 0) {
          const tagInserts = tags.map((tag) => ({
            pin_id: newPinId,
            tag_name: tag,
          }))
          const { error: tagError } = await supabase.from('tags').insert(tagInserts)
          if (tagError) throw tagError
        }

        // Upload photos
        if (photos.length > 0) {
          const uploadedPaths = await uploadPhotos(newPinId)

          const photoInserts = uploadedPaths.map((path, index) => ({
            pin_id: newPinId,
            storage_path: path,
            display_order: index,
          }))

          const { error: photoError } = await supabase.from('photos').insert(photoInserts)
          if (photoError) throw photoError
        }
      }

      onSave()
    } catch (err: any) {
      setError(err.message || 'Failed to save destination')
      console.error('Error saving destination:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Location Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Location Name *</label>
        <input
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="e.g., Eiffel Tower, Paris"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Favorite Toggle */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="favorite"
          checked={isFavorite}
          onChange={(e) => setIsFavorite(e.target.checked)}
          className="h-4 w-4 text-blue-600 rounded"
        />
        <label htmlFor="favorite" className="ml-2 text-sm font-medium text-gray-700">
          Mark as favorite ⭐
        </label>
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Latitude *</label>
          <input
            type="number"
            step="0.00000001"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="-33.8688"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Longitude *</label>
          <input
            type="number"
            step="0.00000001"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="151.2093"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Visit Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visit Date</label>
        <input
          type="date"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this destination..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add a tag and press Enter"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-blue-700 hover:text-blue-900 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Existing Photos */}
      {existingPhotos.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Photos</label>
          <div className="grid grid-cols-4 gap-4">
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="relative">
                <Image
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${photo.storage_path}`}
                  alt="Destination photo"
                  width={100}
                  height={100}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(photo.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos</label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition"
        >
          <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <p className="text-gray-700 font-medium">Click to upload photos or drag and drop</p>
          <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </button

        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative">
                <Image
                  src={URL.createObjectURL(photo)}
                  alt="Selected photo"
                  width={100}
                  height={100}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Destination'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
