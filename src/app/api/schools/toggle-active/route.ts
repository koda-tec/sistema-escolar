import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'

export async function POST(request: Request) {
  try {
    const { id, active } = await request.json()
    
    // Validación robusta: Verificamos que 'active' sea explícitamente booleano
    if (!id || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'Faltan datos válidos (id o estado activo)' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin.from('schools').update({ active }).eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Escuela ${active ? 'activada' : 'inhabilitada'}` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}