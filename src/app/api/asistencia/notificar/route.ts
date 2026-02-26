import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'
import { sendPushNotification } from '@/app/utils/push/sender'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
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
      // DENTRO DEL LOOP DE INASISTENCIAS EN LA API:
      if (parentEmail) {
        try {
          await resend.emails.send({
            from: 'KodaEd <alertas@kodatec.app>',
            to: [parentEmail],
            subject: `⚠️ Aviso de inasistencia: ${studentName}`,
            html: `
              <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                <div style="background-color: #2563eb; padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">KodaEd Avisa</h1>
                </div>
                <div style="padding: 30px;">
                  <p>Hola <strong>${reg.students.profiles?.full_name || 'Padre/Tutor'}</strong>,</p>
                  <p>Te informamos que tu hijo/a <strong>${studentName}</strong> ha sido marcado/a como <strong>AUSENTE</strong> el día de hoy.</p>
                  <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-weight: bold; color: #ef4444;">ESTADO: AUSENTE</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">${new Date().toLocaleDateString('es-AR')}</p>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">Si consideras que esto es un error, por favor contacta a la preceptoría.</p>
                </div>
              </div>
            `
          })
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
