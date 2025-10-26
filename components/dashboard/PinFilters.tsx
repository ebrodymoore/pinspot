'use client'

import type { Pin, Photo, Tag } from '@/lib/types'

interface PinFiltersProps {
  pins: (Pin & { photos: Photo[]; tags: Tag[] })[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export default function PinFilters({
  pins,
  selectedTags,
  onTagsChange,
}: PinFiltersProps) {
  // Get all unique tags
  const allTags = new Set<string>()
  pins.forEach((pin) => {
    pin.tags.forEach((tag) => {
      allTags.add(tag.tag_name)
    })
  })

  const sortedTags = Array.from(allTags).sort()

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  if (sortedTags.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Category</h3>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagToggle(tag)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedTags.includes(tag)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tag}
          </button>
        ))}
        {selectedTags.length > 0 && (
          <button
            onClick={() => onTagsChange([])}
            className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full text-sm font-medium transition"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
