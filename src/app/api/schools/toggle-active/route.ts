import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const { id, active } = await request.json()
    if (!id || active === undefined) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('schools').update({ active }).eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Escuela ${active ? 'activada' : 'inhabilitada'}` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}