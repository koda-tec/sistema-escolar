'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { validatePassword } from '@/app/utils/passwordValidator'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Verificar si hay un token de recuperación en el hash
    const checkHash = async () => {
      // El hash de Supabase viene así:
      // #access_token=xxx&refresh_token=xxx&type=recovery
      
      const hash = window.location.hash
      
      if (hash.includes('access_token') && hash.includes('type=recovery')) {
        console.log('✅ Token encontrado en el hash')
        setIsValidToken(true)
      } else {
        console.log('❌ No hay token válido en el hash')
        setIsValidToken(false)
      }
    }

    checkHash()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    const validation = validatePassword(password)
    if (!validation.valid) {
      toast.error(validation.errors?.[0] || 'Contraseña inválida')
      setLoading(false)
      return
    }

    // Extraer tokens directamente del hash
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken) {
      toast.error('Token no encontrado. Por favor, solicitá un nuevo enlace.')
      setLoading(false)
      return
    }

    // IMPORTANTE: Primero establecer la sesión con los tokens del hash
    const { data, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    })

    if (sessionError) {
      console.error('Session error:', sessionError)
      toast.error('Error al procesar el enlace. Solicita uno nuevo.')
      setLoading(false)
      return
    }

    // Ahora sí, cambiar la contraseña
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      console.error('Update error:', error)
      toast.error('Error al cambiar la contraseña: ' + error.message)
    } else {
      toast.success('¡Contraseña actualizada correctamente!')
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }

    setLoading(false)
  }

  // Loading
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Verificando enlace...</p>
        </div>
      </div>
    )
  }

  // Token inválido
  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center text-red-600 text-3xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Enlace inválido</h2>
          <p className="text-slate-500 mb-6">
            El enlace de recuperación ha expirado o no es válido.
          </p>
          <a 
            href="/login" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
          >
            Volver al Login
          </a>
        </div>
      </div>
    )
  }

  // Formulario
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto flex items-center justify-center text-blue-600 text-3xl mb-4">🔑</div>
          <h2 className="text-2xl font-bold text-slate-900">Nueva Contraseña</h2>
          <p className="text-slate-500 mt-2">
            Ingresa tu nueva contraseña
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nueva Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ResetPasswordContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />
}