import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { studentId, studentName, padreId } = await request.json()

    if (!studentId || !padreId) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const supabase = await createClient()

    // Obtener datos del padre
    const { data: padre, error: padreError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', padreId)
      .single()

    if (padreError || !padre) {
      return NextResponse.json({ error: 'No se encontró el padre' }, { status: 404 })
    }

    // Obtener datos de la escuela
    const { data: student } = await supabase
      .from('students')
      .select('school_id')
      .eq('id', studentId)
      .single()

    const { data: escuela } = await supabase
      .from('schools')
      .select('name')
      .eq('id', student?.school_id)
      .single()

    const nombreEscuela = escuela?.name || 'la institución'

    // Enviar correo
    await resend.emails.send({
      from: 'KodaEd <notificaciones@kodaed.com>',
      to: [padre.email],
      subject: '👨‍🎓 Vinculación con tu hijo en KodaEd',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">👋 Bienvenido a KodaEd</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px;">Hola <strong>${padre.full_name}</strong>,</p>
            
            <p>${nombreEscuela} te ha vinculado al legajo de <strong>${studentName}</strong>.</p>
            
            <p>Ya podés ingresar a la app para ver su asistencia, libretas y comunicados.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
                Ingresar al Panel →
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
              Si no reconocés esta vinculación, contactá a la institución.
            </p>
          </div>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error enviando notificación:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}