'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import GooglePhotosImporter from '@/components/onboarding/GooglePhotosImporter'

export default function OnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // First, try to get the session from auth (which should exist right after signup)
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          console.log('✅ [OnboardingPage] Session found:', { userId: session.user.id })

          // Check if user profile exists in database
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log('📝 [OnboardingPage] Creating user profile for new user')
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email,
                  username: session.user.email?.split('@')[0] || `user_${Date.now()}`,
                },
              ])

            if (insertError) {
              console.warn('⚠️ [OnboardingPage] Could not create profile:', insertError.message)
              // Continue anyway - user might be able to use the app
            } else {
              console.log('✅ [OnboardingPage] User profile created successfully')
            }
          } else if (profileError) {
            console.warn('⚠️ [OnboardingPage] Error checking profile:', profileError.message)
          } else {
            console.log('✅ [OnboardingPage] User profile already exists')
          }

          setUser(session.user)
          setLoading(false)
          return
        }

        // If no session, try getUser() as fallback
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          console.log('❌ [OnboardingPage] No authenticated user found, redirecting to login')
          router.push('/auth/login')
          return
        }

        console.log('✅ [OnboardingPage] User found:', { userId: user.id })
        setUser(user)
        setLoading(false)
      } catch (err) {
        console.error('❌ [OnboardingPage] Error checking auth:', err)
        router.push('/auth/login')
      }
    }

    initializeUser()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (skipped) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All set!</h2>
          <p className="text-gray-600 mb-6">You can now start mapping your travels.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <GooglePhotosImporter
        userId={user?.id}
        onSkip={() => setSkipped(true)}
      />
    </main>
  )
}
