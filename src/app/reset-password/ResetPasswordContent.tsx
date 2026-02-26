'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { validatePassword } from '@/app/utils/passwordValidator'

export default function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkToken = () => {
      const hash = window.location.hash
      const hashParams = new URLSearchParams(hash.substring(1))
      
      // Intentamos sacar el token de la URL o del Hash (Supabase usa ambos según la config)
      const accessToken = hashParams.get('access_token') || searchParams.get('token')
      const type = hashParams.get('type') || searchParams.get('type')

      if (accessToken && (type === 'recovery' || hash.includes('type=recovery'))) {
        window.sessionStorage.setItem('access_token', accessToken)
        setIsValidToken(true)
      } else {
        setIsValidToken(false)
      }
    }
    checkToken()
  }, [searchParams])

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

    const accessToken = window.sessionStorage.getItem('access_token')

    if (!accessToken) {
      toast.error('Token no encontrado. Por favor, solicitá un nuevo enlace.')
      setLoading(false)
      return
    }

    // Actualizamos la contraseña directamente
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      toast.success('¡Contraseña actualizada!')
      window.sessionStorage.clear()
      setTimeout(() => router.push('/login'), 2000)
    }
    setLoading(false)
  }

  if (isValidToken === null) return <div className="p-20 text-center text-slate-500">Verificando...</div>

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center text-red-600 text-3xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Enlace inválido</h2>
          <p className="text-slate-500 mb-6">El enlace ha expirado o es incorrecto.</p>
          <a href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">Volver al Login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">Nueva Contraseña</h2>
        <form onSubmit={handleResetPassword} className="space-y-5">
          <input type="password" required className="w-full px-4 py-3 rounded-xl border" placeholder="Nueva Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="password" required className="w-full px-4 py-3 rounded-xl border" placeholder="Confirmar Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg disabled:opacity-50">
            {loading ? 'Cambiando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
