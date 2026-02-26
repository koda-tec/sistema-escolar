'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

import CreateUserForm from '@/app/components/dashboards/CreateUserForm'
export default function UsuariosPorEscuela() {
  const [schools, setSchools] = useState<any[]>([])
  const [selectedSchool, setSelectedSchool] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [roleFilter, setRoleFilter] = useState<'docente' | 'preceptor' | 'directivo' | 'padre' | 'all'>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase.from('schools').select('*')
      if (error) toast.error(error.message)
      else setSchools(data || [])
    }
    fetchSchools()
  }, [])

  useEffect(() => {
    if (!selectedSchool) {
      setUsers([])
      return
    }
    const fetchUsers = async () => {
      setLoading(true)
      let query = supabase.from('profiles').select('*').eq('school_id', selectedSchool)
      if (roleFilter !== 'all') query = query.eq('role', roleFilter)
      const { data, error } = await query.order('full_name')
      if (error) toast.error(error.message)
      else setUsers(data || [])
      setLoading(false)
    }
    fetchUsers()
  }, [selectedSchool, roleFilter])

  const handleUserCreated = () => {
    setShowCreateForm(false)
    // Recargar usuarios tras crear uno nuevo
    if (selectedSchool) {
      const fetchUsers = async () => {
        setLoading(true)
        let query = supabase.from('profiles').select('*').eq('school_id', selectedSchool)
        if (roleFilter !== 'all') query = query.eq('role', roleFilter)
        const { data, error } = await query.order('full_name')
        if (error) toast.error(error.message)
        else setUsers(data || [])
        setLoading(false)
      }
      fetchUsers()
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'directivo': return '👔'
      case 'docente': return '📚'
      case 'preceptor': return '📋'
      case 'padre': return '👨‍👩‍👧'
      default: return '👤'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Usuarios por escuela</h1>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? '✕ Cancelar' : '+ Crear Usuario'}
        </button>
      </div>

      {showCreateForm && (
        <CreateUserForm
          schools={schools}
          onUserCreated={handleUserCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="flex gap-4 flex-wrap">
        <select
          value={selectedSchool}
          onChange={e => setSelectedSchool(e.target.value)}
          className="p-2 rounded-md border bg-white"
        >
          <option value="">-- Seleccionar Escuela --</option>
          {schools.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as any)}
          className="p-2 rounded-md border bg-white"
        >
          <option value="all">Todos los roles</option>
          <option value="docente">Docentes</option>
          <option value="preceptor">Preceptores</option>
          <option value="directivo">Directivos</option>
          <option value="padre">Padres</option>
        </select>
      </div>

      {loading && <p>Cargando usuarios...</p>}

      {!loading && users.length === 0 && <p>No se encontraron usuarios.</p>}

      {!loading && users.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 text-left">Nombre</th>
                <th className="border border-gray-300 p-2 text-left">Email</th>
                <th className="border border-gray-300 p-2 text-left">Rol</th>
                {roleFilter === 'padre' && (
                  <th className="border border-gray-300 p-2 text-left">Alumnos asociados</th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-100">
                  <td className="border border-gray-300 p-2">
                    <div className="flex items-center gap-2">
                      <span>{getRoleIcon(user.role)}</span> {user.full_name}
                    </div>
                  </td>
                  <td className="border border-gray-300 p-2">{user.email}</td>
                  <td
                    className={`border border-gray-300 p-2 capitalize ${
                      user.role === 'directivo'
                        ? 'bg-purple-100 text-purple-700'
                        : user.role === 'docente'
                        ? 'bg-blue-100 text-blue-700'
                        : user.role === 'preceptor'
                        ? 'bg-amber-100 text-amber-700'
                        : user.role === 'padre'
                        ? 'bg-green-100 text-green-700'
                        : ''
                    } rounded-full text-xs font-bold inline-block px-2 py-1`}
                  >
                    {user.role}
                  </td>
                  {roleFilter === 'padre' && (
                    <td className="border border-gray-300 p-2">
                      {/* Aquí puedes implementar el vínculo con alumnos */}
                      Implementar vínculo
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}