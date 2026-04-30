'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
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

  // SSR safety: immediately set loading to false on server
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const fetchProfile = useCallback(async (userId: string) => {
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
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    let isMounted = true
    let subscription: { unsubscribe: () => void } | null = null

    // Safety timeout - always clear loading state
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth safety timeout - forcing loading to false')
        setLoading(false)
      }
    }, 5000)

    const initAuth = async () => {
      try {
        // Setup auth state listener first
        const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
          if (!isMounted) return
          
          const newUser = session?.user ?? null
          setUser(prev => {
            if (prev?.id === newUser?.id) return prev
            return newUser
          })
          
          if (newUser) {
            // Use setTimeout to avoid calling supabase during the callback
            setTimeout(() => {
              if (isMounted) fetchProfile(newUser.id)
            }, 0)
          } else {
            setProfile(null)
            setLoading(false)
          }
        })
        subscription = data.subscription

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }
        
        const initialUser = session?.user ?? null
        setUser(initialUser)
        
        if (initialUser) {
          await fetchProfile(initialUser.id)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to get session:', err)
        if (isMounted) setLoading(false)
      }
    }

    initAuth()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription?.unsubscribe()
    }
  }, [isClient, fetchProfile])


  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  // During SSR, render with loading=false to avoid hydration issues
  // The client will immediately take over and initialize properly
  const value = isClient 
    ? { user, profile, loading, signOut, refreshProfile }
    : { user: null, profile: null, loading: false, signOut: async () => {}, refreshProfile: async () => {} }

  return (
    <AuthContext.Provider value={value}>
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
