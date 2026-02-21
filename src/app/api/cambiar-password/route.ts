import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { nuevaPassword, userId } = await request.json()

    if (!nuevaPassword || !userId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Crear cliente con cookies para mantener la sesión
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // 1. Cambiar contraseña con el cliente normal (mantiene la sesión)
    const { error: authError } = await supabase.auth.updateUser({
      password: nuevaPassword
    })

    if (authError) {
      console.error('Error cambiando contraseña:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // 2. Importar supabaseAdmin para actualizar el campo must_change_password
    const { supabaseAdmin } = await import('@/app/utils/supabase/admin')
    
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', userId)

    if (profileError) {
      console.error('Error actualizando perfil:', profileError)
      // No retornamos error aquí porque la contraseña sí se cambió
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