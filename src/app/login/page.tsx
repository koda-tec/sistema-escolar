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

      // Si es personal y debe cambiar clave, va a la página de perfil
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

    // CORRECCIÓN: El redirectTo debe pasar por el callback para validar la sesión
    // Esto evita el 404 y permite que la página de reset reconozca al usuario
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden font-sans">
        {/* Decoración de fondo */}
        <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-md w-full z-10 text-left">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white space-y-8">
            <button 
              onClick={() => {
                setShowForgotPassword(false)
                setResetEmailSent(false)
              }}
              className="text-sm font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors uppercase tracking-widest"
            >
              ← Volver al login
            </button>

            {resetEmailSent ? (
              <div className="text-center space-y-4 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-50 rounded-3xl mx-auto flex items-center justify-center text-green-600 text-4xl shadow-inner">✉️</div>
                <h2 className="text-2xl font-black text-slate-900 uppercase italic">Email enviado</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Hemos enviado un enlace de recuperación seguro a: <br/>
                  <span className="text-blue-600 font-bold">{email}</span>
                </p>
                <div className="pt-4 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    No olvides revisar la carpeta de Spam
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-left">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-6 shadow-xl shadow-blue-200">🔐</div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Recuperar Clave</h2>
                  <p className="text-slate-500 mt-2 font-medium">Enviaremos un enlace único para restaurar tu acceso.</p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1 block tracking-widest">Email de tu cuenta</label>
                    <input
                      type="email"
                      required
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold border-none transition-all"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-950 text-white py-5 rounded-2rem font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar Acceso'}
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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full z-10 text-left">
        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl border border-white space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-linear-to-br from-blue-600 to-indigo-700 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-200 mb-6 italic">K</div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Koda<span className="text-blue-600">Ed</span></h2>
            <p className="text-slate-400 font-bold mt-2 uppercase text-xs tracking-widest">Gestión Académica Profesional</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1 block tracking-widest">Email</label>
                <input
                  type="email"
                  required
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold border-none transition-all"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1 block tracking-widest">Contraseña</label>
                <input
                  type="password"
                  required
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold border-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-xs p-4 rounded-2xl text-center font-bold uppercase border border-red-100 italic">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-950 text-white py-5 rounded-2rem font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Validando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => setShowForgotPassword(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-black uppercase tracking-widest hover:underline transition-all"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-slate-100"></div>
            <span className="absolute bg-white px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">O continúa con</span>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border-2 border-slate-50 py-4 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 text-sm shadow-sm"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            Acceder con Google
          </button>

          <div className="mt-8 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <p>
              ¿No tienes cuenta?{' '}
              <Link 
                href="/register" 
                className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-4"
              >
                Regístrate hoy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}