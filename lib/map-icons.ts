import L from 'leaflet'

/**
 * Create a pin icon using emoji
 * Uses the 📍 emoji as the map marker
 */
export function createEmojiPinIcon() {
  return L.divIcon({
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        border: 2px solid #3B82F6;
        font-size: 24px;
      ">
        📍
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'emoji-pin-icon',
  })
}
