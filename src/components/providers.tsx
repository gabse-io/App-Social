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
    let isMounted = true
    let subscription: { unsubscribe: () => void } | null = null

    // Timeout safety - ensure loading always ends
    const timeoutId = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 10000)

    const initAuth = async () => {
      try {
        // Primero configurar el listener para evitar race condition
        const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!isMounted) return
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
            setLoading(false)
          }
        })
        subscription = data.subscription

        // Pequeño delay para evitar conflicto de locks con onAuthStateChange
        await new Promise(r => setTimeout(r, 100))
        
        if (!isMounted) return

        // Ahora obtener la sesión inicial
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) {
          console.error('Error getting session:', error)
        }
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
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
