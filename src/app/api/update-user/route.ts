import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    const { userId, name, email, phone, isAdmin, isParent, originalRoles } = await request.json()
    
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'ID de usuario y email son requeridos' },
        { status: 400 }
      )
    }

    if (!isAdmin && !isParent) {
      return NextResponse.json(
        { error: 'El usuario debe tener al menos un rol' },
        { status: 400 }
      )
    }

    const results = {
      profile: null as any,
      parent: null as any,
      profileDeleted: false,
      parentDeleted: false,
      authUpdated: false
    }

    // 1. Actualizar perfil en auth.users (user_metadata)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          name,
          role: isAdmin ? 'admin' : 'parent'
        }
      }
    )
    if (authError) {
      console.error('Error updating auth user:', authError)
    } else {
      results.authUpdated = true
    }

    // 2. Gestionar perfil en tabla 'profiles'
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (isAdmin) {
      // Si debe ser admin, crear o actualizar perfil
      if (existingProfile) {
        // Actualizar
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({ name, role: 'admin' })
          .eq('id', userId)
          .select()
        if (error) throw error
        results.profile = data
      } else {
        // Crear nuevo
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .insert({ id: userId, email, name, role: 'admin' })
          .select()
        if (error) throw error
        results.profile = data
      }
    } else {
      // Ya no es admin, eliminar perfil si existe
      if (existingProfile) {
        const { error } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId)
        if (error) throw error
        results.profileDeleted = true
      }
    }

    // 3. Gestionar registro en tabla 'parents'
    const { data: existingParent } = await supabaseAdmin
      .from('parents')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (isParent) {
      // Si debe ser padre, crear o actualizar
      if (existingParent) {
        const { data, error } = await supabaseAdmin
          .from('parents')
          .update({ name, phone: phone || '' })
          .eq('email', email)
          .select()
        if (error) throw error
        results.parent = data
      } else {
        const { data, error } = await supabaseAdmin
          .from('parents')
          .insert({ name, email, phone: phone || '', is_active: true })
          .select()
        if (error) throw error
        results.parent = data
      }
    } else {
      // Ya no es padre, eliminar registro si existe
      if (existingParent) {
        const { error } = await supabaseAdmin
          .from('parents')
          .delete()
          .eq('email', email)
        if (error) throw error
        results.parentDeleted = true
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      results
    })

  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}
