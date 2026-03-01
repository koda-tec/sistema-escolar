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
          // 1. Sincronizamos con el Request
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          
          // 2. Sincronizamos con el Response (Vital para PWA)
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              // Forzamos que la cookie sea persistente por 1 año
              maxAge: 60 * 60 * 24 * 365, 
            })
          )
        },
      },
    }
  )

  // IMPORTANTE: getUser() es el que gatilla el refresco de la cookie si está por vencer
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Protección de rutas
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}