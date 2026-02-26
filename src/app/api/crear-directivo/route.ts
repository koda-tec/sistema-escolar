import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { validatePassword } from '@/app/utils/passwordValidator'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { email, fullName, schoolId, password } = await request.json()

    // Validaciones de entrada
    if (!email || !fullName || !schoolId || !password) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: 'La contraseña no cumple los requisitos mínimos' }, { status: 400 })
    }

    // Verificar que la escuela exista
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('name')
      .eq('id', schoolId)
      .single()

    if (schoolError || !school) {
      return NextResponse.json({ error: 'La escuela seleccionada no existe' }, { status: 404 })
    }

    let userId: string

    // Gestión en Supabase Auth
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = userData?.users.find(u => u.email === email)

    if (existingUser) {
      // Si el usuario existe, actualizamos su contraseña y perfil
      userId = existingUser.id
      await supabaseAdmin.auth.admin.updateUserById(userId, { 
        password,
        user_metadata: { full_name: fullName }
      })
    } else {
      // Crear nuevo usuario
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        password,
        user_metadata: { full_name: fullName }
      })
      
      if (authError) throw new Error(authError.message)
      userId = authData.user!.id
    }

    // Crear o actualizar perfil como directivo
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email: email,
        role: 'directivo',
        school_id: schoolId,
        must_change_password: true,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (profileError) throw new Error(profileError.message)

    // Envío de email de bienvenida
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/login`

    await resend.emails.send({
      from: 'KodaEd <notificaciones@kodatec.app>',
      to: [email],
      subject: '👔 Perfil de Directivo Creado - KodaEd',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #0f172a; padding: 40px 20px; text-align: center;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 28px; letter-spacing: -0.05em;">Koda<span style="color: white;">Ed</span></h1>
            <p style="color: #94a3b8; text-transform: uppercase; font-size: 10px; letter-spacing: 0.2em; margin-top: 10px;">Gestión Académica Profesional</p>
          </div>
          
          <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
            <p style="font-size: 18px;">Hola, <strong>${fullName}</strong>.</p>
            <p>Se ha creado exitosamente tu cuenta de <strong>Directivo/a</strong> en <strong>${school.name}</strong>.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0;">
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Tus credenciales de acceso:</p>
              <p style="margin: 0; font-size: 16px;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0 0 0; font-size: 16px;"><strong>Contraseña:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
            </div>

            <p style="color: #dc2626; font-weight: bold; font-size: 14px;">⚠️ Acción requerida:</p>
            <p style="margin: 0; font-size: 14px;">Al ingresar por primera vez, el sistema te solicitará obligatoriamente cambiar esta contraseña provisoria por una de tu elección por razones de seguridad.</p>

            <div style="text-align: center; margin-top: 35px;">
              <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);">
                Ingresar al Panel de Gestión →
              </a>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 KodaEd. Desarrollado por Koda Software.</p>
          </div>
        </div>
      `
    })

    return NextResponse.json({ 
      success: true, 
      message: `✅ Directivo creado correctamente en ${school.name}` 
    })

  } catch (error: any) {
    console.error('Error creando directivo:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}