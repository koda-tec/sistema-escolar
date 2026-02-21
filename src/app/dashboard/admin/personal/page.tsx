'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useToast } from '@/app/components/Toast'

export default function GestionPersonal() {
  const [personal, setPersonal] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'preceptor' | 'docente'>('docente')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { showToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchPersonal()
  }, [])

  async function fetchPersonal() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

    if (!profile?.school_id) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', profile.school_id)
      .in('role', ['preceptor', 'docente'])
      .order('full_name', { ascending: true })
    
    setPersonal(data || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: directorProfile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

    if (!directorProfile?.school_id) {
      showToast('No se pudo identificar la escuela', 'error')
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
        password
      })
    })

    const result = await response.json()

    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast(result.message, 'success')
      setEmail('')
      setFullName('')
      setPassword('')
      fetchPersonal()
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Gestión de Personal</h1>

      <form onSubmit={handleCreate} className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="md:col-span-2 lg:col-span-4 text-sm font-bold text-blue-600 border-b pb-2 uppercase tracking-wider mb-2">
          Crear Nuevo Miembro
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Nombre Completo</label>
          <input 
            type="text" 
            value={fullName} 
            onChange={e => setFullName(e.target.value)} 
            className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900" 
            placeholder="Juan Pérez" 
            required 
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900" 
            placeholder="profesor@email.com" 
            required 
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Contraseña Provisoria</label>
          <input 
            type="text" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900" 
            placeholder="Mínimo 6 caracteres" 
            minLength={6}
            required 
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Rol</label>
          <select 
            value={role} 
            onChange={e => setRole(e.target.value as 'preceptor' | 'docente')} 
            className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900"
          >
            <option value="docente">Profesor</option>
            <option value="preceptor">Preceptor</option>
          </select>
        </div>

        <div className="md:col-span-2 lg:col-span-4">
          <button 
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 text-white py-3 px-8 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Creando...' : '➕ Crear Usuario'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-500px">
            <thead className="bg-slate-50 border-b text-[11px] uppercase text-slate-900 font-black">
              <tr>
                <th className="p-4 md:p-6">Nombre</th>
                <th className="p-4 md:p-6">Email</th>
                <th className="p-4 md:p-6">Rol</th>
                <th className="p-4 md:p-6">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {personal.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 md:p-6 font-bold text-slate-900">
                    {p.full_name || 'Sin nombre'}
                  </td>
                  <td className="p-4 md:p-6 text-slate-600">
                    {p.email}
                  </td>
                  <td className="p-4 md:p-6">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                      p.role === 'preceptor' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {p.role}
                    </span>
                  </td>
                  <td className="p-4 md:p-6">
                    <span className="text-green-600 font-medium">✓ Activo</span>
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