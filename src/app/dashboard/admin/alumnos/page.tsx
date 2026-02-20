'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'

export default function GestionAlumnos() {
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  
  const [fullName, setFullName] = useState('')
  const [dni, setDni] = useState('')
  const [courseId, setCourseId] = useState('')
  const [parentId, setParentId] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

    const { data: c } = await supabase.from('courses').select('*').eq('school_id', profile?.school_id)
    setCourses(c || [])

    const { data: p } = await supabase.from('profiles').select('*').eq('role', 'padre')
    setParents(p || [])

    const { data: s } = await supabase
      .from('students')
      .select('*, courses(name, section), profiles!parent_id(full_name)')
      .eq('school_id', profile?.school_id)
    setStudents(s || [])
  }

  async function createStudent(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

    const { error } = await supabase.from('students').insert({
      full_name: fullName,
      dni,
      course_id: courseId,
      parent_id: parentId,
      school_id: profile?.school_id
    })

    if (error) alert(error.message)
    else {
      setFullName(''); setDni(''); fetchInitialData()
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Gestión de Alumnos</h1>

      <form onSubmit={createStudent} className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 text-sm font-bold text-blue-600 border-b pb-2 uppercase tracking-wider">Nuevo Ingreso</div>
        
        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Nombre del Alumno</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900" placeholder="Apellido y Nombre" required />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">DNI / Legajo</label>
          <input value={dni} onChange={e => setDni(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900" placeholder="Sin puntos" required />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Asignar Curso</label>
          <select value={courseId} onChange={e => setCourseId(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900" required>
            <option value="">Seleccione...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name} "{c.section}"</option>)}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Vincular Padre / Tutor</label>
          <select value={parentId} onChange={e => setParentId(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900" required>
            <option value="">Seleccione un usuario...</option>
            {parents.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>

        <button className="md:col-span-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95">
          Registrar Alumno y Vincular Familia
        </button>
      </form>

      {/* Lista de Alumnos con scroll horizontal en móvil */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-500px">
            <thead className="bg-slate-50 border-b text-[11px] uppercase text-slate-900 font-black">
              <tr>
                <th className="p-4 md:p-6">Alumno</th>
                <th className="p-4 md:p-6">Curso</th>
                <th className="p-4 md:p-6">Tutor Vinculado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 md:p-6">
                    <p className="font-bold text-slate-900">{s.full_name}</p>
                    <p className="text-[10px] font-medium text-slate-500 tracking-tight">DNI: {s.dni}</p>
                  </td>
                  <td className="p-4 md:p-6 text-slate-800 font-medium">
                    {s.courses?.name} "{s.courses?.section}"
                  </td>
                  <td className="p-4 md:p-6 text-blue-700 font-bold">
                    {s.profiles?.full_name || 'Sin vincular'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}