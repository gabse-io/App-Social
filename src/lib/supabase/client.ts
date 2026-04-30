import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Client singleton - only initialized on browser
let clientInstance: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be used in browser')
  }
  
  if (!clientInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }
    
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-auth-token',
        flowType: 'pkce'
      }
    })
  }
  
  return clientInstance
}

// Export getter function instead of Proxy for better mobile compatibility
export function getSupabaseClient(): SupabaseClient {
  return getClient()
}

// For backward compatibility - direct lazy export
export const supabase = {
  get auth() { return getClient().auth },
  get from() { return getClient().from.bind(getClient()) },
  get rpc() { return getClient().rpc.bind(getClient()) },
  get storage() { return getClient().storage },
  get channel() { return getClient().channel.bind(getClient()) },
  get removeChannel() { return getClient().removeChannel.bind(getClient()) },
}

// For server-side usage (API routes)
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}
