'use client'

import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

interface School {
  id: string
  name: string
}

interface Props {
  schools: School[]
  onUserCreated: () => void
  onCancel: () => void
}

export default function CreateUserForm({ schools, onUserCreated, onCancel }: Props) {
  const [selectedSchool, setSelectedSchool] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'directivo' | 'docente' | 'preceptor'>('directivo')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const supabase = createClient()

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let pass = ''
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    pass = 'K' + pass.slice(1, 8) + '9' // asegurar formato
    setPassword(pass)
    toast.success('Contraseña generada')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if(!selectedSchool || !email || !fullName || !password){
      toast.error('Completa todos los campos por favor')
      return
    }
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
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Error desconocido')

      toast.success(result.message || 'Usuario creado con éxito')
      onUserCreated()

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">Crear Nuevo Usuario</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Institución *</label>
          <select
            value={selectedSchool}
            onChange={e => setSelectedSchool(e.target.value)}
            className="w-full p-2 border rounded-md bg-gray-50"
            required
          >
            <option value="">-- Seleccionar --</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol *</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value as any)}
            className="w-full p-2 border rounded-md bg-gray-50"
          >
            <option value="directivo">👔 Directivo</option>
            <option value="docente">📚 Docente</option>
            <option value="preceptor">📋 Preceptor</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo *</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Ej: María González"
            className="w-full p-2 border rounded-md bg-gray-50"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico *</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="correo@escuela.edu.ar"
            className="w-full p-2 border rounded-md bg-gray-50"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña Provisoria *</label>
          <div className="flex gap-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="flex-1 p-2 border rounded-md bg-gray-50"
              required
            />
            <button
              type="button"
              onClick={generatePassword}
              className="px-3 py-2 bg-blue-100 text-blue-600 rounded-md text-sm font-bold hover:bg-blue-200"
            >
              Generar
            </button>
          </div>
          <div className="mt-1">
            <label className="text-xs text-gray-500">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={e => setShowPassword(e.target.checked)}
                className="mr-1"
              />
              Mostrar contraseña
            </label>
          </div>
        </div>

        <div className="col-span-full flex justify-between items-center mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-6 rounded-md font-bold hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>

          <button
            type="button"
            className="text-gray-600 hover:text-gray-900 font-bold"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </form>
      <p className="text-xs text-gray-400 mt-3">
        El usuario recibirá un email con sus credenciales y deberá cambiar la contraseña al ingresar.
      </p>
    </div>
  )
}