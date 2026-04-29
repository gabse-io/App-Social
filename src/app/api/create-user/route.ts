import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Configuración de Supabase incompleta' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  try {
    const { name, email, phone, isAdmin, isParent } = await request.json()
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nombre y email son requeridos' },
        { status: 400 }
      )
    }

    if (!isAdmin && !isParent) {
      return NextResponse.json(
        { error: 'Debes seleccionar al menos un rol' },
        { status: 400 }
      )
    }

    // 1. Crear usuario en auth.users
    const role = isAdmin ? 'admin' : 'parent'
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'temporal123',
      email_confirm: true,
      user_metadata: { name, role }
    })

    if (authError) {
      if (authError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 409 }
        )
      }
      throw authError
    }

    const userId = authData.user?.id
    if (!userId) {
      throw new Error('No se pudo obtener el ID del usuario creado')
    }

    // 2. Crear perfil en profiles si es admin
    if (isAdmin) {
      console.log('Creando perfil de admin para:', email, 'con ID:', userId)
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email,
          name,
          role: 'admin'
        })
        .select()

      if (profileError) {
        console.error('Error creando perfil:', profileError)
        // Si ya existe el perfil, actualizarlo
        if (profileError.message?.includes('duplicate') || profileError.code === '23505') {
          console.log('Perfil ya existe, actualizando...')
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ name, role: 'admin' })
            .eq('id', userId)
          
          if (updateError) {
            console.error('Error actualizando perfil:', updateError)
            throw updateError
          }
        } else {
          throw profileError
        }
      }
    }

    // 3. Crear registro en parents si es padre
    if (isParent) {
      console.log('Creando registro de padre para:', email)
      const { error: parentError } = await supabaseAdmin
        .from('parents')
        .insert({
          name,
          email,
          phone: phone || '',
          is_active: true
        })
        .select()

      if (parentError) {
        console.error('Error creando padre:', parentError)
        // Si ya existe el padre, actualizarlo
        if (parentError.message?.includes('duplicate') || parentError.code === '23505') {
          console.log('Padre ya existe, actualizando...')
          const { error: updateError } = await supabaseAdmin
            .from('parents')
            .update({ name, phone: phone || '' })
            .eq('email', email)
          
          if (updateError) {
            console.error('Error actualizando padre:', updateError)
            throw updateError
          }
        } else {
          throw parentError
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      userId,
      email,
      password: 'temporal123'
    })

  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
