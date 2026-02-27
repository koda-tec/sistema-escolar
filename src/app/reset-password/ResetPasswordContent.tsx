'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { validatePassword } from '@/app/utils/passwordValidator'

export default function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      // Verificamos si el usuario llegó con una sesión válida (puesta por el callback)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Sesión inválida o expirada. Solicitá un nuevo enlace.')
        router.push('/login')
      } else {
        setIsVerifying(false)
      }
    }
    checkUser()
  }, [router, supabase])

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
      toast.error(validation.errors?.[0] || 'Contraseña muy débil')
      setLoading(false)
      return
    }

    // Actualizamos la contraseña del usuario que ya está autenticado por el link
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      toast.success('¡Contraseña actualizada con éxito!')
      // Redirigimos al dashboard ya logueado
      setTimeout(() => router.push('/dashboard'), 1500)
    }
    setLoading(false)
  }

  if (isVerifying) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden text-left font-sans">
      <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white space-y-8 z-10">
        <div className="text-left">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Nueva Contraseña</h2>
          <p className="text-slate-500 mt-2 font-medium leading-tight text-sm">Establecé tu nueva clave de acceso para KodaEd.</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 ml-1 mb-1">Nueva Clave</label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 ml-1 mb-1">Confirmar Clave</label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold" 
                placeholder="••••••••" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? 'Guardando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}