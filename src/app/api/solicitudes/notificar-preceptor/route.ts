import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { requestId } = await request.json()
    const supabase = getSupabaseAdmin()

    // 1. Buscamos la nota, el nombre del alumno, el nombre del padre y el ID del curso
    const { data: nota, error: notaError } = await supabase
      .from('parent_requests')
      .select(`
        *,
        profiles:parent_id(full_name),
        students:student_id(full_name, course_id, schools(name))
      `)
      .eq('id', requestId)
      .single()

    if (notaError || !nota) throw new Error("No se encontró la solicitud")

    // 2. Buscamos a los PRECEPTORES asignados a ese curso
    const { data: asignaciones, error: asigError } = await supabase
      .from('preceptor_courses')
      .select('profiles:preceptor_id(email, full_name)')
      .eq('course_id', nota.students.course_id)

    if (asigError) throw asigError

    const emailsPreceptores = asignaciones?.map((a: any) => a.profiles?.email).filter(Boolean) || []

    if (emailsPreceptores.length === 0) {
      return NextResponse.json({ message: 'No hay preceptores asignados a este curso.' })
    }

    // 3. Enviamos el mail a cada preceptor
    const emailPromises = emailsPreceptores.map(email => 
      resend.emails.send({
        from: 'KodaEd <avisos@kodatec.app>',
        to: [email],
        subject: `✉️ Nueva nota de: ${nota.profiles.full_name}`,
        html: `
          <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background-color: #0f172a; padding: 30px; text-align: center;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">Koda<span style="color: white;">Ed</span></h1>
              <p style="color: #94a3b8; font-size: 10px; uppercase; letter-spacing: 2px;">Aviso para Preceptoría</p>
            </div>
            <div style="padding: 30px;">
              <p>Hola,</p>
              <p>Has recibido una nueva nota oficial desde la aplicación:</p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Alumno:</p>
                <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">${nota.students.full_name}</p>
                
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Tipo de Aviso:</p>
                <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #2563eb;">${nota.type.toUpperCase()}</p>
                
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Mensaje del Padre:</p>
                <p style="margin: 5px 0 0 0; font-style: italic;">"${nota.note}"</p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/comunicados" 
                   style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold;">
                  Ver en el Panel →
                </a>
              </div>
            </div>
          </div>
        `
      })
    )

    await Promise.all(emailPromises)

    return NextResponse.json({ success: true, message: 'Preceptor notificado.' })

  } catch (error: any) {
    console.error('Error notificador preceptor:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}