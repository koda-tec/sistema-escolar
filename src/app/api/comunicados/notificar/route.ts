import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'

// 1. Inicializar Resend con tu API KEY
const resend = new Resend(process.env.RESEND_API_KEY)

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { communicationId } = await request.json()
    if (!communicationId) throw new Error("communicationId es requerido")

    const supabase = getSupabaseAdmin()

    // 2. Obtener los datos del comunicado y el nombre de la escuela
    const { data: comm, error: commError } = await supabase
      .from('communications')
      .select('*, schools(name)')
      .eq('id', communicationId)
      .single()

    if (commError || !comm) throw new Error("Comunicado no encontrado")

    let emails: string[] = []

    // 3. Lógica de obtención de destinatarios según el alcance
    if (comm.target_type === 'toda-la-escuela') {
      // Todos los padres de la escuela
      const { data } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'padre')
        .eq('school_id', comm.school_id)
      
      emails = data?.map(p => p.email).filter(Boolean) || []
    } 
    else if (comm.target_type === 'curso') {
      // Todos los padres de los alumnos de un curso específico
      const { data } = await supabase
        .from('students')
        .select('profiles:parent_id(email)')
        .eq('course_id', comm.target_id)
      
      // Corrección del error de TypeScript: Mapeo seguro
      emails = data?.map((s: any) => s.profiles?.email).filter(Boolean) || []
    } 
    else if (comm.target_type === 'alumno-especifico') {
      // El padre de un alumno específico
      const { data } = await supabase
        .from('students')
        .select('profiles:parent_id(email)')
        .eq('id', comm.target_id)
        .single()
      
      const email = (data as any)?.profiles?.email
      if (email) emails = [email]
    }

    // 4. Limpieza: Eliminar emails duplicados y vacíos
    const uniqueEmails = Array.from(new Set(emails))

    if (uniqueEmails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'El comunicado se creó, pero no se encontraron emails de padres para notificar.' 
      })
    }

    // 5. Envío con Resend usando tu dominio verificado
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${comm.schools?.name || 'KodaEd'} <notificaciones@kodatec.app>`,
      to: uniqueEmails,
      subject: `📣 Nuevo Comunicado: ${comm.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 30px; text-align: center;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">Koda<span style="color: white;">Ed</span></h1>
          </div>
          <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
            <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">${comm.title}</h2>
            <p style="white-space: pre-wrap; font-size: 15px;">${comm.content}</p>
            
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/comunicados/${comm.id}" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                Leer y Confirmar en la App
              </a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 12px; color: #64748b; text-align: center;">
              Recibiste este mensaje porque eres el tutor registrado del alumno en ${comm.schools?.name}.
            </p>
          </div>
        </div>
      `
    })

    if (emailError) {
      console.error("Error de Resend:", emailError)
      return NextResponse.json({ error: emailError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se enviaron ${uniqueEmails.length} notificaciones correctamente.` 
    })

  } catch (error: any) {
    console.error('Crash en API Notificar Comunicado:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}