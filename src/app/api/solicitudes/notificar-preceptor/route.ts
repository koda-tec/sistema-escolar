import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'
import { sendPushNotification } from '@/app/utils/push/sender'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json()
    if (!requestId) throw new Error("ID de solicitud requerido")

    const resend = new Resend(process.env.RESEND_API_KEY)
    const supabase = getSupabaseAdmin()

    // 1. Buscamos los datos de la nota, el alumno y el curso
    const { data: nota, error: notaError } = await supabase
      .from('parent_requests')
      .select(`
        id,
        type,
        note,
        parent_id,
        profiles:parent_id(full_name),
        students:student_id (
          full_name,
          course_id,
          schools(name)
        )
      `)
      .eq('id', requestId)
      .single()

    if (notaError || !nota) throw new Error("No se encontró la nota en la DB")

    // --- CORRECCIÓN DE TIPADO PARA EVITAR ERROR 2339 ---
    // Forzamos a 'any' para extraer los datos de las relaciones de forma segura
    const notaData = nota as any;
    const studentInfo = Array.isArray(notaData.students) ? notaData.students[0] : notaData.students;
    const schoolInfo = Array.isArray(studentInfo?.schools) ? studentInfo.schools[0] : studentInfo?.schools;
    
    const nombrePadre = notaData.profiles?.full_name || 'Un tutor';
    const nombreAlumno = studentInfo?.full_name || 'Alumno';
    const courseId = studentInfo?.course_id;

    if (!courseId) throw new Error("El alumno no tiene curso asignado");

    // 2. Buscamos a los PRECEPTORES asignados a ese curso específico
    const { data: asignaciones, error: asigError } = await supabase
      .from('preceptor_courses')
      .select('preceptor_id, profiles:preceptor_id(email, full_name)')
      .eq('course_id', courseId)

    if (asigError) throw asigError

    if (!asignaciones || asignaciones.length === 0) {
      return NextResponse.json({ success: true, message: "Sin preceptores asignados para notificar" })
    }

    // 3. Procesamos las notificaciones para cada preceptor asignado
    const notificationPromises = asignaciones.map(async (asig: any) => {
      const preceptorId = asig.preceptor_id;
      const emailPreceptor = asig.profiles?.email;
      const nombrePreceptor = asig.profiles?.full_name;

      // A. ENVIAR EMAIL AL PRECEPTOR
      if (emailPreceptor) {
        try {
          await resend.emails.send({
            from: 'KodaEd <avisos@kodatec.app>',
            to: [emailPreceptor],
            subject: `✉️ Nueva Nota de Familiar: ${nombreAlumno}`,
            html: `
              <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #0f172a; padding: 30px; text-align: center;">
                  <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">Koda<span style="color: white;">Ed</span></h1>
                  <p style="color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px;">Buzón de Preceptoría</p>
                </div>
                <div style="padding: 30px;">
                  <p>Hola <strong>${nombrePreceptor}</strong>,</p>
                  <p>Has recibido una nueva nota oficial a través de la plataforma:</p>
                  
                  <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Alumno:</p>
                    <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #1e293b;">${nombreAlumno}</p>
                    
                    <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Enviado por:</p>
                    <p style="margin: 0 0 15px 0; font-size: 15px; color: #1e293b;">${nombrePadre} (Tutor)</p>
                    
                    <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Mensaje:</p>
                    <p style="margin: 5px 0 0 0; font-style: italic; color: #334155;">"${notaData.note}"</p>
                  </div>

                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/comunicados" 
                       style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px;">
                      Abrir Bandeja de Entrada →
                    </a>
                  </div>
                </div>
              </div>
            `
          })
        } catch (e) { console.error("Error email preceptor:", e) }
      }

      // B. ENVIAR PUSH AL PRECEPTOR
      try {
        await sendPushNotification(
          preceptorId,
          "✉️ Nueva Nota de Padre",
          `${nombrePadre} envió un aviso sobre ${nombreAlumno}.`,
          "/dashboard/comunicados"
        );
      } catch (e) { console.error("Error push preceptor:", e) }
    })

    await Promise.allSettled(notificationPromises)

    return NextResponse.json({ 
      success: true, 
      message: `Notificados ${asignaciones.length} preceptores.` 
    })

  } catch (error: any) {
    console.error('Error notificador preceptor:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}