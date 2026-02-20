'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'

export default function GestionAlumnos() {
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  const [form, setForm] = useState({ fullName: '', dni: '', courseId: '', parentId: '' })
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).single()

    // Traer Cursos de la escuela
    const { data: c } = await supabase.from('courses').select('*').eq('school_id', profile?.school_id)
    setCourses(c || [])

    // Traer todos los Padres registrados en el sistema para vincularlos
    const { data: p } = await supabase.from('profiles').select('*').eq('role', 'padre')
    setParents(p || [])

    // Traer Alumnos actuales con sus relaciones
    const { data: s } = await supabase.from('students').select('*, courses(name, section), profiles!parent_id(full_name)').eq('school_id', profile?.school_id)
    setStudents(s || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase.from('profiles').select('school_id').eq('id', user?.id).single()

    const { error } = await supabase.from('students').insert({
      full_name: form.fullName,
      dni: form.dni,
      course_id: form.courseId,
      parent_id: form.parentId,
      school_id: prof?.school_id
    })

    if (error) alert("Error: " + error.message)
    else {
      setForm({ fullName: '', dni: '', courseId: '', parentId: '' })
      loadData()
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Inscripción y Vinculación</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2rem border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Datos del Alumno</div>
        
        <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Nombre completo del alumno" className="p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" required />
        <input value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} placeholder="DNI del alumno" className="p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" required />
        
        <select value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value})} className="p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" required>
          <option value="">Seleccionar Curso...</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
        </select>

        <select value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})} className="p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none" required>
          <option value="">Vincular con Padre/Tutor...</option>
          {parents.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>

        <button className="md:col-span-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg">
          Finalizar Inscripción
        </button>
      </form>

      <div className="bg-white rounded-2rem border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
            <tr>
              <th className="p-6">Alumno</th>
              <th className="p-6">Curso</th>
              <th className="p-6">Tutor a cargo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map(s => (
              <tr key={s.id} className="text-sm">
                <td className="p-6 font-bold text-slate-700">{s.full_name}</td>
                <td className="p-6">{s.courses?.name} {s.courses?.section}</td>
                <td className="p-6 text-blue-600 font-semibold">{s.profiles?.full_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}