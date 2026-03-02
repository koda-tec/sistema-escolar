import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Creamos una respuesta inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Inicializamos el cliente de Supabase optimizado para Next.js 15
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Actualizamos las cookies en la petición original
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // Sincronizamos las cookies en la respuesta que va al navegador
          // Esto es vital para que la sesión no expire
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Obtenemos el usuario (Esto refresca el token automáticamente si es necesario)
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // 4. LÓGICA DE REDIRECCIÓN
  
  // Si NO hay usuario y trata de entrar al dashboard -> Al Login
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si HAY usuario y trata de entrar al login o registro -> Al Dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

// 5. CONFIGURACIÓN DEL MATCHER
// Excluimos archivos estáticos, imágenes y el favicon para que el middleware no sea lento
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}