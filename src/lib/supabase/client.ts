import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton instance for client-side
let supabaseClient: SupabaseClient | null = null

function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  })
}

export function getSupabaseClient(): SupabaseClient {
  // Always return singleton on client-side
  if (typeof window !== 'undefined') {
    if (!supabaseClient) {
      supabaseClient = createSupabaseClient()
    }
    return supabaseClient
  }
  
  // Server-side: create new instance each time
  return createSupabaseClient()
}

// Create singleton for direct export (client-side only)
function getSingletonClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server-side: throw error if accessed directly
    throw new Error('Cannot access supabase singleton on server side. Use getSupabaseClient() instead.')
  }
  
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient()
  }
  return supabaseClient
}

// Export singleton with lazy initialization
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSingletonClient()
    return (client as any)[prop]
  }
})
