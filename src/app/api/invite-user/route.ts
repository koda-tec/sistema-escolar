import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { validatePassword } from '@/app/utils/passwordValidator'
import { Resend } from 'resend'

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY)

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { email, fullName, role, schoolId, password } = await request.json()

    // Validaciones básicas
    if (!email || !fullName || !role || !schoolId || !password) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    let userId: string

    // 1. Buscar si el usuario ya existe en Auth
    const { data: userData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) throw listError

    const existingUser = userData?.users.find(u => u.email === email)

    if (existingUser) {
      userId = existingUser.id
      // Actualizar usuario existente
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { full_name: fullName }
      })
      if (updateError) throw updateError
    } else {
      // 2. Crear usuario nuevo si no existe
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        password,
        user_metadata: { full_name: fullName }
      })

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      if (!authData.user) {
        return NextResponse.json({ error: 'Error al crear usuario' }, { status: 400 })
      }

      userId = authData.user.id
    }

    // 3. Crear o actualizar el perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        role: role,
        school_id: schoolId,
        must_change_password: true 
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Error creando perfil:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // 4. Enviar email de bienvenida
    const roleLabel = role === 'docente' ? 'Profesor' : 'Preceptor'
    
    try {
      await sendWelcomeEmail({
        email,
        fullName,
        password,
        role: roleLabel
      })
    } catch (emailError) {
      console.error('Error enviando email:', emailError)
      // No fallar todo el proceso si el email falla
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `✅ ${roleLabel} gestionado correctamente.`
    })

  } catch (error: any) {
    console.error('Error en invite-user route:', error.message)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para enviar email de bienvenida
async function sendWelcomeEmail({ email, fullName, password, role }: {
  email: string
  fullName: string
  password: string
  role: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tu-app.vercel.app'

  const { error } = await resend.emails.send({
    from: 'KodaEd <onboarding@resend.dev>',
    to: [email],
    subject: '👋 Bienvenido a KodaEd - Tus credenciales de acceso',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">👋 Bienvenido a KodaEd</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px;">Hola <strong>${fullName}</strong>,</p>
            
            <p>Tu cuenta de <strong>${role}</strong> ha sido creada exitosamente en KodaEd.</p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #64748b;">📧 Correo Electrónico:</p>
              <p style="margin: 0 0 15px 0; font-size: 18px; color: #2563eb;">${email}</p>
              
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #64748b;">🔑 Contraseña Provisoria:</p>
              <p style="margin: 0; font-size: 18px; color: #2563eb; font-family: monospace;">${password}</p>
            </div>
            
            <p style="color: #dc2626; font-weight: bold;">⚠️ IMPORTANTE:</p>
            <p style="margin: 0;">Al iniciar sesión por primera vez, serás redirigido automáticamente para cambiar tu contraseña.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/login" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Iniciar Sesión →
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Si no solicitaste esta cuenta, por favor ignorá este email.
            </p>
          </div>
        </body>
      </html>
    `
  })

  if (error) {
    console.error('Error de Resend:', error)
    throw error
  }
}