'use client'
import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Definimos las reglas de validación
const registerSchema = z.object({
  fullName: z.string().min(3, "El nombre es muy corto"),
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(6, "Mínimo 6 caracteres")
    .regex(/[A-Za-z]/, "Debe contener al menos una letra")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (values: RegisterFormData) => {
    setLoading(true)
    setServerError(null)

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })

    if (error) {
      if (error.message.includes("already registered")) {
        setServerError("Este correo ya está registrado. Intenta iniciar sesión.")
      } else {
        setServerError(error.message)
      }
      setLoading(false)
    } else {
      alert("Registro exitoso. Revisa tu email para confirmar tu cuenta (si la confirmación está activa en Supabase).")
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-white space-y-6">
        <div className="text-center text-slate-900">
          <h2 className="text-3xl font-bold tracking-tight">Crear cuenta</h2>
          <p className="text-slate-500 mt-2">Registrate como padre o tutor</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
            <input {...register("fullName")} className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-500' : 'border-slate-200'} outline-none focus:border-blue-600 text-slate-900`} />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input {...register("email")} className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-slate-200'} outline-none focus:border-blue-600 text-slate-900`} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña</label>
              <input type="password" {...register("password")} className={`w-full px-4 py-3 rounded-xl border ${errors.password ? 'border-red-500' : 'border-slate-200'} outline-none focus:border-blue-600 text-slate-900`} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar</label>
              <input type="password" {...register("confirmPassword")} className={`w-full px-4 py-3 rounded-xl border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'} outline-none focus:border-blue-600 text-slate-900`} />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          {serverError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-medium">{serverError}</div>}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50">
            {loading ? 'Procesando...' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600">
          ¿Ya tienes cuenta? <Link href="/login" className="text-blue-600 font-bold">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  )
}