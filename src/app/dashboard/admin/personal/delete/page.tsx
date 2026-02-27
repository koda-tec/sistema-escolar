'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

export default function GestionPersonal() {
  // Estados
  const [personal, setPersonal] = useState<any[]>([])
  const [cursosDisponibles, setCursosDisponibles] = useState<any[]>([])
  const [cursosSeleccionados, setCursosSeleccionados] = useState<string[]>([])

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'preceptor' | 'docente'>('docente')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()
    if (!profile?.school_id) return

    const { data: pers } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', profile.school_id)
      .in('role', ['preceptor', 'docente'])
      .order('full_name')
    setPersonal(pers || [])

    const { data: curs } = await supabase
      .from('courses')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('name')
    setCursosDisponibles(curs || [])
  }

  const toggleCurso = (id: string) => {
    setCursosSeleccionados(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: directorProfile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

    if (!directorProfile?.school_id) {
      toast.error('No se pudo identificar la escuela')
      setLoading(false)
      return
    }

    const response = await fetch('/api/invite-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        fullName,
        role,
        schoolId: directorProfile.school_id,
        password,
        assignedCourses: role === 'preceptor' ? cursosSeleccionados : []
      })
    })

    const result = await response.json()

    if (result.error) toast.error(result.error)
    else {
      toast.success(result.message)
      setEmail(''); setFullName(''); setPassword(''); setCursosSeleccionados([])
      fetchInitialData()
    }
    setLoading(false)
  }

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`¿Estás seguro de eliminar a ${userName}? Esta acción no se puede deshacer.`)) return

    try {
      const res = await fetch('/api/personal/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${userName} eliminado correctamente`)
      fetchInitialData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Gestión de Personal</h1>

      {/* Formulario creación */}
      <form onSubmit={handleCreate} className="bg-white p-5 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
        {/* Aquí tu formulario (puedes copiar el que ya tienes) */}
      </form>

      {/* Tabla con botón eliminar */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-600px">
            <thead className="bg-slate-50 border-b text-[11px] uppercase text-slate-900 font-black">
              <tr>
                <th className="p-4 md:p-6">Nombre</th>
                <th className="p-4 md:p-6">Email</th>
                <th className="p-4 md:p-6">Rol</th>
                <th className="p-4 md:p-6">Estado</th>
                <th className="p-4 md:p-6 text-right min-w-[80px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {personal.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 md:p-6 font-bold text-slate-900">{p.full_name || 'Sin nombre'}</td>
                  <td className="p-4 md:p-6 text-slate-600">{p.email}</td>
                  <td className="p-4 md:p-6">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                      p.role === 'preceptor' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>{p.role}</span>
                  </td>
                  <td className="p-4 md:p-6"><span className="text-green-600 font-medium">✓ Activo</span></td>
                  <td className="p-4 md:p-6 text-right min-w-[80px]">
                    <button
                      onClick={() => handleDelete(p.id, p.full_name)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Eliminar usuario"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {personal.length === 0 && (
          <div className="p-10 text-center text-slate-400">
            <p className="text-lg mb-2">📭</p>
            <p>No hay personal registrado en esta institución.</p>
          </div>
        )}
      </div>
    </div>
  )
}