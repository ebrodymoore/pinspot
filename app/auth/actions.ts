'use server'

import { supabaseAdmin } from '@/lib/supabase'

export async function createUserProfile(userId: string, email: string, username: string) {
  try {
    console.log('📝 [Server] Creating user profile', { userId, email, username })

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
      console.error('❌ [Server] Error creating user profile:', error.message)
      return { success: false, error: error.message }
    }

    console.log('✅ [Server] User profile created successfully')
    return { success: true, data }
  } catch (err: any) {
    console.error('❌ [Server] Unexpected error creating user profile:', err)
    return { success: false, error: err.message }
  }
}
