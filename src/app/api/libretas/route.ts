
import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'
import { createClient as createClientAdmin } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const courseId = formData.get('courseId') as string
    const studentId = formData.get('studentId') as string
    const trimestre = formData.get('trimestre') as string
    const anio = formData.get('anio') as string

    if (!file || !courseId || !studentId || !trimestre || !anio) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 })
    }

    // Obtener usuario actual
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Generar nombre único para el archivo
    const fileName = `${courseId}/${studentId}/trimestre-${trimestre}-${anio}-${Date.now()}.pdf`

    // Subir archivo a Supabase Storage
    const supabaseAdmin = createClientAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: uploadError } = await supabaseAdmin.storage
      .from('libretas')
      .upload(fileName, file, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Error subiendo archivo:', uploadError)
      return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
    }

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('libretas')
      .getPublicUrl(fileName)

    // Guardar registro en la base de datos
    const supabaseClient = createClientAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar si ya existe una libreta para este alumno, curso, trimestre y año
    const { data: existing } = await supabaseClient
      .from('libretas')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .eq('trimestre', parseInt(trimestre))
      .eq('anio', parseInt(anio))
      .single()

    let result
    if (existing) {
      // Actualizar libreta existente
      result = await supabaseClient
        .from('libretas')
        .update({
          archivo_url: publicUrl,
          archivo_nombre: file.name,
          uploaded_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Crear nueva libreta
      result = await supabaseClient
        .from('libretas')
        .insert({
          course_id: courseId,
          student_id: studentId,
          trimestre: parseInt(trimestre),
          anio: parseInt(anio),
          archivo_url: publicUrl,
          archivo_nombre: file.name,
          uploaded_by: user.id
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error guardando registro:', result.error)
      return NextResponse.json({ error: 'Error al guardar libreta' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      libreta: result.data,
      url: publicUrl
    })

  } catch (error: any) {
    console.error('Error general:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}