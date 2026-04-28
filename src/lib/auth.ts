import { supabase } from './supabase/client'
import { Profile, UserRole } from '@/types'

export async function signUp(email: string, password: string, name: string, role: UserRole) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error

  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email,
        name,
        role,
      })

    if (profileError) throw profileError
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile()
  return profile?.role === 'admin'
}

export async function isParent(): Promise<boolean> {
  const profile = await getCurrentProfile()
  return profile?.role === 'parent'
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export async function isParentActive(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('parents')
    .select('is_active')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    console.error('Error checking parent status:', error)
    return false
  }

  // Si no existe en parents o is_active es null/undefined, consideramos inactivo
  return data?.is_active ?? false
}

export async function checkIsParent(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('parents')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    console.error('Error checking if is parent:', error)
    return false
  }

  return !!data
}

export async function isAdminUser(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', email)
    .eq('role', 'admin')
    .maybeSingle()

  if (error) {
    console.error('Error checking if is admin:', error)
    return false
  }

  return !!data
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) throw error
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })
  if (error) throw error
}
