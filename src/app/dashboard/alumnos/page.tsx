'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function GestionAlumnos() {
  // Estados de datos
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Estados del Formulario
  const [editingId, setEditingId] = useState<string | null>(null)
  const [parentEmail, setParentEmail] = useState('') // Para vincular por email directo
  const [formData, setFormData] = useState({ 
    fullName: '', 
    dni: '', 
    courseId: '', 
    parentId: '' 
  })

  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, role, school_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profileData?.school_id) {
        setLoading(false)
        return
      }
      setProfile(profileData)
      const userRole = profileData.role?.toLowerCase().trim()

      // 1. CARGAR CURSOS (Filtrado por rol: Preceptor solo ve sus cursos)
      if (userRole === 'preceptor') {
        const { data: assigned } = await supabase
          .from('preceptor_courses')
          .select('courses(*)')
          .eq('preceptor_id', user.id)
        const listaCursos = assigned?.map((a: any) => a.courses).filter(Boolean) || []
        setCourses(listaCursos)
      } else {
        const { data: allCourses } = await supabase
          .from('courses')
          .select('*')
          .eq('school_id', profileData.school_id)
          .order('name')
        setCourses(allCourses || [])
      }

      // 2. Cargar Padres vinculados a la escuela
      const { data: p } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'padre')
        .eq('school_id', profileData.school_id)
        .order('full_name')
      setParents(p || [])

      // 3. Cargar Alumnos con sus relaciones
      const { data: s } = await supabase
        .from('students')
        .select('*, courses(name, section, shift), profiles:parent_id(full_name, email)')
        .eq('school_id', profileData.school_id)
        .order('full_name')
      setStudents(s || [])

    } catch (error) {
      console.error("Error cargando datos:", error)
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
    setParentEmail('') // Limpiamos el campo de email al editar
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Deseas dar de baja a este alumno? Se perderá todo su historial.")) return
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (!error) {
      toast.success("Alumno eliminado")
      fetchInitialData()
    } else {
      toast.error("No se pudo eliminar: " + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let finalParentId = formData.parentId

      // LÓGICA DE VINCULACIÓN POR EMAIL (Si el preceptor escribió un email)
      if (parentEmail.trim() !== '') {
        const { data: foundParent, error: searchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', parentEmail.trim().toLowerCase())
          .eq('role', 'padre')
          .maybeSingle()

        if (searchError || !foundParent) {
          throw new Error("No existe un padre con ese email. Debe registrarse primero.")
        }
        finalParentId = foundParent.id
      }

      if (!finalParentId) throw new Error("Seleccioná un tutor o ingresá su email")

      if (editingId) {
        // ACTUALIZAR REGISTRO
        const { error } = await supabase.from('students').update({
          full_name: formData.fullName,
          dni: formData.dni,
          course_id: formData.courseId,
          parent_id: finalParentId
        }).eq('id', editingId)
        if (error) throw error
        toast.success("Legajo actualizado")
      } else {
        // CREAR REGISTRO NUEVO
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
        
        // Disparar Notificación de Vinculación (Email + Push)
        fetch('/api/padres/notificar-vinculacion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            studentId: newStudent.id, 
            studentName: formData.fullName, 
            padreId: finalParentId 
          })
        }).catch(err => console.error("Error notificación:", err))
        
        toast.success("Alumno registrado y familia notificada")
      }

      // Resetear Formulario
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

  if (loading) return (
    <div className="p-20 text-center animate-pulse flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando Nómina...</p>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Gestión de Alumnos</h1>
          <p className="text-slate-500 font-medium">Administrá inscripciones y vínculos familiares.</p>
        </div>
        <Link 
          href="/dashboard/admin/alumnos/promocion" 
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          🚀 Promoción de Ciclo
        </Link>
      </header>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <div className="text-xs font-black text-blue-600 border-b border-slate-50 pb-2 uppercase tracking-widest">
          {editingId ? '📝 Editando Registro' : '✨ Nuevo Ingreso'}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-900 uppercase ml-2 tracking-widest">Nombre Completo</label>
            <input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold border-none" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-900 uppercase ml-2 tracking-widest">DNI</label>
            <input value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold border-none" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-900 uppercase ml-2 tracking-widest italic">Curso Asignado</label>
            <select value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold border-none" required>
              <option value="">Seleccionar curso...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name} "{c.section}" - {c.shift}</option>)}
            </select>
          </div>

          {/* VINCULACIÓN DUAL */}
          <div className="space-y-4 bg-slate-950/5 p-5 rounded-2rem border border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-blue-600 uppercase ml-2">Opción A: Buscar en lista</label>
              <select 
                value={formData.parentId} 
                onChange={e => {setFormData({...formData, parentId: e.target.value}); setParentEmail('')}} 
                className="w-full p-3 bg-white rounded-xl outline-none text-slate-900 font-bold border border-slate-200 text-xs"
                disabled={parentEmail !== ''}
              >
                <option value="">-- Ver padres de la escuela --</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
              </select>
            </div>

            <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-4 text-[8px] font-black text-slate-300 uppercase">O VINCULAR POR EMAIL</span>
                <div className="grow border-t border-slate-200"></div>
            </div>

            <div className="space-y-1">
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

        <div className="flex flex-col md:flex-row gap-3">
            <button disabled={loading} className="flex-2 bg-slate-950 text-white py-5 rounded-2rem font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'Procesando...' : (editingId ? '✓ Guardar Cambios' : '🚀 Confirmar Inscripción')}
            </button>
            {editingId && (
                <button type="button" onClick={() => {setEditingId(null); setFormData({fullName:'', dni:'', courseId:'', parentId:''})}} className="flex-1 bg-slate-100 text-slate-500 rounded-2rem font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            )}
        </div>
      </form>

      {/* TABLA DE ALUMNOS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-600px">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-900 uppercase tracking-widest">
              <tr>
                <th className="p-6">Estudiante</th>
                <th className="p-6">Curso / Turno</th>
                <th className="p-6">Tutor Vinculado</th>
                <th className="p-6 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-all">
                  <td className="p-6 font-bold text-slate-900 notranslate text-sm">
                    {s.full_name} <br/><span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">DNI {s.dni}</span>
                  </td>
                  <td className="p-6 text-xs font-black text-slate-600 uppercase">
                    {s.courses?.name} "{s.courses?.section}" <br/><span className="text-[9px] opacity-40 font-bold italic">{s.courses?.shift}</span>
                  </td>
                  <td className="p-6">
                     <p className="text-blue-700 font-black text-[11px] uppercase tracking-tighter">{(s.profiles as any)?.full_name || 'SIN TUTOR'}</p>
                     <p className="text-[10px] text-slate-400 italic">{(s.profiles as any)?.email}</p>
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(s)} className="w-10 h-10 bg-slate-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm">✏️</button>
                        <button onClick={() => handleDelete(s.id)} className="w-10 h-10 bg-slate-100 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm">🗑️</button>
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