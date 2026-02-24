import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const padreId = searchParams.get('padreId')

    if (!padreId) {
      return NextResponse.json({ error: 'Falta padreId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, dni, course_id')
      .eq('parent_id', padreId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, alumnos: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}