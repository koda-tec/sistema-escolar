import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { Resend } from 'resend'


export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { studentId, trimestre, anio } = await request.json()
    const supabase = getSupabaseAdmin()

    // 1. Buscamos los datos del alumno y el email del padre
    // Importante: profiles:parent_id asume que en la tabla students la FK se llama parent_id
    const { data: alumno, error: alumnoError } = await supabase
      .from('students')
      .select(`
        full_name,
        profiles:parent_id (
          email,
          full_name
        ),
        schools:school_id (name)
      `)
      .eq('id', studentId)
      .single()

    if (alumnoError || !alumno) {
      console.error('Error buscando alumno:', alumnoError)
      throw new Error("No se encontró el alumno o el tutor en la base de datos")
    }
        
    const emailPadre = (alumno as any).profiles?.email
    const nombrePadre = (alumno as any).profiles?.full_name
    const nombreEscuela = (alumno as any).schools?.name || "Tu Institución"

    if (!emailPadre) {
      return NextResponse.json({ message: 'El alumno no tiene un tutor vinculado con email.' })
    }

    // 2. Enviamos el mail informativo con Resend
    await resend.emails.send({
      from: 'KodaEd <reportes@kodatec.app>',
      to: [emailPadre],
      subject: `📄 Nueva Libreta Disponible: ${alumno.full_name}`,
      html: `
        <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #0f172a; padding: 40px 20px; text-align: center;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 26px; letter-spacing: -0.05em;">Koda<span style="color: white;">Ed</span></h1>
            <p style="color: #94a3b8; text-transform: uppercase; font-size: 10px; letter-spacing: 0.2em; margin-top: 10px;">Gestión Académica Digital</p>
          </div>
          
          <div style="padding: 40px; line-height: 1.6;">
            <p style="font-size: 18px;">Estimado/a <strong>${nombrePadre}</strong>,</p>
            <p>Le informamos que la institución <strong>${nombreEscuela}</strong> ha cargado un nuevo reporte de calificaciones para su hijo/a.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin: 25px 0; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Documento Disponible</p>
              <p style="margin: 10px 0; font-size: 20px; font-weight: 800; color: #1e293b;">Libreta Digital - ${trimestre}° Periodo</p>
              <p style="margin: 0; font-size: 14px; color: #2563eb; font-weight: bold;">Ciclo Lectivo ${anio}</p>
            </div>

            <p style="font-size: 14px; color: #64748b;">Puede visualizar y descargar el archivo PDF ingresando a su panel de familia.</p>

            <div style="text-align: center; margin-top: 35px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/hijos/${studentId}" 
                 style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
                Ver Libreta Ahora →
              </a>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">Aviso automático de KodaEd para ${nombreEscuela}.</p>
          </div>
        </div>
      `
    })

    return NextResponse.json({ success: true, message: 'Padre notificado por email.' })

  } catch (error: any) {
    console.error('Error notificador libretas:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
