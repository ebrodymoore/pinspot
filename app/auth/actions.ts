'use server'

import { supabaseAdmin } from '@/lib/supabase'

export async function createUserProfile(userId: string, email: string, username: string) {
  try {
    console.log('📝 [Server] Creating user profile', { userId, email, username })

    // Wait a moment for auth.users record to be created
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check if auth user exists first
    const { data: authUser, error: checkError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (checkError || !authUser) {
      console.warn('⚠️ [Server] Auth user not found yet, but continuing with profile creation')
    } else {
      console.log('✅ [Server] Auth user verified:', { id: authUser.user.id, email: authUser.user.email })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: userId,
          email,
          username,
        },
      ])
      .select()

    if (error) {
      console.error('❌ [Server] Error creating user profile:', error.message, error.code)
      return { success: false, error: error.message }
    }

    console.log('✅ [Server] User profile created successfully')
    return { success: true, data }
  } catch (err: any) {
    console.error('❌ [Server] Unexpected error creating user profile:', err)
    return { success: false, error: err.message }
  }
}
