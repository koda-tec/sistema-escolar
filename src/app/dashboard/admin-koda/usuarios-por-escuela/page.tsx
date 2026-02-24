'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

export default function UsuariosPorEscuela() {
  const [schools, setSchools] = useState<any[]>([])
  const [selectedSchool, setSelectedSchool] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [roleFilter, setRoleFilter] = useState<'docente' | 'preceptor' | 'directivo' | 'padre' | 'all'>('all')

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Usuarios por escuela</h1>

      <div className="flex gap-4 flex-wrap">
        <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)} className="p-2 rounded-md border">
          <option value="">-- Seleccionar Escuela --</option>
          {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)} className="p-2 rounded-md border">
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
                <th className="border border-gray-300 p-2">Nombre</th>
                <th className="border border-gray-300 p-2">Email</th>
                <th className="border border-gray-300 p-2">Rol</th>
                {roleFilter === 'padre' && <th className="border border-gray-300 p-2">Alumnos asociados</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-100">
                  <td className="border border-gray-300 p-2">{user.full_name}</td>
                  <td className="border border-gray-300 p-2">{user.email}</td>
                  <td className="border border-gray-300 p-2 capitalize">{user.role}</td>
                  {roleFilter === 'padre' && (
                    <td className="border border-gray-300 p-2">
                      {/* Aquí podes mostrar los alumnos relacionados (hay que implementar) */}
                      {/* Ejemplo simple */}
                      {/* Por ahora vacío o "Implementar vínculo" */}
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