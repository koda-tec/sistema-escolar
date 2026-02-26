import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // RECIBIMOS EL MENSAJE DIRECTAMENTE AQUÍ
    const { requestId, responseText } = await request.json() 
    const supabase = getSupabaseAdmin()

    // Buscamos los nombres involucrados
    const { data: nota, error } = await supabase
      .from('parent_requests')
      .select(`
        profiles:parent_id(full_name, email),
        students:student_id(full_name, schools(name))
      `)
      .eq('id', requestId)
      .single()

    if (error || !nota) throw new Error("No se encontró la solicitud")

    const emailPadre = (nota as any).profiles.email
    const nombrePadre = (nota as any).profiles.full_name
    
    // USAMOS EL TEXTO QUE VIENE POR PARÁMETRO
    const mensajeFinal = responseText || "Tu nota ha sido procesada correctamente."

    await resend.emails.send({
      from: 'KodaEd <avisos@kodatec.app>',
      to: [emailPadre],
      subject: `✅ Respuesta de la Escuela`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <h1 style="color: #3b82f6; margin: 0;">Koda<span style="color: white;">Ed</span></h1>
          </div>
          <div style="padding: 30px; color: #1e293b;">
            <p>Hola <strong>${nombrePadre}</strong>,</p>
            <p>La escuela ha respondido a tu nota:</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; font-size: 16px;">
              "${mensajeFinal}"
            </div>
            <p>Podés ver el historial completo en la App.</p>
          </div>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}