'use client'

import Image from 'next/image'
import type { Pin, Photo, Tag } from '@/lib/types'

interface DestinationCardProps {
  destination: Pin & { photos: Photo[]; tags: Tag[] }
  onEdit: () => void
  onDelete: () => void
}

export default function DestinationCard({ destination, onEdit, onDelete }: DestinationCardProps) {
  const firstPhoto = destination.photos[0]
  const visitDate = destination.visit_date ? new Date(destination.visit_date).toLocaleDateString() : 'Date not set'

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition overflow-hidden">
      {/* Photo */}
      {firstPhoto ? (
        <div className="relative h-40 bg-gray-200">
          <Image
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${firstPhoto.storage_path}`}
            alt={destination.location_name}
            fill
            className="object-cover"
          />
          {destination.photos.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm font-medium">
              +{destination.photos.length - 1} more
            </div>
          )}
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">{destination.location_name}</h3>

        {/* Visit Date */}
        <p className="text-sm text-gray-600 mb-3">{visitDate}</p>

        {/* Tags */}
        {destination.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {destination.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {tag.tag_name}
              </span>
            ))}
            {destination.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                +{destination.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Notes Preview */}
        {destination.notes && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{destination.notes}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium text-sm transition"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium text-sm transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
