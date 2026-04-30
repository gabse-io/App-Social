'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Profile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('[Auth] Initializing auth...')
    
    // Timeout safety - ensure loading always ends
    const timeoutId = setTimeout(() => {
      console.log('[Auth] Timeout reached, forcing loading=false')
      setLoading(false)
    }, 10000) // 10 segundos máximo

    // Get initial session
    console.log('[Auth] Calling getSession...')
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[Auth] getSession result:', { hasSession: !!session, error: error?.message })
      if (error) {
        console.error('[Auth] Error getting session:', error)
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('[Auth] User found, fetching profile...')
        fetchProfile(session.user.id)
      } else {
        console.log('[Auth] No session, setting loading=false')
        setLoading(false)
      }
    }).catch((err) => {
      console.error('[Auth] Failed to get session:', err)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data)
        if (!data) {
          console.log('No profile found for user:', userId)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
