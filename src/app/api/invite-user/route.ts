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

    // Crear usuario directamente con contraseña
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

    // Crear el perfil con el rol y school_id (SIN el campo email)
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          role: role,
          school_id: schoolId
        })

      if (profileError) {
        console.error('Error creando perfil:', profileError)
        return NextResponse.json(
          { error: profileError.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `✅ ${role === 'docente' ? 'Profesor' : 'Preceptor'} creado correctamente. Su contraseña provisional es: ${password}`
    })

  } catch (error: any) {
    console.error('Error en invite-user:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}