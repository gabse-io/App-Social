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
    const { name, email, phone } = await request.json()
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nombre y email son requeridos' },
        { status: 400 }
      )
    }

    // 1. Crear usuario en auth.users usando admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'temporal123',
      email_confirm: true, // Auto-confirmar email para evitar rate limit
      user_metadata: {
        name,
        role: 'parent'
      }
    })

    if (authError) {
      // Si el usuario ya existe, buscarlo
      if (authError.message.includes('already exists')) {
        // Buscar usuario por email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find((u: any) => u.email === email)
        
        if (existingUser) {
          // Continuar con el usuario existente
          const userId = existingUser.id
          
          // 2. Crear/actualizar perfil usando RPC
          const { error: profileError } = await supabaseAdmin.rpc('insert_or_update_profile', {
            p_id: userId,
            p_email: email,
            p_name: name,
            p_role: 'parent',
          })
          
          if (profileError) {
            return NextResponse.json(
              { error: 'Error al crear perfil: ' + profileError.message },
              { status: 500 }
            )
          }
          
          // 3. Crear padre en tabla parents
          const { error: parentError } = await supabaseAdmin
            .from('parents')
            .insert({ name, email, phone, is_active: true })
          
          if (parentError) {
            return NextResponse.json(
              { error: 'Error al crear padre: ' + parentError.message },
              { status: 500 }
            )
          }
          
          return NextResponse.json({
            success: true,
            message: 'Padre creado exitosamente',
            email,
            password: 'temporal123'
          })
        }
      }
      
      return NextResponse.json(
        { error: 'Error al crear usuario: ' + authError.message },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // 2. Crear perfil
    const { error: profileError } = await supabaseAdmin.rpc('insert_or_update_profile', {
      p_id: userId,
      p_email: email,
      p_name: name,
      p_role: 'parent',
    })

    if (profileError) {
      return NextResponse.json(
        { error: 'Error al crear perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    // 3. Crear padre en tabla parents
    const { error: parentError } = await supabaseAdmin
      .from('parents')
      .insert({ name, email, phone, is_active: true })

    if (parentError) {
      return NextResponse.json(
        { error: 'Error al crear padre: ' + parentError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Padre creado exitosamente',
      email,
      password: 'temporal123'
    })
    
  } catch (error: any) {
    console.error('Error en API create-parent:', error)
    return NextResponse.json(
      { error: 'Error interno: ' + error.message },
      { status: 500 }
    )
  }
}
