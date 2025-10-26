'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface GooglePhotosImporterProps {
  userId: string
  onSkip: () => void
}

export default function GooglePhotosImporter({
  userId,
  onSkip,
}: GooglePhotosImporterProps) {
  const router = useRouter()
  const [step, setStep] = useState<'welcome' | 'importing' | 'complete'>('welcome')
  const [progress, setProgress] = useState(0)
  const [importing, setImporting] = useState(false)

  const handleStartImport = async () => {
    setImporting(true)
    setStep('importing')

    try {
      // Use Supabase OAuth for Google Photos
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'https://www.googleapis.com/auth/photoslibrary.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
    } catch (error) {
      console.error('Error starting import:', error)
      setImporting(false)
    }
  }

  const handleSkip = async () => {
    // Mark that user has skipped onboarding
    try {
      await supabase
        .from('users')
        .update({ last_import_date: new Date().toISOString() })
        .eq('id', userId)
    } catch (error) {
      console.error('Error updating user:', error)
    }
    onSkip()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {step === 'welcome' && (
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="inline-block w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Your Travels</h1>
            <p className="text-gray-600">
              Connect your Google Photos to automatically import photos with location data
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Here&apos;s what happens:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>We&apos;ll ask permission to access your Google Photos</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>We extract location data from your photos&apos; metadata</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Nearby photos are grouped into single map pins</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>You review and customize before finalizing</span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-amber-900">
              <strong>Privacy:</strong> We only access photos with location data. Your data is processed securely
              and only stored in your private account.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium"
            >
              Skip for Now
            </button>
            <button
              onClick={handleStartImport}
              disabled={importing}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.91 2.347l2.307-2.307C18.747 1.86 16.421 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              Import from Google Photos
            </button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Importing Your Photos</h2>
          <p className="text-gray-600 mb-6">Redirecting to Google Photos...</p>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}
