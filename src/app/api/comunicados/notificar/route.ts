import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { communicationId } = await request.json()
    const supabase = getSupabaseAdmin()

    const { data: comm } = await supabase
      .from('communications')
      .select('*, schools(name)')
      .eq('id', communicationId)
      .single()

    if (!comm) throw new Error("Comunicado no encontrado")

    let emails: string[] = []

    if (comm.target_type === 'toda-la-escuela') {
      const { data } = await supabase.from('profiles').select('email').eq('role', 'padre').eq('school_id', comm.school_id)
      emails = data?.map(p => p.email).filter(Boolean) || []
    } 
    else if (comm.target_type === 'curso') {
      const { data } = await supabase.from('students').select('profiles:parent_id(email)').eq('course_id', comm.target_id)
      // CORRECCIÓN AQUÍ: Accedemos al objeto profiles de forma segura
      emails = data?.map((s: any) => s.profiles?.email).filter(Boolean) || []
    } 
    else if (comm.target_type === 'alumno-especifico') {
      const { data } = await supabase.from('students').select('profiles:parent_id(email)').eq('id', comm.target_id).single()
      const email = (data as any)?.profiles?.email
      if (email) emails = [email]
    }

    if (emails.length === 0) return NextResponse.json({ message: 'Sin destinatarios' })

    await resend.emails.send({
      from: `${comm.schools?.name || 'KodaEd'} <notificaciones@kodatec.app>`,
      to: emails,
      subject: `📣 Nuevo Comunicado: ${comm.title}`,
      html: `<div style="font-family: sans-serif; padding: 20px;"><h2>${comm.title}</h2><p>${comm.content}</p></div>`
    })

    return NextResponse.json({ success: true, count: emails.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}