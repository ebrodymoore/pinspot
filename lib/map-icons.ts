import L from 'leaflet'

/**
 * Create a pin icon using emoji
 * Uses the 📍 emoji as the map marker with transparent background
 */
export function createEmojiPinIcon() {
  return L.divIcon({
    html: `<div style="font-size: 32px; line-height: 1;">📍</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: 'emoji-pin-icon',
  })
}
