import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const supabaseAdmin = (() => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set - admin operations will fail')
  }
  return createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey)
})()

// Helper functions for common operations
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateUserProfile(userId: string, updates: Partial<any>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserPins(userId: string) {
  const { data, error } = await supabase
    .from('pins')
    .select(`
      *,
      photos (
        id,
        storage_path,
        google_photo_id,
        display_order,
        taken_date
      ),
      tags (
        id,
        tag_name
      )
    `)
    .eq('user_id', userId)
    .order('visit_date', { ascending: false })

  if (error) throw error
  return data
}

export async function getPublicUserProfile(username: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      username,
      is_public,
      created_at,
      pins (
        *,
        photos (
          id,
          storage_path,
          google_photo_id,
          display_order,
          taken_date
        ),
        tags (
          id,
          tag_name
        )
      )
    `)
    .eq('username', username)
    .eq('is_public', true)
    .single()

  if (error) throw error
  return data
}

export async function createPin(pinData: any) {
  const { data, error } = await supabase
    .from('pins')
    .insert([pinData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePin(pinId: string, updates: any) {
  const { data, error } = await supabase
    .from('pins')
    .update(updates)
    .eq('id', pinId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePin(pinId: string) {
  const { error } = await supabase
    .from('pins')
    .delete()
    .eq('id', pinId)

  if (error) throw error
}

export async function createImportJob(jobData: any) {
  const { data, error } = await supabase
    .from('import_jobs')
    .insert([jobData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getImportJob(jobId: string) {
  const { data, error } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) throw error
  return data
}

export async function updateImportJob(jobId: string, updates: any) {
  const { data, error } = await supabase
    .from('import_jobs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw error
  return data
}
