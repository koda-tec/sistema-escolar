import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin' // Usaremos el cliente Admin

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID de la escuela' }, { status: 400 })
    }

    // Usamos el cliente Admin para saltarse RLS si es necesario
    const supabaseAdmin = getSupabaseAdmin()
    
    const { error } = await supabaseAdmin.from('schools').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Escuela eliminada correctamente' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}