'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

export default function GestionAlumnos() {
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([]) // Unificamos a 'courses'
  const [parents, setParents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Estados del Formulario
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    fullName: '', 
    dni: '', 
    courseId: '', 
    parentId: '' 
  })
  const [parentEmail, setParentEmail] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.school_id) {
        setLoading(false)
        return
      }

      // 1. Cargar Cursos
      const { data: c } = await supabase
        .from('courses')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name')
      setCourses(c || []) // Corregido el nombre de la función

      // 2. Cargar Padres de la escuela (para hermanos)
      const { data: p } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'padre')
        .eq('school_id', profile.school_id)
        .order('full_name')
      setParents(p || [])

      // 3. Cargar Alumnos con relaciones
      const { data: s } = await supabase
        .from('students')
        .select('*, courses(name, section, shift), profiles:parent_id(full_name, email)')
        .eq('school_id', profile.school_id)
        .order('full_name')
      setStudents(s || [])

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (alumno: any) => {
    setEditingId(alumno.id)
    setFormData({
      fullName: alumno.full_name,
      dni: alumno.dni,
      courseId: alumno.course_id,
      parentId: alumno.parent_id || ''
    })
    setParentEmail('') // Limpiamos el email al editar por ID
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Dar de baja a este alumno? Se borrará su historial de asistencia y libretas.")) return
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (!error) {
      toast.success("Alumno eliminado")
      fetchInitialData()
    } else {
      toast.error("Error al eliminar")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user?.id)
        .single()

      if (!profile?.school_id) throw new Error("No se identificó la escuela")

      let finalParentId = formData.parentId

      // LÓGICA DE BÚSQUEDA POR EMAIL
      if (parentEmail.trim() !== '') {
        const { data: foundParent, error: searchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', parentEmail.trim().toLowerCase())
          .eq('role', 'padre')
          .maybeSingle()

        if (searchError || !foundParent) {
          throw new Error("No se encontró ningún padre con ese email. Debe registrarse primero.")
        }
        finalParentId = foundParent.id
      }

      if (!finalParentId) {
        throw new Error("Seleccioná un tutor o ingresá su email")
      }

      if (editingId) {
        // ACTUALIZAR
        const { error } = await supabase.from('students').update({
          full_name: formData.fullName,
          dni: formData.dni,
          course_id: formData.courseId,
          parent_id: finalParentId
        }).eq('id', editingId)
        if (error) throw error
        toast.success("Alumno actualizado")
      } else {
        // CREAR
        const { data: newStudent, error: createError } = await supabase
          .from('students')
          .insert({
            full_name: formData.fullName,
            dni: formData.dni,
            course_id: formData.courseId,
            parent_id: finalParentId,
            school_id: profile.school_id
          })
          .select().single()

        if (createError) throw createError
        
        // Notificar al padre (API silenciosa)
        fetch('/api/padres/notificar-vinculacion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            studentId: newStudent.id, 
            studentName: formData.fullName, 
            padreId: finalParentId 
          })
        })
        
        toast.success("Alumno registrado y vinculado")
      }

      setEditingId(null)
      setFormData({ fullName: '', dni: '', courseId: '', parentId: '' })
      setParentEmail('')
      fetchInitialData()

    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-400">CARGANDO LEGAJOS...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Gestión de Alumnos</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <div className="text-xs font-black text-blue-600 border-b border-slate-50 pb-2 uppercase tracking-widest">
          {editingId ? '📝 Editando Alumno' : '✨ Nuevo Ingreso'}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Completo</label>
            <input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold border-none" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">DNI / Legajo</label>
            <input value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold border-none" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Curso Asignado</label>
            <select value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold border-none" required>
              <option value="">Seleccionar curso...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name} "{c.section}" - {c.shift}</option>)}
            </select>
          </div>

          {/* VINCULACIÓN */}
          <div className="space-y-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-blue-600 uppercase ml-2">Opción A: Buscar en lista</label>
              <select 
                value={formData.parentId} 
                onChange={e => {setFormData({...formData, parentId: e.target.value}); setParentEmail('')}} 
                className="w-full p-3 bg-white rounded-xl outline-none text-slate-900 font-bold border border-slate-200 text-xs"
                disabled={parentEmail !== ''}
              >
                <option value="">-- Seleccionar tutor existente --</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
              </select>
            </div>

            <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-4 text-[8px] font-black text-slate-300 uppercase">O BIEN</span>
                <div className="grow border-t border-slate-200"></div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-blue-600 uppercase ml-2">Opción B: Escribir Email</label>
              <input 
                type="email"
                value={parentEmail} 
                onChange={e => {setParentEmail(e.target.value); setFormData({...formData, parentId: ''})}} 
                placeholder="ejemplo@correo.com"
                className="w-full p-3 bg-white rounded-xl outline-none text-slate-900 font-bold border border-slate-200 text-xs"
              />
            </div>
          </div>
        </div>

        <button disabled={loading} className="w-full bg-slate-950 text-white py-5 rounded-2rem font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50">
          {loading ? 'Procesando...' : (editingId ? 'Guardar Cambios' : 'Registrar y Vincular')}
        </button>
      </form>

      {/* TABLA */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr><th className="p-6">Alumno</th><th className="p-6">Curso</th><th className="p-6">Responsable</th><th className="p-6 text-center">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-all">
                  <td className="p-6 font-bold text-slate-900 notranslate text-sm">
                    {s.full_name} <br/><span className="text-[10px] font-medium text-slate-400 uppercase">DNI {s.dni}</span>
                  </td>
                  <td className="p-6 text-xs font-bold text-slate-600">
                    {s.courses?.name} "{s.courses?.section}" <br/><span className="text-[9px] opacity-50 uppercase">{s.courses?.shift}</span>
                  </td>
                  <td className="p-6">
                     <p className="text-blue-700 font-black text-[11px] uppercase">{(s.profiles as any)?.full_name}</p>
                     <p className="text-[10px] text-slate-400 italic">{(s.profiles as any)?.email}</p>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(s)} className="w-9 h-9 bg-slate-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm">✏️</button>
                        <button onClick={() => handleDelete(s.id)} className="w-9 h-9 bg-slate-100 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm">🗑️</button>
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