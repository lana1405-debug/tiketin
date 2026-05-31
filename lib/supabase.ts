import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client standar untuk client-side (pakai anon key, RLS aktif)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client admin untuk server-side API routes (pakai service_role, bypass RLS)
// JANGAN gunakan ini di client-side / komponen React!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null