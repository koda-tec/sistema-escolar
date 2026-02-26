import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { studentId, studentName, padreId } = await request.json()

    console.log(`📧 Iniciando notificación: Estudiante ${studentName}, PadreID ${padreId}`);

    if (!studentId || !padreId) {
      return NextResponse.json({ error: 'Faltan IDs' }, { status: 400 })
    }

    // Inicializamos Resend dentro para asegurar que tome la API KEY de Vercel
    const resend = new Resend(process.env.RESEND_API_KEY)
    const supabaseAdmin = getSupabaseAdmin()

    // 1. Obtener datos del padre
    const { data: padre, error: padreError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', padreId)
      .single()

    if (padreError || !padre?.email) {
      console.error("❌ Error: Padre no encontrado o sin email", padreError);
      return NextResponse.json({ error: 'Padre no encontrado' }, { status: 404 })
    }

    // 2. Obtener nombre de la escuela (Manejo de relación por si viene como array)
    const { data: student, error: stuError } = await supabaseAdmin
      .from('students')
      .select('schools(name)')
      .eq('id', studentId)
      .single()

    if (stuError) console.error("⚠️ Error obteniendo escuela:", stuError);

    // Supabase devuelve relaciones como objeto o array dependiendo del esquema
    const escuelaInfo: any = student?.schools;
    const nombreEscuela = Array.isArray(escuelaInfo) 
      ? escuelaInfo[0]?.name 
      : escuelaInfo?.name || 'KodaEd';

    // 3. Enviar correo
    const { data: emailRes, error: emailError } = await resend.emails.send({
      from: 'KodaEd <bienvenida@kodatec.app>',
      to: [padre.email],
      subject: `👨‍🎓 Acceso familiar: ${studentName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #0f172a; padding: 40px 20px; text-align: center;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 26px;">Koda<span style="color: white;">Ed</span></h1>
          </div>
          <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
            <p style="font-size: 18px;">Hola <strong>${padre.full_name}</strong>,</p>
            <p>La institución <strong>${nombreEscuela}</strong> te ha vinculado al legajo digital de:</p>
            <div style="background-color: #f8fafc; padding: 20px; margin: 20px 0; text-align: center; border-radius: 16px;">
              <p style="margin: 0; font-size: 20px; font-weight: 800;">${studentName}</p>
            </div>
            <p>Ya podés ingresar a la App con tu cuenta de Google o email para ver inasistencias y libretas.</p>
            <div style="text-align: center; margin-top: 35px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login" style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Ingresar al Panel</a>
            </div>
          </div>
        </div>
      `
    })

    if (emailError) {
      console.error("❌ Error de Resend:", emailError);
      return NextResponse.json({ error: emailError.message }, { status: 400 })
    }

    console.log("✅ Email de vinculación enviado con éxito");
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('❌ Crash en API vinculación:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}