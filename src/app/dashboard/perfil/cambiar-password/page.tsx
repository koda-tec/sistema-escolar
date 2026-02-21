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
  
  const supabase = createClient()
  const router = useRouter()

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
            <div>
              <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Nueva Contraseña</label>
              <input 
                type="password"
                value={nuevaPassword}
                onChange={e => setNuevaPassword(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none"
                placeholder="Mínimo 6 caracteres, una letra y un número"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Confirmar Nueva Contraseña</label>
              <input 
                type="password"
                value={confirmarPassword}
                onChange={e => setConfirmarPassword(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none"
                placeholder="Repetí la contraseña"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}