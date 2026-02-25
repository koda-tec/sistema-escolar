import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json()
    const supabase = getSupabaseAdmin()

    // 1. Buscamos los datos incluyendo explícitamente la respuesta
    const { data: nota, error: notaError } = await supabase
      .from('parent_requests')
      .select(`
        id,
        note,
        response_text,
        profiles:parent_id(full_name, email),
        students:student_id(full_name, schools(name))
      `)
      .eq('id', requestId)
      .single()

    if (notaError || !nota) throw new Error("No se encontró la solicitud")

    const emailPadre = (nota as any).profiles?.email
    const nombrePadre = (nota as any).profiles?.full_name
    const respuestaTexto = nota.response_text || "Tu nota ha sido procesada." // Fallback si viene vacío

    if (!emailPadre) return NextResponse.json({ message: 'Sin email' })

    // 2. Enviar Email
    await resend.emails.send({
      from: 'KodaEd <notificaciones@kodatec.app>',
      to: [emailPadre],
      subject: `✅ Respuesta de la Escuela`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <h1 style="color: #3b82f6; margin: 0;">Koda<span style="color: white;">Ed</span></h1>
          </div>
          <div style="padding: 30px; color: #1e293b;">
            <p>Hola <strong>${nombrePadre}</strong>,</p>
            <p>Has recibido una respuesta oficial a tu nota:</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; font-style: italic;">
              "${respuestaTexto}"
            </div>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ver en la App</a>
          </div>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}