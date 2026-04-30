'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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

  useEffect(() => {
    // Flag para tracking de montaje
    let isMounted = true
    let subscription: { unsubscribe: () => void } | null = null
    let isInitialized = false

    // Timeout safety - ensure loading always ends
    const timeoutId = setTimeout(() => {
      if (isMounted && !isInitialized) {
        console.warn('Auth initialization timeout')
        setLoading(false)
      }
    }, 8000)

    const initAuth = async () => {
      try {
        // Secuencia: 1) Configurar listener primero
        const { data } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
          if (!isMounted) return
          
          // Solo actualizar si hay cambio real
          setUser(prev => {
            if (prev?.id === session?.user?.id) return prev
            return session?.user ?? null
          })
          
          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
            setLoading(false)
          }
        })
        subscription = data.subscription

        // Secuencia: 2) Esperar a que cualquier operación pendiente termine
        await new Promise(r => setTimeout(r, 150))
        
        if (!isMounted) return

        // Secuencia: 3) Obtener sesión inicial (ahora es seguro)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        isInitialized = true
        
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

    // Iniciar solo si estamos en el cliente
    if (typeof window !== 'undefined') {
      initAuth()
    } else {
      setLoading(false)
    }

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      // Cleanup con delay para evitar conflictos con operaciones pendientes
      setTimeout(() => {
        subscription?.unsubscribe()
      }, 100)
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
