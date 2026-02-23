import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  console.log('🔍 API Key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...')

  try {
    const { data, error } = await resend.emails.send({
      from: 'KodaEd <onboarding@resend.dev>',
      to: ['TU_EMAIL_DE_PRUEBA'], // Poner un email real
      subject: '🧪 Test de Resend',
      html: '<p>Este es un test de Resend</p>'
    })

    if (error) {
      console.error('❌ Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('✅ Enviado:', data)
    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}