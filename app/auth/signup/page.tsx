'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authLogger } from '@/lib/auth-logger'
import { createUserProfile } from '../actions'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle OAuth redirect - only check on initial mount and when hash/URL changes
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Only process OAuth callback if we have a hash fragment (from OAuth redirect)
        const hash = typeof window !== 'undefined' ? window.location.hash : ''
        if (!hash.includes('access_token')) {
          authLogger.debug('SignupPage', 'No OAuth token in URL, skipping callback')
          return
        }

        authLogger.debug('SignupPage', 'Checking for OAuth callback')

        // Check if user is already authenticated from OAuth
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          authLogger.warn('SignupPage', 'Error checking auth session', authError.message)
          return
        }

        if (user) {
          authLogger.authSessionCheck(user.id, true)
          authLogger.oauthCallbackDetected('google', !!user)
          authLogger.info('SignupPage', 'OAuth user detected, checking for profile')

          // Check if profile exists
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            authLogger.userProfileError(user.id, profileError.message, 'Profile query error')
            return
          }

          if (!profile) {
            // Create user profile for OAuth users
            const autoUsername = user.email?.split('@')[0] || `user_${Date.now()}`
            authLogger.debug('SignupPage', 'Creating profile for OAuth user', {
              userId: user.id,
              email: user.email,
              username: autoUsername,
            })

            try {
              await supabase.from('users').insert([
                {
                  id: user.id,
                  email: user.email,
                  username: autoUsername,
                  is_public: false,
                },
              ])

              authLogger.userProfileCreated(user.id, user.email || '', autoUsername)
            } catch (err) {
              authLogger.userProfileError(user.id, err as Error, 'Failed to create profile')
              // Continue anyway, profile might have been created by trigger
            }
          } else {
            authLogger.debug('SignupPage', 'Profile already exists for OAuth user', {
              userId: user.id,
              username: profile.username,
            })
          }

          authLogger.authSignupSuccess(user.id, user.email || '')
          authLogger.info('SignupPage', 'OAuth signup complete, redirecting to onboarding')
          router.push('/onboarding')
        } else {
          authLogger.authSessionCheck(null, false)
          authLogger.debug('SignupPage', 'No OAuth session found')
        }
      } catch (err) {
        authLogger.error('SignupPage', 'Error in OAuth callback', err as Error)
      }
    }

    handleAuthCallback()
  }, [router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('🔐 [SignupPage] Starting email signup', { email, username })
      authLogger.authSignupStart(email, 'email')
      authLogger.debug('SignupPage', 'Starting email signup', { email, username })

      // Validate inputs
      if (!email || !password || !username) {
        const validationError = 'Email, password, and username are required'
        console.error('❌ [SignupPage] Validation error:', validationError)
        setError(validationError)
        setLoading(false)
        return
      }

      console.log('📤 [SignupPage] Calling supabase.auth.signUp')
      // Sign up with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      console.log('📨 [SignupPage] Response from Supabase:', { hasError: !!authError, data: !!data })

      if (authError) {
        const errorMsg = `Signup Error [${authError.status}]: ${authError.message}`
        console.error('❌ [SignupPage] Auth error:', errorMsg)
        authLogger.authSignupError(email, authError.message)
        setError(errorMsg)
        setLoading(false)
        return
      }

      if (!data.user) {
        const err = 'Failed to create user - no user returned from Supabase'
        console.error('❌ [SignupPage]', err)
        authLogger.authSignupError(email, err)
        setError(err)
        setLoading(false)
        return
      }

      console.log('✅ [SignupPage] Signup successful', { userId: data.user.id, email, username })
      authLogger.authSignupSuccess(data.user.id, email)

      // Create user profile using server action (bypasses RLS)
      console.log('📝 [SignupPage] Creating user profile in database')
      const profileResult = await createUserProfile(data.user.id, email, username)

      if (!profileResult.success) {
        console.warn('⚠️ [SignupPage] Profile creation warning:', profileResult.error)
        // Don't fail signup if profile creation fails, trigger might have already created it
      } else {
        console.log('✅ [SignupPage] User profile created successfully')
      }

      console.log('🚀 [SignupPage] Redirecting to /onboarding')
      router.push('/onboarding')
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred during sign up'
      console.error('❌ [SignupPage] Unexpected error:', err)
      setError(errorMsg)
      authLogger.error('SignupPage', 'Email signup error', err as Error, { email, username })
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get the correct origin - use location.origin which will be the current domain
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectUrl = `${origin}/auth/signup`

      console.log('🔐 [SignupPage] Starting Google signup', { origin, redirectUrl })
      authLogger.oauthStart('google', redirectUrl)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          scopes: 'https://www.googleapis.com/auth/photoslibrary.readonly',
        },
      })

      if (error) {
        console.error('❌ [SignupPage] Google OAuth error:', error)
        authLogger.oauthError('google', error.message)
        throw error
      }

      console.log('✅ [SignupPage] Google OAuth redirect initiated to:', redirectUrl)
      authLogger.info('SignupPage', 'Google OAuth redirect initiated')
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred with Google sign up'
      console.error('❌ [SignupPage] Google signup error:', errorMsg)
      setError(errorMsg)
      authLogger.oauthError('google', err as Error)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900">Pinspot</h1>
          <p className="text-gray-600 mt-2">Map your travels</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full mb-6 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-900 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.91 2.347l2.307-2.307C18.747 1.86 16.421 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            />
          </svg>
          Sign up with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="your_username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          <p>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
