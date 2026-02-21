import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/utils/supabase/admin'

export async function POST(request: Request) {
  try {
    const { nuevaPassword, userId } = await request.json()

    if (!nuevaPassword || !userId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // 1. Actualizar contraseña en Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: nuevaPassword
    })

    if (authError) {
      console.error('Error en Auth:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // 2. Actualizar must_change_password a false (USANDO ADMIN CLIENT)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', userId)

    if (profileError) {
      console.error('Error en Profile:', profileError)
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Contraseña actualizada correctamente' 
    })

  } catch (error: any) {
    console.error('Error general:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}