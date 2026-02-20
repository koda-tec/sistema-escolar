import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/utils/supabase/admin'

export async function POST(request: Request) {
  try {
    const { email, fullName, role, schoolId } = await request.json()

    if (!email || !fullName || !role || !schoolId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Invitar usuario usando el cliente de admin
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: fullName,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
      }
    )

    if (error) {
      console.error('Error invitando usuario:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Actualizar el perfil con el rol y school_id
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          role: role,
          school_id: schoolId,
          full_name: fullName
        })
        .eq('id', data.user.id)

      if (profileError) {
        console.error('Error actualizando perfil:', profileError)
        return NextResponse.json(
          { error: profileError.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Invitación enviada a ${email}` 
    })

  } catch (error: any) {
    console.error('Error en invite-user:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}