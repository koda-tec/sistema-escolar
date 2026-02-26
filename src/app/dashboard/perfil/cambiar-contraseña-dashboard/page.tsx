'use client'

import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { validatePassword } from '@/app/utils/passwordValidator'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CambiarPasswordDashboard() {
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const passwordValidation = validatePassword(nuevaPassword)

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (nuevaPassword !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (!passwordValidation.valid) {
      toast.error(passwordValidation.errors?.[0] || 'Contraseña inválida')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('No se encontró el usuario')
      setLoading(false)
      return
    }

    const response = await fetch('/api/cambiar-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nuevaPassword,
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
      setTimeout(() => router.push('/dashboard'), 1500)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-4">Cambiar Contraseña (Dashboard)</h1>
        <form onSubmit={handleCambiarPassword} className="space-y-6">
          <div>
            <label className="block uppercase text-xs font-bold text-slate-900 mb-1">Nueva Contraseña</label>
            <input 
              type="password"
              value={nuevaPassword}
              onChange={e => setNuevaPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres, una letra y un número"
              className="w-full px-4 py-3 border rounded-xl border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />
          </div>
          <div>
            <label className="block uppercase text-xs font-bold text-slate-900 mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={e => setConfirmarPassword(e.target.value)}
              placeholder="Repite tu nueva contraseña"
              className="w-full px-4 py-3 border rounded-xl border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 font-bold rounded-xl hover:bg-blue-700 transition"
          >
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}