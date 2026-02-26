import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'
import { sendPushNotification } from '@/app/utils/push/sender'

const resend = new Resend(process.env.RESEND_API_KEY)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { courseId } = body
    
    if (!courseId) throw new Error("courseId no recibido")

    const supabaseAdmin = getSupabaseAdmin()
    const hoy = new Date().toISOString().split('T')[0]

    // 1. Buscamos inasistencias
    const { data: inasistencias, error: queryError } = await supabaseAdmin
      .from('attendance')
      .select(`
        status,
        students!inner (
          full_name,
          parent_id,
          profiles:parent_id (
            email,
            full_name
          )
        )
      `)
      .eq('status', 'ausente')
      .eq('date', hoy)
      .eq('students.course_id', courseId)

    if (queryError) {
      console.error("❌ Error Supabase:", queryError)
      throw queryError
    }

    if (!inasistencias || inasistencias.length === 0) {
      return NextResponse.json({ success: true, message: 'Sin ausentes hoy.' })
    }

    // 2. Procesamos envíos uno por uno
    // CORRECCIÓN: Tipamos reg como 'any' para evitar que TS se queje de la estructura de Supabase
    for (const reg of (inasistencias as any[])) {
      
      // Acceso seguro a los datos del estudiante
      const studentData = Array.isArray(reg.students) ? reg.students[0] : reg.students;
      const parentProfile = Array.isArray(studentData?.profiles) ? studentData.profiles[0] : studentData?.profiles;

      const studentName = studentData?.full_name
      const parentEmail = parentProfile?.email
      const parentId = studentData?.parent_id

      // A. Intento de EMAIL
      if (parentEmail) {
        try {
          await resend.emails.send({
            from: 'KodaEd <alertas@kodatec.app>',
            to: [parentEmail],
            subject: `⚠️ Inasistencia: ${studentName}`,
            html: `<p>Aviso: ${studentName} no ingresó a la escuela hoy.</p>`
          })
          console.log(`📧 Email enviado a ${parentEmail}`)
        } catch (e: any) {
          console.error(`❌ Falló email para ${studentName}:`, e.message)
        }
      }

      // B. Intento de PUSH
      if (parentId) {
        try {
          console.log(`📱 Intentando Push para ID: ${parentId}`)
          await sendPushNotification(
            parentId,
            "⚠️ Aviso de Inasistencia",
            `${studentName} no ingresó a la escuela hoy.`,
            "/dashboard/hijos"
          )
          console.log(`✅ Push enviada a ${studentName}`)
        } catch (e: any) {
          console.error(`❌ Falló Push para ${studentName}:`, e.message)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Procesados ${inasistencias.length} alumnos.` 
    })

  } catch (error: any) {
    console.error('❌ CRASH TOTAL API NOTIFICAR:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
