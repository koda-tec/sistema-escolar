'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function GestionCursos() {
  const [courses, setCourses] = useState<any[]>([])
  const [newName, setNewName] = useState('')
  const [newSection, setNewSection] = useState('')
  const [newShift, setNewShift] = useState('Mañana') // Turno por defecto
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()
    
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('school_id', profile?.school_id)
      .order('shift', { ascending: true }) // Ordenamos primero por turno
      .order('name', { ascending: true })  // Luego por año
    setCourses(data || [])
  }

  async function addCourse(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

    const { error } = await supabase.from('courses').insert({
      name: newName,
      section: newSection,
      shift: newShift,
      school_id: profile?.school_id
    })

    if (error) {
      if (error.code === '23505') {
        toast.error("Este curso ya existe en este turno.")
      } else {
        toast.error("Error: " + error.message)
      }
    } else {
      toast.success("Curso creado exitosamente")
      setNewName(''); setNewSection('');
      fetchCourses()
    }
    setLoading(false)
  }

  // Agrupamos los cursos por turno para la vista
  const turnos = ['Mañana', 'Tarde', 'Noche']

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Gestión de Cursos</h1>
        <p className="text-slate-500 font-medium">Configurá la estructura académica de la institución.</p>
      </header>
      
      {/* Formulario de Creación Responsivo */}
      <form onSubmit={addCourse} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-left">
        <div className="md:col-span-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Año / Grado</label>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: 1er Año" className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold" required />
        </div>
        <div className="md:col-span-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">División</label>
          <input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="Ej: A" className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold" required />
        </div>
        <div className="md:col-span-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Turno</label>
          <select value={newShift} onChange={e => setNewShift(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold">
            <option value="Mañana">☀️ Mañana</option>
            <option value="Tarde">🌤️ Tarde</option>
            <option value="Noche">🌙 Noche</option>
          </select>
        </div>
        <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
          {loading ? '...' : 'Crear Curso'}
        </button>
      </form>

      {/* Visualización Organizada por Turnos */}
      <div className="space-y-12 text-left">
        {turnos.map(turno => {
          const cursosDelTurno = courses.filter(c => c.shift === turno)
          if (cursosDelTurno.length === 0) return null

          return (
            <div key={turno} className="space-y-6">
              {/* Header del Turno */}
              <div className="flex items-center gap-4">
                <h2 className={`text-xl font-black uppercase tracking-tighter ${
                  turno === 'Mañana' ? 'text-blue-600' : turno === 'Tarde' ? 'text-orange-600' : 'text-indigo-600'
                }`}>
                  Turno {turno}
                </h2>
                <div className="h-px flex-1 bg-slate-100"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{cursosDelTurno.length} cursos</span>
              </div>

              {/* Grilla de Cursos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cursosDelTurno.map(c => (
                  <Link 
                    key={c.id} 
                    href={`/dashboard/admin/cursos/${c.id}`} 
                    className="bg-white p-6 rounded-2rem border border-slate-100 hover:border-blue-500 transition-all group"
                  >
                    <h3 className="font-black text-2xl text-slate-900">{c.name}</h3>
                    <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em]">División "{c.section}"</p>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase">
                      <span>ID: {c.id.slice(0,8)}</span>
                      <span className="group-hover:text-blue-400">ACTIVO</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
