import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1. Actualizar las cookies en la petición para que el resto de Next.js las vea
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // 2. Crear una nueva respuesta para incluir los headers de set-cookie
          response = NextResponse.next({
            request,
          })

          // 3. PASAR LAS OPTIONS: Esto es lo que evita que se cierre la sesión
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresca la sesión si es necesario
  await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  if (!request.cookies.get('sb-access-token') && request.nextUrl.pathname.startsWith('/dashboard')) {
    // Si no hay rastro de sesión, al login
    url.pathname = '/login'
    // return NextResponse.redirect(url) // Descomentá esto si querés activar la protección total
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}