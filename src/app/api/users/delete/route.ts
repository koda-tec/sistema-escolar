import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Falta id' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('profiles').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Usuario eliminado' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
