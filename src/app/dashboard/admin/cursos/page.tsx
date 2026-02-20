'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'

export default function GestionCursos() {
  const [courses, setCourses] = useState<any[]>([])
  const [newName, setNewName] = useState('')
  const [newSection, setNewSection] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).single()
    
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('school_id', profile?.school_id)
    setCourses(data || [])
  }

  async function addCourse(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).single()

    await supabase.from('courses').insert({
      name: newName,
      section: newSection,
      school_id: profile?.school_id
    })
    
    setNewName('')
    setNewSection('')
    fetchCourses()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Gestión de Cursos</h1>
      
      {/* Formulario de Creación */}
      <form onSubmit={addCourse} className="bg-white p-6 rounded-2xl shadow-sm border flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-900 uppercase">Año</label>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: 1er Año" className="w-full p-2 border rounded-xl text-slate-900" required />
        </div>
        <div className="w-32">
          <label className="text-xs font-bold text-slate-900 uppercase">División</label>
          <input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="Ej: A" className="w-full p-2 border rounded-xl text-slate-900" required />
        </div>
        <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold">Crear Curso</button>
      </form>

      {/* Lista de Cursos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-lg">{c.name} "{c.section}"</h3>
            <p className="text-xs text-slate-400">ID: {c.id.slice(0,8)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}