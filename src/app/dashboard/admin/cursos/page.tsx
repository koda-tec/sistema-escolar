'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'

export default function GestionCursos() {
  const [courses, setCourses] = useState<any[]>([])
  const [newName, setNewName] = useState('')
  const [newSection, setNewSection] = useState('')
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
    setCourses(data || [])
  }

  async function addCourse(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

    await supabase.from('courses').insert({
      name: newName,
      section: newSection,
      school_id: profile?.school_id
    })
    
    setNewName('')
    setNewSection('')
    await fetchCourses()
    setLoading(false)
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Gestión de Cursos</h1>
      
      {/* Formulario de Creación Responsivo */}
      <form onSubmit={addCourse} className="bg-white p-6 rounded-3xl shadow-sm border grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Año / Grado</label>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: 1er Año" className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900 font-medium" required />
        </div>
        <div className="md:col-span-1">
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">División</label>
          <input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="Ej: A" className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900 font-medium" required />
        </div>
        <button disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">
          {loading ? '...' : 'Crear Curso'}
        </button>
      </form>

      {/* Lista de Cursos en Grid Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {courses.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</h3>
                <p className="text-blue-600 font-black text-2xl uppercase">División "{c.section}"</p>
              </div>
              <div className="bg-slate-100 p-2 rounded-lg text-slate-400 font-bold text-xs uppercase">
                ID: {c.id.slice(0,5)}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span>Estado: Activo</span>
              <span>SaaS ID: {c.school_id?.slice(0,5)}</span>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
           <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">No hay cursos registrados todavía.</p>
           </div>
        )}
      </div>
    </div>
  )
}