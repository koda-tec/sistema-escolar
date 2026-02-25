import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json()
    const supabase = getSupabaseAdmin()

    // 1. Buscamos la nota corregida con la respuesta, el nombre del padre y el alumno
    const { data: nota, error: notaError } = await supabase
      .from('parent_requests')
      .select(`
        *,
        profiles:parent_id(full_name, email),
        students:student_id(full_name, schools(name))
      `)
      .eq('id', requestId)
      .single()

    if (notaError || !nota) throw new Error("No se encontró la solicitud")

    const emailPadre = (nota as any).profiles?.email
    const nombrePadre = (nota as any).profiles?.full_name
    const nombreAlumno = (nota as any).students?.full_name
    const nombreEscuela = (nota as any).students?.schools?.name

    if (!emailPadre) return NextResponse.json({ message: 'Sin email de destino' })

    // 2. Enviamos el Email al Padre
    await resend.emails.send({
      from: 'KodaEd <avisos@kodatec.app>',
      to: [emailPadre],
      subject: `✅ Respuesta de Preceptoría: ${nombreAlumno}`,
      html: `
        <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #0f172a; padding: 30px; text-align: center;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">Koda<span style="color: white;">Ed</span></h1>
          </div>
          <div style="padding: 40px; line-height: 1.6;">
            <p style="font-size: 18px;">Hola <strong>${nombrePadre}</strong>,</p>
            <p>La preceptoría de <strong>${nombreEscuela}</strong> ha respondido a tu nota sobre el alumno <strong>${nombreAlumno}</strong>.</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0;">
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase;">Mensaje de la Escuela:</p>
              <p style="margin: 0; font-size: 16px; color: #1e293b; font-weight: 600;">"${nota.response_text}"</p>
            </div>

            <div style="text-align: center; margin-top: 35px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
                 style="background-color: #2563eb; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
                Ver en la App
              </a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">Aviso automático de KodaEd para ${nombreEscuela}.</p>
          </div>
        </div>
      `
    })

    return NextResponse.json({ success: true, message: 'Padre notificado.' })

  } catch (error: any) {
    console.error('Error notificador respuesta:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}