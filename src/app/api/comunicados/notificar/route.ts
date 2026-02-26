import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'
import { sendPushNotification } from '@/app/utils/push/sender'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { communicationId } = await request.json()
    if (!communicationId) throw new Error("communicationId es requerido")

    const resend = new Resend(process.env.RESEND_API_KEY)
    const supabase = getSupabaseAdmin()

    // 1. Obtener los datos del comunicado y el nombre de la escuela
    const { data: comm, error: commError } = await supabase
      .from('communications')
      .select('*, schools(name)')
      .eq('id', communicationId)
      .single()

    if (commError || !comm) throw new Error("Comunicado no encontrado")

    // Listas para recolectar destinatarios
    let recipients: { id: string, email: string }[] = []

    // 2. Lógica de obtención de destinatarios (IDs para Push y Emails para Resend)
    if (comm.target_type === 'toda-la-escuela') {
      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', 'padre')
        .eq('school_id', comm.school_id)
      
      recipients = data?.map(p => ({ id: p.id, email: p.email })) || []
    } 
    else if (comm.target_type === 'curso') {
      const { data } = await supabase
        .from('students')
        .select('parent_id, profiles:parent_id(email)')
        .eq('course_id', comm.target_id)
      
      recipients = data?.map((s: any) => ({ 
        id: s.parent_id, 
        email: s.profiles?.email 
      })) || []
    } 
    else if (comm.target_type === 'alumno-especifico') {
      const { data } = await supabase
        .from('students')
        .select('parent_id, profiles:parent_id(email)')
        .eq('id', comm.target_id)
        .single()
      
      if (data && (data as any).profiles?.email) {
        recipients = [{ 
          id: (data as any).parent_id, 
          email: (data as any).profiles.email 
        }]
      }
    }

    // 3. Limpieza de duplicados (por si un padre tiene varios hijos en el mismo curso)
    const uniqueRecipients = Array.from(new Map(recipients.map(r => [r.id, r])).values())
      .filter(r => r.email); // Solo los que tienen email

    if (uniqueRecipients.length === 0) {
      return NextResponse.json({ success: true, message: 'Sin destinatarios vinculados.' })
    }

    const uniqueEmails = uniqueRecipients.map(r => r.email)

    // 4. ENVÍO DE EMAIL (Resend)
    const { error: emailError } = await resend.emails.send({
      from: `KodaEd <notificaciones@kodatec.app>`,
      to: uniqueEmails,
      subject: `📣 Nuevo Comunicado: ${comm.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 30px; text-align: center;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">Koda<span style="color: white;">Ed</span></h1>
          </div>
          <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
            <h2 style="font-size: 18px; color: #0f172a;">${comm.title}</h2>
            <p style="white-space: pre-wrap;">${comm.content}</p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/comunicados/${comm.id}" 
                 style="background-color: #2563eb; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold;">
                Ver en la App
              </a>
            </div>
          </div>
        </div>
      `
    })

    // 5. ENVÍO DE NOTIFICACIONES PUSH (En paralelo)
    const pushPromises = uniqueRecipients.map(recipient => 
      sendPushNotification(
        recipient.id,
        "📣 Nuevo Comunicado",
        `${comm.title}`,
        `/dashboard/comunicados/${comm.id}`
      )
    )

    // Usamos allSettled para que si una push falla no detenga el proceso
    await Promise.allSettled(pushPromises)

    return NextResponse.json({ 
      success: true, 
      message: `Notificado a ${uniqueRecipients.length} familias por Email y Push.` 
    })

  } catch (error: any) {
    console.error('Error notificador:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}