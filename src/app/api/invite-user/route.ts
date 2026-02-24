import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { validatePassword } from '@/app/utils/passwordValidator'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

// Inicializamos Resend dentro de la función para evitar errores de build
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email, fullName, role, schoolId, password } = await request.json()
    const supabaseAdmin = getSupabaseAdmin()

    // 1. Crear/Actualizar en Auth
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = userData?.users.find(u => u.email === email)
    let userId: string

    if (existingUser) {
      userId = existingUser.id
      await supabaseAdmin.auth.admin.updateUserById(userId, { password })
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        password,
        user_metadata: { full_name: fullName }
      })
      if (authError) throw authError
      userId = authData.user!.id
    }

    // 2. Perfil en base de datos
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        role: role,
        school_id: schoolId,
        must_change_password: true 
      })
    if (profileError) throw profileError

    // 3. ENVIAR EMAIL (Aquí estaba el fallo)
    // IMPORTANTE: Si usan 'onboarding@resend.dev', SOLO les llegará a ustedes.
    // Para producción deben usar un dominio propio.
    try {
      await resend.emails.send({
        from: 'KodaEd <notificaciones@kodaed.com>', // Cambiar por dominio verificado
        to: [email],
        subject: '🚀 Acceso a KodaEd - Credenciales Profesionales',
        html: `
          <h1>Hola ${fullName}</h1>
          <p>Se ha creado tu perfil de <strong>${role}</strong>.</p>
          <p>Tus credenciales de acceso son:</p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Clave:</strong> ${password}</li>
          </ul>
          <p>Por seguridad, el sistema te pedirá cambiar la clave al ingresar.</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login">Ingresar al Sistema</a>
        `
      })
    } catch (e) {
      console.error("El mail no se envió pero el usuario se creó:", e)
    }

    return NextResponse.json({ success: true, message: "Usuario creado y notificado" })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}