import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/utils/supabase/admin'

export async function POST(request: Request) {
  try {
    const { email, fullName, role, schoolId, password } = await request.json()

    if (!email || !fullName || !role || !schoolId || !password) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    let userId: string

    // 1. Buscar si el usuario ya existe en Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === email)

    if (existingUser) {
      // El usuario ya existe, usamos su ID
      userId = existingUser.id
      
      // Actualizar su contraseña (por si acaso)
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { full_name: fullName }
      })
    } else {
      // 2. Crear usuario nuevo si no existe
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        password,
        user_metadata: {
          full_name: fullName
        }
      })

      if (authError) {
        console.error('Error creando usuario:', authError)
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        )
      }

      if (!authData.user) {
        return NextResponse.json(
          { error: 'Error al crear usuario' },
          { status: 400 }
        )
      }

      userId = authData.user.id
    }

    // 3. Crear o actualizar el perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        role: role,
        school_id: schoolId
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Error creando perfil:', profileError)
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: `✅ ${role === 'docente' ? 'Profesor' : 'Preceptor'} creado/actualizado correctamente. Su contraseña provisional es: ${password}`
    })

  } catch (error: any) {
    console.error('Error en invite-user:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}