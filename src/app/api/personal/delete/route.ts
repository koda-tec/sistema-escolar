import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const { targetUserId } = await request.json()
    if (!targetUserId) {
      return NextResponse.json({ error: 'Falta el ID del usuario' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que quien hace la solicitud es un directivo
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', currentUser.id)
      .maybeSingle()

    if (currentProfile?.role !== 'directivo') {
      return NextResponse.json({ error: 'No tienes permisos para eliminar personal' }, { status: 403 })
    }

    // Verificar que el usuario a eliminar pertenece a la misma escuela y no sea directivo
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('school_id, role')
      .eq('id', targetUserId)
      .maybeSingle()

    if (!targetProfile) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    if (targetProfile.school_id !== currentProfile.school_id) {
      return NextResponse.json({ error: 'No puedes eliminar usuarios de otra escuela' }, { status: 403 })
    }

    if (targetProfile.role === 'directivo') {
      return NextResponse.json({ error: 'No puedes eliminar a otro directivo' }, { status: 400 })
    }

    // Eliminar perfil
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', targetUserId)

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}