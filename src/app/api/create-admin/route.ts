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
    const { name, email } = await request.json()
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nombre y email son requeridos' },
        { status: 400 }
      )
    }

    // 1. Crear usuario en auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'temporal123',
      email_confirm: true,
      user_metadata: { name, role: 'admin' }
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

    // 2. Crear perfil en profiles con rol admin
    console.log('Creando perfil para:', email, 'con ID:', userId)
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
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ name, role: 'admin' })
          .eq('id', userId)
          .select()
        
        if (updateError) {
          console.error('Error actualizando perfil:', updateError)
          throw updateError
        }
        console.log('Perfil actualizado:', updatedProfile)
      } else {
        throw profileError
      }
    } else {
      console.log('Perfil creado exitosamente:', profileData)
    }

    return NextResponse.json({
      success: true,
      message: 'Administrador creado exitosamente',
      userId,
      email,
      password: 'temporal123'
    })

  } catch (error: any) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear administrador' },
      { status: 500 }
    )
  }
}
