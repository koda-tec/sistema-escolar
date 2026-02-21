// src/app/utils/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    // Durante el build, esto evitará que el programa explote
    // simplemente devolverá null o lanzará error SOLO cuando se llame
    throw new Error('Missing Supabase Admin Env Vars')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}