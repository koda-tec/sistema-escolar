'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

export default function GestionPersonal() {
  // --- ESTADOS ---
  const [personal, setPersonal] = useState<any[]>([])
  const [cursosDisponibles, setCursosDisponibles] = useState<any[]>([])
  const [cursosSeleccionados, setCursosSeleccionados] = useState<string[]>([])
  
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'preceptor' | 'docente'>('docente')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

    if (!profile?.school_id) return

    // 1. Cargar Personal existente
    const { data: pers } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', profile.school_id)
      .in('role', ['preceptor', 'docente'])
      .order('full_name', { ascending: true })
    setPersonal(pers || [])

    // 2. Cargar Cursos de la escuela para asignar
    const { data: curs } = await supabase
      .from('courses')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('name')
    setCursosDisponibles(curs || [])
  }

  // --- LÓGICA DE SELECCIÓN ---
  const toggleCurso = (id: string) => {
    setCursosSeleccionados(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  // --- ACCIÓN DE CREAR ---
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
        // Solo enviamos cursos si el rol es preceptor
        assignedCourses: role === 'preceptor' ? cursosSeleccionados : [] 
      })
    })

    const result = await response.json()

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.message)
      // Resetear campos
      setEmail('')
      setFullName('')
      setPassword('')
      setCursosSeleccionados([])
      fetchInitialData() // Refrescar lista
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Gestión de Personal</h1>

      {/* FORMULARIO */}
      <form onSubmit={handleCreate} className="bg-white p-5 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
        <div className="text-sm font-bold text-blue-600 border-b pb-2 uppercase tracking-wider mb-2">
          Crear Nuevo Miembro
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Nombre Completo</label>
            <input 
              type="text" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              className="w-full p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900" 
              placeholder="Juan Pérez" 
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900" 
              placeholder="profesor@email.com" 
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Contraseña Provisoria</label>
            <input 
              type="text" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900" 
              placeholder="Mínimo 6 caracteres" 
              minLength={6}
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Rol</label>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value as 'preceptor' | 'docente')} 
              className="w-full p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900"
            >
              <option value="docente">Profesor</option>
              <option value="preceptor">Preceptor</option>
            </select>
          </div>
        </div>

        {/* ASIGNACIÓN DE CURSOS (Solo para Preceptores) */}
        {/* Reemplaza la sección de ASIGNACIÓN DE CURSOS por esta: */}
{role === 'preceptor' && (
  <div className="space-y-6 pt-6 border-t border-slate-100">
    <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Asignar Cursos por Turno:</h3>
    
    {['Mañana', 'Tarde', 'Noche'].map(turno => {
      const cursosDelTurno = cursosDisponibles.filter(c => c.shift === turno);
      if (cursosDelTurno.length === 0) return null;

      return (
        <div key={turno} className="space-y-3 bg-slate-50/50 p-4 rounded-2rem border border-slate-100">
          <p className="text-[10px] font-black uppercase text-blue-600 ml-2 tracking-widest">{turno}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {cursosDelTurno.map(curso => (
              <button
                key={curso.id}
                type="button"
                onClick={() => toggleCurso(curso.id)}
                className={`p-3 rounded-2xl text-[10px] font-black transition-all border ${
                  cursosSeleccionados.includes(curso.id)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 scale-105'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300'
                }`}
              >
                {curso.name} "{curso.section}"
              </button>
            ))}
          </div>
        </div>
      );
    })}
  </div>
)}
        <div className="pt-2">
          <button 
            disabled={loading}
            className="w-full md:w-auto bg-slate-900 text-white py-4 px-10 rounded-2xl font-bold hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : '➕ Confirmar y Enviar Acceso'}
          </button>
        </div>
      </form>

      {/* TABLA DE PERSONAL */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-600px">
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
