import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'
import { sendPushNotification } from '@/app/utils/push/sender'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { requestId, responseText } = await request.json()
    
    if (!requestId) throw new Error("ID de solicitud requerido")

    const resend = new Resend(process.env.RESEND_API_KEY)
    const supabase = getSupabaseAdmin()

    // 1. Buscamos los datos de la nota, el padre y el alumno
    const { data: nota, error: notaError } = await supabase
      .from('parent_requests')
      .select(`
        id,
        parent_id,
        response_text,
        profiles:parent_id (full_name, email),
        students:student_id (full_name, schools(name))
      `)
      .eq('id', requestId)
      .single()

    if (notaError || !nota) throw new Error("No se encontró la solicitud en la base de datos")

    const emailPadre = (nota as any).profiles?.email
    const nombrePadre = (nota as any).profiles?.full_name
    const nombreAlumno = (nota as any).students?.full_name
    const nombreEscuela = (nota as any).students?.schools?.name
    
    // Usamos el texto que viene por parámetro o el de la DB como respaldo
    const mensajeRespuesta = responseText || nota.response_text || "Tu nota ha sido procesada."

    // --- A. ENVÍO POR EMAIL (Resend) ---
    if (emailPadre) {
      try {
        await resend.emails.send({
          from: 'KodaEd <avisos@kodatec.app>',
          to: [emailPadre],
          subject: `✅ Respuesta de la Escuela: ${nombreAlumno}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
              <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">Koda<span style="color: white;">Ed</span></h1>
              </div>
              <div style="padding: 30px; color: #1e293b;">
                <p style="font-size: 16px;">Hola <strong>${nombrePadre}</strong>,</p>
                <p>La preceptoría de <strong>${nombreEscuela}</strong> ha respondido a tu nota sobre <strong>${nombreAlumno}</strong>:</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; font-style: italic; font-size: 16px;">
                  "${mensajeRespuesta}"
                </div>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold;">
                    Ver en la App
                  </a>
                </div>
              </div>
            </div>
          `
        })
      } catch (errEmail) {
        console.error("Error enviando email:", errEmail)
      }
    }

    // --- B. ENVÍO POR NOTIFICACIÓN PUSH (Vibración en el celu) ---
    if (nota.parent_id) {
      try {
        await sendPushNotification(
          nota.parent_id,
          "✅ Nueva Respuesta de la Escuela",
          `Sobre ${nombreAlumno}: "${mensajeRespuesta}"`,
          "/dashboard"
        )
      } catch (errPush) {
        console.error("Error enviando Push:", errPush)
      }
    }

    return NextResponse.json({ success: true, message: "Padre notificado por Email y Push" })

  } catch (error: any) {
    console.error('Crash en API notificar-padre:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}