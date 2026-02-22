import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin' // Usamos nuestra utilidad pro

// 1. FORZAR DINÁMICO: Crucial para que Vercel no falle al compilar
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const courseId = formData.get('courseId') as string
    const studentId = formData.get('studentId') as string
    const trimestre = formData.get('trimestre') as string
    const anio = formData.get('anio') as string

    // Validaciones de datos
    if (!file || !courseId || !studentId || !trimestre || !anio) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 })
    }

    // 2. Verificar sesión del usuario que sube (Preceptor/Directivo)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Sesión expirada o no autorizada' }, { status: 401 })
    }

    // 3. Inicializar Supabase Admin de forma segura (Lazy load)
    const supabaseAdmin = getSupabaseAdmin()

    // 4. Lógica SaaS: Obtener el school_id del alumno para que la libreta quede bien etiquetada
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('school_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'No se encontró el alumno o su institución' }, { status: 404 })
    }

    // 5. Preparar archivo para Storage
    // Estructura de carpetas pro: school_id / curso_id / alumno_id / trimestre.pdf
    const fileName = `${student.school_id}/${courseId}/${studentId}/T${trimestre}-${anio}-${Date.now()}.pdf`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir al Bucket 'libretas'
    const { error: uploadError } = await supabaseAdmin.storage
      .from('libretas')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Error Storage:', uploadError)
      return NextResponse.json({ error: 'Error al subir el archivo físico' }, { status: 500 })
    }

    // 6. Obtener URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('libretas')
      .getPublicUrl(fileName)

    // 7. Registro en DB (Upsert manual)
    // Buscamos si ya existe una libreta para este periodo
    const { data: existing } = await supabaseAdmin
      .from('libretas')
      .select('id')
      .eq('student_id', studentId)
      .eq('trimestre', trimestre)
      .eq('anio', anio)
      .maybeSingle()

    const dbPayload = {
      school_id: student.school_id,
      course_id: courseId,
      student_id: studentId,
      trimestre: trimestre,
      anio: anio,
      archivo_url: publicUrl,
      archivo_nombre: file.name,
      uploaded_by: user.id,
      updated_at: new Date().toISOString()
    }

    let result
    if (existing) {
      result = await supabaseAdmin.from('libretas').update(dbPayload).eq('id', existing.id).select()
    } else {
      result = await supabaseAdmin.from('libretas').insert(dbPayload).select()
    }

    if (result.error) {
      throw result.error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Libreta procesada correctamente',
      url: publicUrl 
    })

  } catch (error: any) {
    console.error('Crash en API Libretas:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}