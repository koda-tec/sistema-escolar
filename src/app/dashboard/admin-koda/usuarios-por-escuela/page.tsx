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
    <div className="max-w-7xl mx-auto p-8 space-y-10 bg-white rounded-3xl shadow-xl">
      <header className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-slate-900">Usuarios por Escuela</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-3xl font-bold shadow-lg shadow-blue-300 hover:bg-blue-700 transition"
          aria-label="Crear nuevo usuario"
        >
          {showCreateForm ? '✕ Cancelar' : '+ Crear Usuario'}
        </button>
      </header>

      {showCreateForm && (
        <div className="border border-gray-200 rounded-xl p-6 shadow-lg bg-gray-50 max-w-4xl mx-auto">
          <CreateUserForm
            schools={schools}
            onUserCreated={handleUserCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <section className="flex flex-wrap gap-6 justify-center md:justify-start">
        <select
          value={selectedSchool}
          onChange={e => setSelectedSchool(e.target.value)}
          className="flex-1 min-w-[250px] max-w-sm p-4 rounded-lg border border-gray-300 bg-white text-gray-900 font-semibold focus:outline-none focus:ring-4 focus:ring-blue-400"
        >
          <option value="" disabled>
            -- Seleccionar Escuela --
          </option>
          {schools.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as any)}
          className="flex-1 min-w-[160px] max-w-xs p-4 rounded-lg border border-gray-300 bg-white text-gray-900 font-semibold focus:outline-none focus:ring-4 focus:ring-blue-400"
        >
          <option value="all">Todos los roles</option>
          <option value="docente">Docentes</option>
          <option value="preceptor">Preceptores</option>
          <option value="directivo">Directivos</option>
          <option value="padre">Padres</option>
        </select>
      </section>

      {loading && (
        <p className="text-center italic text-gray-600 mt-16 text-lg">Cargando usuarios...</p>
      )}

      {!loading && users.length === 0 && (
        <p className="text-center italic text-gray-600 mt-16 text-lg">No se encontraron usuarios.</p>
      )}

      {!loading && users.length > 0 && (
        <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200 bg-white">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 uppercase tracking-wide">
                  Nombre
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 uppercase tracking-wide">
                  Rol
                </th>
                {roleFilter === 'padre' && (
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 uppercase tracking-wide">
                    Alumnos asociados
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="hover:bg-blue-50 transition">
                  <td className="py-4 px-6 flex items-center gap-3 text-lg font-medium text-slate-900">
                    <span>{getRoleIcon(user.role)}</span> {user.full_name}
                  </td>
                  <td className="py-4 px-6 text-gray-700">{user.email}</td>
                  <td>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        user.role === 'directivo'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'docente'
                          ? 'bg-blue-100 text-blue-800'
                          : user.role === 'preceptor'
                          ? 'bg-amber-100 text-amber-800'
                          : user.role === 'padre'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  {roleFilter === 'padre' && (
                    <td className="py-4 px-6 text-gray-700">Implementar vínculo</td>
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