'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

interface School {
  id: string
  name: string
}

interface Props {
  onUserCreated?: () => void
}

export default function CreateUserForm({ onUserCreated }: Props) {
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'directivo' | 'docente' | 'preceptor'>('directivo')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const supabase = createClient()

  // Cargar escuelas al montar
  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .eq('active', true)
        .order('name')

      if (error) {
        toast.error('Error cargando escuelas')
        return
      }
      setSchools(data || [])
    }
    fetchSchools()
  }, [])

  // Generar contraseña automática
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let pass = ''
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    // Asegurar al menos un número y mayúscula
    pass = 'K' + pass.slice(1, 8) + '9'
    setPassword(pass)
    toast.success('Contraseña generada automáticamente')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = role === 'directivo' 
        ? '/api/create-directive' 
        : '/api/invite-user'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          role,
          schoolId: selectedSchool,
          password
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear usuario')
      }

      toast.success(result.message)
      
      // Limpiar formulario
      setFullName('')
      setEmail('')
      setPassword('')
      setSelectedSchool('')
      
      // Notificar al padre si existe
      if (onUserCreated) onUserCreated()

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <span className="text-xl">👤</span>
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Crear Usuario</h2>
          <p className="text-xs text-slate-500">Asignar acceso a una institución</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Selección de Escuela */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Institución *
          </label>
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            required
          >
            <option value="">-- Seleccionar Escuela --</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        {/* Rol */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Rol del Usuario *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'directivo', label: 'Directivo', icon: '👔' },
              { value: 'docente', label: 'Docente', icon: '📚' },
              { value: 'preceptor', label: 'Preceptor', icon: '📋' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value as any)}
                className={`p-3 rounded-xl text-sm font-bold transition-all ${
                  role === option.value
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="block text-xl mb-1">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nombre Completo */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Nombre Completo *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej: María González"
            className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Correo Electrónico *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="director@escuela.edu.ar"
            className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            required
          />
        </div>

        {/* Contraseña */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Contraseña Provisoria *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 pr-24"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={generatePassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-bold bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Generar
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="showPass"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="rounded border-slate-300"
            />
            <label htmlFor="showPass" className="text-xs text-slate-500">
              Mostrar contraseña
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !selectedSchool || !fullName || !email || !password}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando usuario...
            </span>
          ) : (
            `Crear ${role === 'directivo' ? 'Directivo' : role === 'docente' ? 'Docente' : 'Preceptor'}`
          )}
        </button>

        <p className="text-xs text-center text-slate-400">
          El usuario recibirá un email con sus credenciales
        </p>
      </form>
    </div>
  )
}