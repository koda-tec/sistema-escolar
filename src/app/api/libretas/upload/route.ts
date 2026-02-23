import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'
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

    const supabase = await createClient() // Cliente normal para Auth
    const supabaseAdmin = getSupabaseAdmin() // Cliente admin para bypass RLS y Storage

    // 1. OBTENER EL USUARIO ACTUAL (El que sube la libreta)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // 2. OBTENER EL SCHOOL_ID DEL ALUMNO
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('students')
      .select('school_id')
      .eq('id', studentId)
      .single()

    if (studentError || !studentData) {
      return NextResponse.json({ error: 'No se encontró la escuela del alumno' }, { status: 404 })
    }

    // 3. SUBIR A STORAGE
    const fileName = `${studentData.school_id}/${studentId}/${Date.now()}-${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const { error: storageError } = await supabaseAdmin.storage
      .from('libretas')
      .upload(fileName, Buffer.from(arrayBuffer), { contentType: 'application/pdf' })

    if (storageError) throw storageError

    const { data: { publicUrl } } = supabaseAdmin.storage.from('libretas').getPublicUrl(fileName)

    // 4. INSERTAR EN TABLA LIBRETAS CON TODOS LOS DATOS
    const { error: dbError } = await supabaseAdmin.from('libretas').insert({
      school_id: studentData.school_id, // <--- YA NO SERÁ NULL
      student_id: studentId,
      course_id: courseId,
      trimestre: parseInt(trimestre),
      anio: parseInt(anio),
      archivo_url: publicUrl,
      archivo_nombre: file.name,
      uploaded_by: user.id // <--- AHORA SABEMOS QUIÉN FUE
    })

    if (dbError) throw dbError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error en upload:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}