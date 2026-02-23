import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const studentId = formData.get('studentId') as string
    const courseId = formData.get('courseId') as string
    const trimestre = formData.get('trimestre') as string
    const anio = formData.get('anio') as string

    if (!file || !studentId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

    const supabase = getSupabaseAdmin()

    // 1. Subir a Storage
    const fileName = `${studentId}/${Date.now()}-${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const { error: storageError } = await supabase.storage
      .from('libretas')
      .upload(fileName, Buffer.from(arrayBuffer), { contentType: 'application/pdf' })

    if (storageError) throw storageError

    const { data: { publicUrl } } = supabase.storage.from('libretas').getPublicUrl(fileName)

    // 2. Insertar en tabla libretas
    const { error: dbError } = await supabase.from('libretas').insert({
      student_id: studentId,
      course_id: courseId,
      trimestre: parseInt(trimestre),
      anio: parseInt(anio),
      archivo_url: publicUrl,
      archivo_nombre: file.name
    })

    if (dbError) throw dbError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}