'use client'
import { useState, useEffect, useLayoutEffect, Suspense } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { validatePassword } from '@/app/utils/passwordValidator'

export const dynamic = 'force-dynamic'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [debugInfo, setDebugInfo] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  // Usar useLayoutEffect para ejecutar ANTES de que React pinte
  useLayoutEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash
      const search = window.location.search
      
      console.log('🔍 Hash completo:', hash)
      console.log('🔍 Search completo:', search)
      console.log('🔍 URL completa:', window.location.href)
      
      // Verificar en el hash (formato Supabase)
      if (hash.includes('access_token') && hash.includes('type=recovery')) {
        setDebugInfo('✅ Token encontrado en el hash')
        setIsValidToken(true)
        return
      }
      
      // Verificar en los query params (algunos proveedores usan esto)
      const params = new URLSearchParams(search)
      if (params.has('access_token') || params.has('token')) {
        setDebugInfo('⚠️ Token encontrado en query params (no soportado)')
        setIsValidToken(false)
        return
      }
      
      // No hay token
      setDebugInfo('❌ No hay token en la URL')
      setIsValidToken(false)
    }

    // Ejecutar inmediatamente
    checkHash()
    
    // Ejecutar de nuevo después de un pequeño delay (por si hay redirects)
    const timer = setTimeout(checkHash, 100)
    
    return () => clearTimeout(timer)
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

    // Extraer tokens del hash
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken) {
      toast.error('Token no encontrado')
      setLoading(false)
      return
    }

    console.log('🔐 Intentando establecer sesión...')

    // Establecer la sesión
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    })

    if (sessionError) {
      console.error('Session error:', sessionError)
      toast.error('Error al procesar el enlace')
      setLoading(false)
      return
    }

    // Cambiar contraseña
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

  // Debug info visible (para testing)
  if (process.env.NODE_ENV === 'development') {
    console.log('Debug info:', debugInfo)
  }

  // Loading
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Verificando enlace...</p>
          {/* Debug info visible solo en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-slate-400 mt-2 font-mono">{debugInfo}</p>
          )}
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
            No se encontró el token de recuperación.
          </p>
          
          {/* Debug info visible solo en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-slate-100 p-4 rounded-xl text-left text-xs font-mono mb-4">
              <p className="font-bold mb-2">Debug Info:</p>
              <p>{debugInfo}</p>
              <p className="mt-2 text-slate-400">Hash: {window.location.hash || '(vacío)'}</p>
            </div>
          )}
          
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