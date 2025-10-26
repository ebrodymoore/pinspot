import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pinspot - Map Your Travels',
  description: 'Create an interactive map of all the places you\'ve visited. Import photos from Google Photos and explore your travel history.',
  openGraph: {
    title: 'Pinspot - Map Your Travels',
    description: 'Create an interactive map of all the places you\'ve visited.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
        />
      </head>
      <body className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        {children}
      </body>
    </html>
  )
}
