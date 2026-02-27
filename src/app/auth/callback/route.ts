import { createClient } from '@/app/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    // Este paso canjea el código del mail por una sesión real del usuario
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Si el canje es exitoso, lo mandamos a la página que pedimos (cambiar-password)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si hay error, al login
  console.error("Error en el callback de auth");
  return NextResponse.redirect(`${origin}/login?error=session_invalid`)
}