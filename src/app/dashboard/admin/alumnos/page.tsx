'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function GestionAlumnos() {
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([]) 
  const [parents, setParents] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Estados del Formulario
  const [editingId, setEditingId] = useState<string | null>(null)
  const [parentEmail, setParentEmail] = useState('')
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

      const { data: p } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'padre')
        .eq('school_id', profileData.school_id)
        .order('full_name')
      setParents(p || [])

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
    setParentEmail('') 
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Deseas dar de baja a este alumno? Se borrará su historial.")) return
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (!error) {
      toast.success("Alumno eliminado")
      fetchInitialData()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // SOLUCIÓN AL ERROR DE TS: Verificamos que el perfil exista antes de seguir
    if (!profile?.school_id) {
      toast.error("No se pudo identificar la escuela. Reintentá.")
      return
    }

    setLoading(true)

    try {
      let finalParentId = formData.parentId

      if (parentEmail.trim() !== '') {
        const { data: foundParent } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', parentEmail.trim().toLowerCase())
          .eq('role', 'padre')
          .maybeSingle()

        if (!foundParent) throw new Error("No existe un padre con ese email en el sistema.")
        finalParentId = foundParent.id
      }

      if (!finalParentId) throw new Error("Seleccioná un tutor o ingresá su email")

      if (editingId) {
        await supabase.from('students').update({
          full_name: formData.fullName, dni: formData.dni,
          course_id: formData.courseId, parent_id: finalParentId
        }).eq('id', editingId)
        toast.success("Legajo actualizado")
      } else {
        const { data: newStudent } = await supabase.from('students').insert({
          full_name: formData.fullName, dni: formData.dni,
          course_id: formData.courseId, parent_id: finalParentId,
          school_id: profile.school_id // Ahora TS sabe que profile no es null
        }).select().single()

        if (newStudent) {
            fetch('/api/padres/notificar-vinculacion', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId: newStudent.id, studentName: formData.fullName, padreId: finalParentId })
            })
        }
        toast.success("Alumno registrado")
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

  if (loading) return (
    <div className="p-20 text-center animate-pulse flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando Nómina...</p>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Gestión de Alumnos</h1>
        <Link href="/dashboard/admin/alumnos/promocion" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
          🚀 Promoción Ciclo
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm space-y-10 text-left">
        <div className="flex items-center gap-2 text-xs font-black text-orange-400 uppercase tracking-widest">
           ✨ {editingId ? 'Editando Registro' : 'Nuevo Ingreso'}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="space-y-6">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre Completo</label>
              <input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold border-none" required />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">DNI / Legajo</label>
              <input value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold border-none" required />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] text-slate-400 uppercase ml-2 tracking-widest italic font-bold">Curso Asignado</label>
              <select value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold border-none appearance-none" required>
                <option value="">Seleccionar curso...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} "{c.section}" - {c.shift}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4 bg-slate-950/5 p-6 rounded-4xl border border-slate-100 flex flex-col justify-center">
            <div className="space-y-1 text-left">
              <label className="text-[10px] text-blue-600 uppercase ml-2 tracking-widest font-bold">Opción A: Buscar en lista</label>
              <select value={formData.parentId} onChange={e => {setFormData({...formData, parentId: e.target.value}); setParentEmail('')}} className="w-full p-3 bg-white rounded-xl outline-none text-slate-900 font-bold border border-slate-200 text-xs" disabled={parentEmail !== ''}>
                <option value="">-- Seleccionar tutor existente --</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
              </select>
            </div>
            <div className="relative flex py-1 items-center justify-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-4 text-[8px] font-black text-slate-300 uppercase">O BIEN</span>
                <div className="grow border-t border-slate-200"></div>
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] text-blue-600 uppercase ml-2 tracking-widest font-bold">Opción B: Escribir Email</label>
              <input type="email" value={parentEmail} onChange={e => {setParentEmail(e.target.value); setFormData({...formData, parentId: ''})}} placeholder="ejemplo@correo.com" className="w-full p-3 bg-white rounded-xl outline-none text-slate-900 font-bold border border-slate-200 text-xs" />
            </div>
          </div>
        </div>

        <button disabled={loading} className="w-full bg-slate-950 text-white py-6 rounded-4xl font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50">
          {loading ? 'Procesando...' : (editingId ? '✓ Guardar Cambios' : 'Registrar y Vincular')}
        </button>
      </form>

      <div className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-900 uppercase tracking-widest">
              <tr><th className="p-6">Alumno</th><th className="p-6">Curso</th><th className="p-6">Responsable</th><th className="p-6 text-center">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-all">
                  <td className="p-6 font-bold text-slate-900 notranslate">{s.full_name} <br/><span className="text-[10px] font-medium text-slate-400">DNI {s.dni}</span></td>
                  <td className="p-6 text-xs font-black text-slate-600 uppercase italic">{s.courses?.name} "{s.courses?.section}" <br/><span className="text-[9px] opacity-40 italic">{s.courses?.shift}</span></td>
                  <td className="p-6"><p className="text-blue-700 font-black text-[11px] uppercase tracking-tighter">{(s.profiles as any)?.full_name}</p><p className="text-[10px] text-slate-400 italic">{(s.profiles as any)?.email}</p></td>
                  <td className="p-6 text-center">
                    <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(s)} className="w-9 h-9 bg-slate-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center border border-slate-100 shadow-sm text-xs">✏️</button>
                        <button onClick={() => handleDelete(s.id)} className="w-9 h-9 bg-slate-50 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-slate-100 shadow-sm text-xs">🗑️</button>
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