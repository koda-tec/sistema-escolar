'use client'
import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { validatePassword } from '@/app/utils/passwordValidator'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CambiarPassword() {
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  // Validación en tiempo real
  const passwordValidation = validatePassword(nuevaPassword)

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Validar que las contraseñas coincidan
    if (nuevaPassword !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    // Validar requisitos de contraseña
    const validation = validatePassword(nuevaPassword)
    if (!validation.valid) {
      toast.error(validation.errors?.[0] || 'Contraseña inválida')
      setLoading(false)
      return
    }

    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      toast.error('No se encontró el usuario')
      setLoading(false)
      return
    }

    // Llamar a la API
    const response = await fetch('/api/cambiar-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nuevaPassword: nuevaPassword,
        userId: user.id
      })
    })

    const result = await response.json()

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('¡Contraseña cambiada correctamente!')
      setNuevaPassword('')
      setConfirmarPassword('')
      
      // Redirigir directamente al dashboard (sesión mantenida)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="max-w-md w-full">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-8">
          <p className="text-amber-800 font-medium text-center">
            ⚠️ Estás usando una contraseña provisional. Por seguridad, debes cambiar tu contraseña.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">Cambiar Contraseña</h1>
          <p className="text-slate-500 text-center mb-8">
            La contraseña debe tener al menos 6 caracteres, una letra y un número
          </p>

          <form onSubmit={handleCambiarPassword} className="space-y-6">
            {/* Nueva contraseña */}
            <div>
              <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Nueva Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={nuevaPassword}
                  onChange={e => setNuevaPassword(e.target.value)}
                  className="w-full mt-1 p-3 bg-white border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-2xl outline-none text-slate-900 pr-12"
                  placeholder="Mínimo 6 caracteres, una letra y un número"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Checkmarks de validación */}
              {nuevaPassword.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className={`text-xs flex items-center gap-2 ${nuevaPassword.length >= 6 ? 'text-green-600' : 'text-slate-400'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${nuevaPassword.length >= 6 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      {nuevaPassword.length >= 6 ? '✓' : '○'}
                    </span>
                    Mínimo 6 caracteres
                  </p>
                  <p className={`text-xs flex items-center gap-2 ${/[A-Za-z]/.test(nuevaPassword) ? 'text-green-600' : 'text-slate-400'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${/[A-Za-z]/.test(nuevaPassword) ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      {/[A-Za-z]/.test(nuevaPassword) ? '✓' : '○'}
                    </span>
                    Al menos una letra
                  </p>
                  <p className={`text-xs flex items-center gap-2 ${/[0-9]/.test(nuevaPassword) ? 'text-green-600' : 'text-slate-400'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${/[0-9]/.test(nuevaPassword) ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      {/[0-9]/.test(nuevaPassword) ? '✓' : '○'}
                    </span>
                    Al menos un número
                  </p>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmarPassword}
                  onChange={e => setConfirmarPassword(e.target.value)}
                  className="w-full mt-1 p-3 bg-white border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-2xl outline-none text-slate-900 pr-12"
                  placeholder="Repetí la contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Validación de coincidencia */}
              {confirmarPassword.length > 0 && (
                <p className={`text-xs mt-2 flex items-center gap-2 ${nuevaPassword === confirmarPassword ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${nuevaPassword === confirmarPassword ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {nuevaPassword === confirmarPassword ? '✓' : '✕'}
                  </span>
                  {nuevaPassword === confirmarPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                </p>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading || !passwordValidation.valid || nuevaPassword !== confirmarPassword}
              className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}