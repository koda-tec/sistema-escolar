import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'

// 1. Inicializamos Resend con la API KEY de tus variables de entorno
const resend = new Resend(process.env.RESEND_API_KEY)

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { courseId } = await request.json()
    const supabaseAdmin = getSupabaseAdmin()
    
    // 2. Definimos la fecha de hoy en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split('T')[0]

    // 3. Buscamos las inasistencias de hoy para este curso
    // Traemos el nombre del alumno y el email del padre vinculado
    const { data: inasistencias, error: queryError } = await supabaseAdmin
      .from('attendance')
      .select(`
        status,
        date,
        students!inner (
          full_name,
          course_id,
          profiles!parent_id (
            email
          )
        )
      `)
      .eq('status', 'ausente')
      .eq('date', hoy)
      .eq('students.course_id', courseId)

    if (queryError) throw queryError

    if (!inasistencias || inasistencias.length === 0) {
      return NextResponse.json({ message: 'No hay inasistencias para notificar hoy en este curso.' })
    }

    // 4. Enviamos los correos uno por uno
    const emailPromises = inasistencias.map(async (registro: any) => {
      const emailPadre = registro.students.profiles?.email
      const nombreAlumno = registro.students.full_name

      if (!emailPadre) return null

      return resend.emails.send({
        from: 'Asistencia KodaEd <alertas@kodatec.app>',
        to: [emailPadre],
        subject: `⚠️ Aviso de Inasistencia: ${nombreAlumno}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Aviso de Inasistencia</h1>
            </div>
            <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
              <p>Estimado tutor/a,</p>
              <p>Le informamos que su hijo/a <strong>${nombreAlumno}</strong> ha sido marcado como <strong>AUSENTE</strong> en los registros de la institución el día de hoy.</p>
              <p style="background-color: #f8fafc; padding: 10px; border-radius: 8px; text-align: center; font-weight: bold;">
                Fecha: ${new Date().toLocaleDateString('es-AR')}
              </p>
              <p>Si considera que esto es un error, por favor comuníquese con la preceptoría o envíe una justificación a través de la App.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b; text-align: center;">
                Este es un mensaje automático de KodaEd para la seguridad de los alumnos.
              </p>
            </div>
          </div>
        `
      })
    })

    await Promise.all(emailPromises)

    return NextResponse.json({ 
      success: true, 
      message: `Se enviaron ${inasistencias.length} notificaciones de ausencia.` 
    })

  } catch (error: any) {
    console.error('Error notificador:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}