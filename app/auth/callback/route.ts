import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=Invalid code`)
    }

    // Get the user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Check if user profile exists
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Create user profile for OAuth users
        const username = user.email?.split('@')[0] || `user_${Date.now()}`
        await supabase.from('users').insert([
          {
            id: user.id,
            email: user.email,
            username,
            is_public: false,
            created_at: new Date().toISOString(),
          },
        ])
      }
    }

    return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
  }

  return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=No code provided`)
}
