import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server' // Usamos tu helper de servidor
import { getSupabaseAdmin } from '@/app/utils/supabase/admin' // Importamos la función

// Evita errores durante el build analizando cookies
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { nuevaPassword, userId } = await request.json()

    if (!nuevaPassword || !userId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // 1. Crear el cliente de Supabase (Server Component style)
    const supabase = await createClient()

    // 2. Cambiar contraseña del usuario actual (Auth)
    const { error: authError } = await supabase.auth.updateUser({
      password: nuevaPassword
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // 3. Inicializar el admin usando la nueva función (Soluciona el error de TS)
    const supabaseAdmin = getSupabaseAdmin()
    
    // 4. Actualizar el campo en la tabla profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', userId)

    if (profileError) {
      console.error('Error actualizando perfil:', profileError)
      // No cortamos el flujo aquí porque la clave en Auth ya se cambió con éxito
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Contraseña actualizada correctamente' 
    })

  } catch (error: any) {
    console.error('Error general en cambiar-password:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}