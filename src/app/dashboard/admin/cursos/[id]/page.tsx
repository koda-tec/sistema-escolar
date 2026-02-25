'use client'
import { useEffect, useState, use } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function DetalleCursoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const courseId = resolvedParams.id

  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')
  const [curso, setCurso] = useState<any>(null)
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [cuerpoDocente, setCuerpoDocente] = useState<any[]>([])
  const [preceptoresAsignados, setPreceptoresAsignados] = useState<any[]>([])
  
  const [todosLosDocentes, setTodosLosDocentes] = useState<any[]>([])
  const [todosLosPreceptores, setTodosLosPreceptores] = useState<any[]>([])
  const [todasLasMaterias, setTodasLasMaterias] = useState<any[]>([])
  const [nuevaMateriaNombre, setNuevaMateriaNombre] = useState('')

  const supabase = createClient()

  useEffect(() => { fetchData() }, [courseId])

  async function fetchData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('role, school_id').eq('id', user?.id).single()
      setUserRole(profile?.role?.toLowerCase() || '')

      const { data: cData } = await supabase.from('courses').select('*').eq('id', courseId).maybeSingle()
      setCurso(cData)

      // Traer Alumnos, Docentes y Preceptores (Igual que antes)
      const { data: alu } = await supabase.from('students').select('*, profiles:parent_id(full_name, email)').eq('course_id', courseId).order('full_name')
      setAlumnos(alu || [])

      const { data: doc } = await supabase.from('profesor_materia').select(`id, materias(id, name), profiles:profesor_id(id, full_name)`).eq('curso_id', courseId)
      setCuerpoDocente(doc || [])

      const { data: prec } = await supabase.from('preceptor_courses').select(`id, profiles:preceptor_id(id, full_name)`).eq('course_id', courseId)
      setPreceptoresAsignados(prec || [])

      if (profile?.role === 'directivo' || profile?.role === 'admin_koda') {
        const { data: p } = await supabase.from('profiles').select('id, full_name, role').eq('school_id', profile.school_id)
        setTodosLosDocentes(p?.filter(u => u.role === 'docente') || [])
        setTodosLosPreceptores(p?.filter(u => u.role === 'preceptor') || [])
        const { data: mat } = await supabase.from('materias').select('id, name').eq('school_id', profile.school_id)
        setTodasLasMaterias(mat || [])
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  // --- ACCIONES DE GESTIÓN ---

  const notifyChange = async (userId: string, action: 'asignado' | 'removido', materiaName?: string) => {
    await fetch('/api/cursos/notificar-personal', {
      method: 'POST',
      body: JSON.stringify({ userId, courseName: `${curso.name} ${curso.section}`, action, materiaName })
    })
  }

  const crearYAsignarMateria = async (docenteId: string) => {
    if (!nuevaMateriaNombre) return toast.error("Escribe el nombre de la materia")
    // 1. Crear Materia
    const { data: nuevaMat, error: err1 } = await supabase.from('materias').insert({ name: nuevaMateriaNombre, school_id: curso.school_id }).select().single()
    if (err1) return toast.error(err1.message)
    // 2. Asignar
    await asignarDocente(docenteId, nuevaMat.id)
    setNuevaMateriaNombre('')
  }

  const asignarDocente = async (profId: string, matId: string) => {
    const { error } = await supabase.from('profesor_materia').insert({ profesor_id: profId, materia_id: matId, curso_id: courseId })
    if (error) toast.error("Error al asignar")
    else { 
      toast.success("Docente vinculado"); 
      const mat = todasLasMaterias.find(m => m.id === matId)
      notifyChange(profId, 'asignado', mat?.name || nuevaMateriaNombre);
      fetchData() 
    }
  }

  const desvincularDocente = async (id: string, profId: string) => {
    if (!confirm("¿Quitar a este docente del curso?")) return
    const { error } = await supabase.from('profesor_materia').delete().eq('id', id)
    if (!error) { toast.success("Docente quitado"); notifyChange(profId, 'removido'); fetchData() }
  }

  const asignarPreceptor = async (precId: string) => {
    const { error } = await supabase.from('preceptor_courses').insert({ preceptor_id: precId, course_id: courseId, school_id: curso.school_id })
    if (error) toast.error("Error")
    else { toast.success("Preceptor vinculado"); notifyChange(precId, 'asignado'); fetchData() }
  }

  const desvincularPreceptor = async (id: string, precId: string) => {
    if (!confirm("¿Quitar preceptor?")) return
    const { error } = await supabase.from('preceptor_courses').delete().eq('id', id)
    if (!error) { toast.success("Preceptor quitado"); notifyChange(precId, 'removido'); fetchData() }
  }

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase">Sincronizando Aula...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      {/* HEADER (Igual que antes) */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">{curso?.name} "{curso?.section}"</h1>
          <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mt-2 italic">Turno {curso?.shift}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LISTADO DE ALUMNOS */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden text-left">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase">
                <tr><th className="p-6">Alumno</th><th className="p-6">Tutor</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alumnos.map(a => (
                  <tr key={a.id} className="text-sm">
                    <td className="p-6 font-bold text-slate-800">{a.full_name}</td>
                    <td className="p-6 text-slate-500">{(a.profiles as any)?.full_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* GESTIÓN DE PERSONAL */}
        <div className="space-y-6">
          
          {/* CARD PRECEPTORES */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest border-b pb-4">Preceptoría</h3>
            <div className="space-y-3">
              {preceptoresAsignados.map(p => (
                <div key={p.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-xs">👤</span>
                    <p className="text-sm font-bold text-slate-800">{(p.profiles as any)?.full_name}</p>
                  </div>
                  {userRole === 'directivo' && (
                    <button onClick={() => desvincularPreceptor(p.id, p.profiles.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all">🗑️</button>
                  )}
                </div>
              ))}
            </div>
            {userRole === 'directivo' && (
              <select onChange={(e) => { if(e.target.value) asignarPreceptor(e.target.value) }} className="w-full mt-4 p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none border border-slate-100">
                <option value="">+ Vincular Preceptor</option>
                {todosLosPreceptores.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            )}
          </div>

          {/* CARD DOCENTES */}
          <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-xl space-y-6">
            <h3 className="font-black text-blue-400 uppercase text-xs tracking-widest border-b border-white/5 pb-4">Cuerpo Docente</h3>
            <div className="space-y-4">
              {cuerpoDocente.map(d => (
                <div key={d.id} className="flex justify-between items-start group/item">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase">{(d.materias as any)?.name}</p>
                    <p className="text-sm font-bold text-slate-100">{(d.profiles as any)?.full_name}</p>
                  </div>
                  {userRole === 'directivo' && (
                    <button onClick={() => desvincularDocente(d.id, d.profiles.id)} className="opacity-0 group-hover/item:opacity-100 text-red-400 hover:text-red-600 transition-all">✕</button>
                  )}
                </div>
              ))}
            </div>
            
            {userRole === 'directivo' && (
              <div className="pt-6 border-t border-white/5 space-y-4">
                 <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Nueva Asignación:</p>
                 
                 <div className="space-y-2">
                    <input 
                      value={nuevaMateriaNombre} 
                      onChange={e => setNuevaMateriaNombre(e.target.value)} 
                      placeholder="Materia (Escribir si es nueva)" 
                      className="w-full p-3 bg-white/5 rounded-xl text-xs text-white border border-white/10 outline-none focus:border-blue-500"
                    />
                    <p className="text-[9px] text-slate-500 text-center uppercase">-- o elegir existente --</p>
                    <select id="selMat" className="w-full p-3 bg-white/5 rounded-xl text-xs font-bold text-white border-none outline-none">
                       <option value="" className="text-slate-900">Elegir materia...</option>
                       {todasLasMaterias.map(m => <option key={m.id} value={m.id} className="text-slate-900">{m.name}</option>)}
                    </select>
                 </div>

                 <select id="selDoc" className="w-full p-3 bg-white/5 rounded-xl text-xs font-bold text-white border-none outline-none">
                   <option value="" className="text-slate-900">Seleccionar Profesor...</option>
                   {todosLosDocentes.map(d => <option key={d.id} value={d.id} className="text-slate-900">{d.full_name}</option>)}
                 </select>
                 
                 <button 
                   onClick={() => {
                     const mId = (document.getElementById('selMat') as HTMLSelectElement).value;
                     const dId = (document.getElementById('selDoc') as HTMLSelectElement).value;
                     if(nuevaMateriaNombre && dId) crearYAsignarMateria(dId);
                     else if(mId && dId) asignarDocente(dId, mId);
                   }}
                   className="w-full bg-blue-600 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-900/40 active:scale-95"
                 >
                   Confirmar Asignación
                 </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}