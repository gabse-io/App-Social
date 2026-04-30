import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Client singleton - only initialized on browser
let clientInstance: SupabaseClient | null = null

// Cola de operaciones para serializar llamadas a auth (evita locks)
let authQueue: Promise<any> = Promise.resolve()
let isProcessingAuth = false

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
        detectSessionInUrl: false,
        storageKey: 'sb-auth-token',
        flowType: 'implicit',
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
  
  return clientInstance
}

// Serializa operaciones de auth para evitar locks concurrentes
export function serializeAuth<T>(operation: () => Promise<T>): Promise<T> {
  const promise = authQueue.then(async () => {
    isProcessingAuth = true
    try {
      // Pequeño delay entre operaciones para liberar el event loop
      await new Promise(r => setTimeout(r, 50))
      return await operation()
    } finally {
      isProcessingAuth = false
    }
  })
  
  authQueue = promise.catch(() => {})
  return promise
}

// Export cliente directo - acceso lazy pero estable
export const supabase = {
  get auth() { 
    const client = getClient()
    return {
      ...client.auth,
      // Override methods that need serialization
      getSession: () => serializeAuth(() => client.auth.getSession()),
      getUser: () => serializeAuth(() => client.auth.getUser()),
      signInWithPassword: (credentials: any) => serializeAuth(() => client.auth.signInWithPassword(credentials)),
      signOut: () => serializeAuth(() => client.auth.signOut()),
      updateUser: (attrs: any) => serializeAuth(() => client.auth.updateUser(attrs)),
      signUp: (credentials: any) => serializeAuth(() => client.auth.signUp(credentials)),
      resetPasswordForEmail: (email: string, options?: any) => serializeAuth(() => client.auth.resetPasswordForEmail(email, options)),
      onAuthStateChange: (callback: any) => client.auth.onAuthStateChange(callback),
      admin: client.auth.admin,
    }
  },
  get from() { return getClient().from.bind(getClient()) },
  get rpc() { return getClient().rpc.bind(getClient()) },
  get storage() { return getClient().storage },
  get realtime() { return getClient().realtime },
  get channel() { return getClient().channel.bind(getClient()) },
  get removeChannel() { return getClient().removeChannel.bind(getClient()) },
  get removeAllChannels() { return getClient().removeAllChannels.bind(getClient()) },
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
