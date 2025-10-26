'use client'

import type { Pin, Photo, Tag } from '@/lib/types'
import Image from 'next/image'

interface PinPopupProps {
  pin: Pin & { photos: Photo[]; tags: Tag[] }
  onSelect?: () => void
}

export default function PinPopup({ pin, onSelect }: PinPopupProps) {
  return (
    <div className="p-4 bg-white rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{pin.location_name}</h3>

      {pin.visit_date && (
        <p className="text-sm text-gray-600 mb-2">
          {new Date(pin.visit_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}

      {pin.notes && <p className="text-gray-700 text-sm mb-4">{pin.notes}</p>}

      {pin.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {pin.tags.map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
            >
              {tag.tag_name}
            </span>
          ))}
        </div>
      )}

      {pin.photos.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2">
            {pin.photos.length} photo{pin.photos.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {pin.photos.slice(0, 6).map((photo) => (
              <Image
                key={photo.id}
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${photo.storage_path}`}
                alt="Travel photo"
                width={64}
                height={64}
                className="w-full h-16 object-cover rounded"
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onSelect}
        className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
      >
        View Details
      </button>
    </div>
  )
}
