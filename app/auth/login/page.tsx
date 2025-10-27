'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authLogger } from '@/lib/auth-logger'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle OAuth redirect
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        authLogger.debug('LoginPage', 'Checking for existing auth session')

        // Check if user is already authenticated from OAuth
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          authLogger.warn('LoginPage', 'Error checking auth session', authError.message)
          return
        }

        if (user) {
          authLogger.authSessionCheck(user.id, true)
          authLogger.info('LoginPage', 'Authenticated user detected, redirecting to onboarding')
          router.push('/onboarding')
        } else {
          authLogger.authSessionCheck(null, false)
          authLogger.debug('LoginPage', 'No authenticated user found')
        }
      } catch (err) {
        authLogger.error('LoginPage', 'Error in auth callback', err as Error)
      }
    }

    handleAuthCallback()
  }, [router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Log to console immediately
      console.log('🔐 [LoginPage] Starting email sign in', { email })
      authLogger.authSigninStart(email, 'email')

      // Validate inputs
      if (!email || !password) {
        const validationError = 'Email and password are required'
        console.error('❌ [LoginPage] Validation error:', validationError)
        setError(validationError)
        setLoading(false)
        return
      }

      console.log('📤 [LoginPage] Calling supabase.auth.signInWithPassword')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('📨 [LoginPage] Response from Supabase:', { hasError: !!error, data: !!data })

      if (error) {
        const errorMsg = `Auth Error [${error.status}]: ${error.message}`
        console.error('❌ [LoginPage] Auth error:', errorMsg)
        authLogger.authSigninError(email, error.message)
        setError(errorMsg)
        setLoading(false)
        return
      }

      if (!data.user) {
        const errorMsg = 'Sign in succeeded but no user data returned'
        console.error('❌ [LoginPage]', errorMsg)
        setError(errorMsg)
        setLoading(false)
        return
      }

      console.log('✅ [LoginPage] Sign in successful', { userId: data.user.id, email })
      authLogger.authSigninSuccess(data.user.id, email)

      console.log('🚀 [LoginPage] Redirecting to /onboarding')
      router.push('/onboarding')
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred during sign in'
      console.error('❌ [LoginPage] Unexpected error:', err)
      setError(errorMsg)
      authLogger.error('LoginPage', 'Email sign in error', err as Error, { email })
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get the correct origin - use location.origin which will be the current domain
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectUrl = `${origin}/auth/login`

      console.log('🔐 [LoginPage] Starting Google login', { origin, redirectUrl })
      authLogger.oauthStart('google', redirectUrl)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          scopes: 'https://www.googleapis.com/auth/photoslibrary.readonly',
        },
      })

      if (error) {
        console.error('❌ [LoginPage] Google OAuth error:', error)
        authLogger.oauthError('google', error.message)
        throw error
      }

      console.log('✅ [LoginPage] Google OAuth redirect initiated to:', redirectUrl)
      authLogger.info('LoginPage', 'Google OAuth redirect initiated')
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred with Google sign in'
      console.error('❌ [LoginPage] Google login error:', errorMsg)
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
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mb-6 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-900 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.91 2.347l2.307-2.307C18.747 1.86 16.421 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            />
          </svg>
          Sign in with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
