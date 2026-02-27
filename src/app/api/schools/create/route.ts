import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'

export async function POST(request: Request) {
  try {
    const { name, slug } = await request.json()

    if (!name || !slug) {
      return NextResponse.json({ error: 'Faltan datos (name o slug)' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verificar si el slug ya existe para evitar duplicados
    const { data: existing } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'El slug ya está en uso por otra escuela' }, { status: 409 })
    }

    const { data, error } = await supabaseAdmin
      .from('schools')
      .insert({ name, slug, active: true })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}