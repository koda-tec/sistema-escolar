import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { userId, courseName, action, materiaName } = await request.json()
    const supabase = getSupabaseAdmin()

    // 1. Obtener datos del afectado
    const { data: user } = await supabase.from('profiles').select('email, full_name').eq('id', userId).single()
    if (!user?.email) return NextResponse.json({ message: 'Sin email' })

    const isAsignado = action === 'asignado'

    // 2. Enviar Mail
    await resend.emails.send({
      from: 'KodaEd <sistema@kodatec.app>',
      to: [user.email],
      subject: isAsignado ? `📍 Nueva asignación: ${courseName}` : `⚠️ Cambio en tu asignación: ${courseName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: ${isAsignado ? '#2563eb' : '#ef4444'};">Hola ${user.full_name}</h2>
          <p>Te informamos que has sido <strong>${isAsignado ? 'ASIGNADO a' : 'REMOVIDO de'}</strong> el curso <strong>${courseName}</strong>.</p>
          ${materiaName ? `<p>Materia: <strong>${materiaName}</strong></p>` : ''}
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Este es un aviso automático de la dirección de la escuela vía KodaEd.</p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}