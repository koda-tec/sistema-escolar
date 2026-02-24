import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { courseId } = await request.json()
    const supabaseAdmin = getSupabaseAdmin()
    const hoy = new Date().toISOString().split('T')[0]

    // Consulta corregida: ahora 'email' existe en profiles
    const { data: inasistencias, error: queryError } = await supabaseAdmin
      .from('attendance')
      .select(`
        status,
        students!inner (
          full_name,
          profiles:parent_id (
            email,
            full_name
          )
        )
      `)
      .eq('status', 'ausente')
      .eq('date', hoy)
      .eq('students.course_id', courseId)

    if (queryError) throw queryError

    if (!inasistencias || inasistencias.length === 0) {
      return NextResponse.json({ message: 'No hay ausentes para notificar.' })
    }

    const emailPromises = inasistencias.map(async (reg: any) => {
      const emailPadre = reg.students.profiles?.email
      const nombreAlumno = reg.students.full_name
      const nombrePadre = reg.students.profiles?.full_name

      if (!emailPadre) return null

      return resend.emails.send({
        from: 'KodaEd <alertas@kodatec.app>',
        to: [emailPadre],
        subject: `⚠️ Aviso de inasistencia: ${nombreAlumno}`,
        html: `
          <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 30px; text-align: center;">
               <h1 style="color: white; margin: 0; font-size: 24px;">KodaEd Avisa</h1>
            </div>
            <div style="padding: 30px;">
              <p>Hola <strong>${nombrePadre}</strong>,</p>
              <p>Te informamos que tu hijo/a <strong>${nombreAlumno}</strong> ha sido marcado/a como <strong>AUSENTE</strong> el día de hoy.</p>
              <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-weight: bold; color: #ef4444;">ESTADO: AUSENTE</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">${new Date().toLocaleDateString('es-AR')}</p>
              </div>
              <p style="font-size: 14px; color: #64748b;">Si consideras que esto es un error, por favor contacta a la preceptoría de la escuela.</p>
            </div>
          </div>
        `
      })
    })

    await Promise.all(emailPromises)

    return NextResponse.json({ success: true, count: inasistencias.length })

  } catch (error: any) {
    console.error('Crash Notificador:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}