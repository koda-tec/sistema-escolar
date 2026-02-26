import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'


export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { studentId, studentName, padreId } = await request.json()

    if (!studentId || !padreId) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. Obtener datos del padre (Email y Nombre)
    const { data: padre, error: padreError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', padreId)
      .single()

    if (padreError || !padre?.email) {
      return NextResponse.json({ error: 'No se encontró el email del padre' }, { status: 404 })
    }

    // 2. Obtener nombre de la escuela
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('schools(name)')
      .eq('id', studentId)
      .single()

    const nombreEscuela = (student as any)?.schools?.name || 'la institución'
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/login`

    // 3. Enviar correo de bienvenida y vinculación
    await resend.emails.send({
      from: 'KodaEd <bienvenida@kodatec.app>',
      to: [padre.email],
      subject: `👨‍🎓 Vinculación con ${studentName} en KodaEd`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #0f172a; padding: 40px 20px; text-align: center;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 26px; letter-spacing: -0.05em;">Koda<span style="color: white;">Ed</span></h1>
          </div>
          
          <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
            <p style="font-size: 18px;">Hola <strong>${padre.full_name}</strong>,</p>
            
            <p>Te informamos que <strong>${nombreEscuela}</strong> te ha vinculado oficialmente al legajo digital de:</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 20px; font-weight: 800; color: #1e293b;">${studentName}</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Alumno Regular</p>
            </div>
            
            <p>Desde ahora, podrás acceder a la plataforma para realizar el seguimiento en tiempo real de:</p>
            <ul style="color: #64748b; font-size: 14px;">
              <li>Control de asistencias e inasistencias.</li>
              <li>Descarga de libretas digitales (PDF).</li>
              <li>Comunicados oficiales y avisos de preceptoria.</li>
            </ul>
            
            <div style="text-align: center; margin-top: 35px;">
              <a href="${loginUrl}" 
                 style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);">
                Ingresar al Panel →
              </a>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">Mensaje automático enviado por KodaEd para ${nombreEscuela}.</p>
          </div>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error notificador vinculación:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}