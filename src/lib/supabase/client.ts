import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Client singleton - initialized once on browser
let clientInstance: SupabaseClient | null = null

// Initialize immediately if in browser
if (typeof window !== 'undefined') {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (url && key) {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // Disable to avoid lock issues on reload
        storageKey: 'sb-auth-token',
        flowType: 'pkce',
        storage: {
          getItem: (key) => {
            try {
              return Promise.resolve(localStorage.getItem(key))
            } catch {
              return Promise.resolve(null)
            }
          },
          setItem: (key, value) => {
            try {
              localStorage.setItem(key, value)
            } catch {}
            return Promise.resolve()
          },
          removeItem: (key) => {
            try {
              localStorage.removeItem(key)
            } catch {}
            return Promise.resolve()
          },
        }
      }
    })
  }
}

// Export the client instance (or throw error if not initialized)
export const supabase: SupabaseClient = clientInstance ?? (() => {
  throw new Error('Supabase client not initialized - missing env vars or not in browser')
})()

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
