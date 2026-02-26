import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'
import { sendPushNotification } from '@/app/utils/push/sender'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { userId, courseName, action, materiaName } = await request.json()
    const resend = new Resend(process.env.RESEND_API_KEY)
    const supabase = getSupabaseAdmin()

    // 1. Obtener datos del docente/preceptor
    const { data: user } = await supabase.from('profiles').select('email, full_name').eq('id', userId).single()
    if (!user) throw new Error("Usuario no encontrado")

    const isAsignado = action === 'asignado'

    // 2. ENVIAR EMAIL (Formal)
    if (user.email) {
      await resend.emails.send({
        from: 'KodaEd <sistema@kodatec.app>',
        to: [user.email],
        subject: isAsignado ? `📍 Nueva asignación: ${courseName}` : `⚠️ Cambio en tu asignación`,
        html: `<p>Hola ${user.full_name}, has sido ${isAsignado ? 'asignado a' : 'removido de'} <strong>${courseName}</strong>.</p>`
      })
    }

    // 3. ENVIAR PUSH (Aviso inmediato)
    await sendPushNotification(
      userId,
      isAsignado ? "📍 Nueva Cátedra Asignada" : "⚠️ Cambio de Cursos",
      isAsignado 
        ? `Te asignaron ${materiaName || 'un curso'} en ${courseName}.` 
        : `Ya no tienes a cargo el curso ${courseName}.`,
      "/dashboard"
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}