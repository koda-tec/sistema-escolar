'use client'
import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })

    if (authError) {
      setError("Email o contraseña incorrectos")
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, must_change_password')
        .eq('id', data.user.id)
        .single()

      if ((profile?.role === 'docente' || profile?.role === 'preceptor') && profile?.must_change_password) {
        router.push('/dashboard/perfil/cambiar-password')
      } else {
        router.push('/dashboard')
      }
    }

    router.refresh()
    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!email) {
      toast.error('Por favor, ingresa tu email primero')
      setLoading(false)
      return
    }

   const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/olvide-contrasena`,
})

    if (error) {
      toast.error('Error al enviar el email: ' + error.message)
    } else {
      setResetEmailSent(true)
      toast.success('📧 Revisa tu email para recuperar tu contraseña')
    }

    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  // Vista de "Olvidé mi contraseña"
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-md w-full z-10">
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-white space-y-8">
            <button 
              onClick={() => {
                setShowForgotPassword(false)
                setResetEmailSent(false)
              }}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              ← Volver al login
            </button>

            {resetEmailSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center text-green-600 text-3xl">✓</div>
                <h2 className="text-2xl font-bold text-slate-900">Email enviado</h2>
                <p className="text-slate-500">
                  Hemos enviado un enlace de recuperación a <strong>{email}</strong>
                </p>
                <p className="text-sm text-slate-400">
                  Revisa tu bandeja de entrada (y spam)
                </p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto flex items-center justify-center text-blue-600 text-3xl mb-4">🔐</div>
                  <h2 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h2>
                  <p className="text-slate-500 mt-2">Ingresa tu email y te enviaremos un enlace para restaurar tu contraseña</p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Vista normal de Login
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full z-10">
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-white space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-200 mb-6">K</div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido</h2>
            <p className="text-slate-500 mt-2">Ingresá a tu cuaderno digital</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">Contraseña</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-medium">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Validando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">O continúa con</span></div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-900"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            Iniciar sesión con Google
          </button>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              ¿No tienes cuenta?{' '}
              <Link 
                href="/register" 
                className="font-medium text-blue-600 hover:underline"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}