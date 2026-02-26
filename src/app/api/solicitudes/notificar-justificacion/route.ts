import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'
import { sendPushNotification } from '@/app/utils/push/sender'

const resend = new Resend(process.env.RESEND_API_KEY)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { studentId, parentId, date } = await request.json()
    const supabase = getSupabaseAdmin()

    // 1. Obtener datos para el mensaje
    const { data: alumno } = await supabase
      .from('students')
      .select('full_name, profiles:parent_id(full_name, email), schools(name)')
      .eq('id', studentId)
      .single()

    if (!alumno) throw new Error("Datos no encontrados")

    const parentEmail = (alumno as any).profiles?.email
    const parentName = (alumno as any).profiles?.full_name
    const studentName = alumno.full_name
    const schoolName = (alumno as any).schools?.name || 'KodaEd'
    const formattedDate = new Date(date).toLocaleDateString('es-AR')

    // --- A. ENVIAR EMAIL ---
    if (parentEmail) {
      await resend.emails.send({
        from: 'KodaEd <asistencia@kodatec.app>',
        to: [parentEmail],
        subject: `✅ Falta Justificada: ${studentName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background-color: #10b981; padding: 30px; text-align: center;">
               <h1 style="color: white; margin: 0; font-size: 24px;">Trámite Completado</h1>
            </div>
            <div style="padding: 30px; color: #1e293b;">
              <p>Hola <strong>${parentName}</strong>,</p>
              <p>Te informamos que la preceptoría de <strong>${schoolName}</strong> ha procesado tu solicitud.</p>
              <div style="margin: 20px 0; padding: 15px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0; text-align: center;">
                <p style="margin: 0; font-weight: bold; color: #166534;">ESTADO: JUSTIFICADA</p>
                <p style="margin: 5px 0 0 0; font-size: 13px;">Alumno: ${studentName}</p>
                <p style="margin: 0; font-size: 11px; color: #15803d;">Fecha: ${formattedDate}</p>
              </div>
              <p style="font-size: 14px; color: #64748b;">La inasistencia ya no computará como falta injustificada en el legajo oficial.</p>
            </div>
          </div>
        `
      })
    }

    // --- B. ENVIAR PUSH ---
    await sendPushNotification(
      parentId,
      "✅ Falta Justificada",
      `La inasistencia de ${studentName} del día ${formattedDate} ya fue justificada.`,
      "/dashboard/hijos"
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}