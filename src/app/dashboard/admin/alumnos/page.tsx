'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

export default function GestionAlumnos() {
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ fullName: '', dni: '', courseId: '', parentId: '' })

  const supabase = createClient()

  useEffect(() => { fetchInitialData() }, [])

  async function fetchInitialData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

    const { data: c } = await supabase.from('courses').select('*').eq('school_id', profile?.school_id).order('name')
    setCourses(c || [])

    const { data: p } = await supabase.from('profiles').select('id, full_name').eq('role', 'padre').eq('school_id', profile?.school_id)
    setParents(p || [])

    const { data: s } = await supabase
      .from('students')
      .select('*, courses(name, section, shift), profiles:parent_id(full_name)')
      .eq('school_id', profile?.school_id)
      .order('full_name')
    setStudents(s || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

    if (editingId) {
      // ACTUALIZAR
      const { error } = await supabase.from('students').update({
        full_name: formData.fullName,
        dni: formData.dni,
        course_id: formData.courseId,
        parent_id: formData.parentId
      }).eq('id', editingId)
      
      if (!error) { 
        toast.success("Alumno actualizado") 
        setEditingId(null) 
      }
      else toast.error(error.message)
    } else {
      // CREAR
      const { data: newStudent, error } = await supabase.from('students').insert({
        full_name: formData.fullName,
        dni: formData.dni,
        course_id: formData.courseId,
        parent_id: formData.parentId,
        school_id: profile?.school_id
      }).select().single()

      if (!error) {
        toast.success("Alumno registrado")
        
        // === ENVIAR NOTIFICACIÓN AL PADRE ===
        if (formData.parentId) {
          try {
            await fetch('/api/padres/notificar-vinculacion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: newStudent.id,
    studentName: formData.fullName,
    padreId: formData.parentId
  })
})
            toast.success("Notificación enviada al padre")
          } catch (err) {
            console.error('Error enviando notificación al padre:', err)
          }
        }
        // ======================================
      }
      else toast.error(error.message)
    }

    setFormData({ fullName: '', dni: '', courseId: '', parentId: '' })
    fetchInitialData()
  }

  const handleEdit = (alumno: any) => {
    setEditingId(alumno.id)
    setFormData({
      fullName: alumno.full_name,
      dni: alumno.dni,
      courseId: alumno.course_id,
      parentId: alumno.parent_id
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Dar de baja a este alumno? Se borrará su historial de asistencia y libretas.")) return
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (!error) { toast.success("Alumno eliminado"); fetchInitialData() }
  }

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest">Sincronizando Legajos...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Gestión de Alumnos</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div className="md:col-span-2 text-xs font-black text-blue-600 border-b border-slate-50 pb-2 uppercase tracking-[0.2em]">
          {editingId ? '📝 Editando Alumno' : '✨ Nuevo Ingreso'}
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Completo</label>
          <input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold" placeholder="Apellido y Nombre" required />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">DNI / Legajo</label>
          <input value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold" placeholder="Sin puntos" required />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Curso y División</label>
          <select value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold" required>
            <option value="">Seleccionar...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name} "{c.section}" - {c.shift}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Vincular Tutor</label>
          <select value={formData.parentId} onChange={e => setFormData({...formData, parentId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold" required>
            <option value="">Buscar responsable...</option>
            {parents.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>

        <div className="md:col-span-2 flex gap-3 mt-2">
            <button className="flex-1 bg-slate-950 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95">
            {editingId ? 'Guardar Cambios' : 'Registrar Alumno'}
            </button>
            {editingId && (
                <button type="button" onClick={() => {setEditingId(null); setFormData({fullName:'', dni:'', courseId:'', parentId:''})}} className="px-8 bg-slate-100 text-slate-500 rounded-2xl font-bold uppercase text-xs">Cancelar</button>
            )}
        </div>
      </form>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr><th className="p-6">Alumno</th><th className="p-6">Curso / Turno</th><th className="p-6">Responsable</th><th className="p-6 text-center">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-bold text-slate-800 notranslate">{s.full_name} <br/><span className="text-[10px] font-medium text-slate-400">DNI {s.dni}</span></td>
                  <td className="p-6 text-sm font-bold text-slate-600">{s.courses?.name} "{s.courses?.section}" <br/><span className="text-[9px] uppercase opacity-50">{s.courses?.shift}</span></td>
                  <td className="p-6 text-blue-600 font-bold text-xs">{s.profiles?.full_name}</td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(s)} className="p-2 bg-slate-100 rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-all">✏️</button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 bg-slate-100 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all">🗑️</button>
                    </div>
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