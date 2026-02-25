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

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [courseId])

  async function fetchData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Perfil del usuario logueado
      const { data: profile } = await supabase.from('profiles').select('role, school_id').eq('id', user.id).maybeSingle()
      setUserRole(profile?.role?.toLowerCase() || '')

      // 2. Información del Curso (Usamos maybeSingle para que no explote)
      const { data: cData, error: cError } = await supabase.from('courses').select('*').eq('id', courseId).maybeSingle()
      if (cError) throw cError
      if (!cData) {
          toast.error("Curso no encontrado")
          return
      }
      setCurso(cData)

      // 3. Alumnos vinculados
      const { data: alu } = await supabase
        .from('students')
        .select('*, profiles:parent_id(full_name, email)')
        .eq('course_id', courseId)
        .order('full_name')
      setAlumnos(alu || [])

      // 4. Cuerpo Docente (Materias y Profesores)
      const { data: doc } = await supabase
        .from('profesor_materia')
        .select(`
          id,
          materias(name),
          profiles:profesor_id(full_name, email)
        `)
        .eq('curso_id', courseId)
      setCuerpoDocente(doc || [])

      // 5. Preceptores asignados
      const { data: prec } = await supabase
        .from('preceptor_courses')
        .select('id, profiles:preceptor_id(full_name, email)')
        .eq('course_id', courseId)
      setPreceptoresAsignados(prec || [])

      // 6. Cargar opciones para el Directivo
      if (profile?.role === 'directivo' || profile?.role === 'admin_koda') {
        const { data: p } = await supabase.from('profiles').select('id, full_name, role').eq('school_id', profile.school_id)
        setTodosLosDocentes(p?.filter(u => u.role === 'docente') || [])
        setTodosLosPreceptores(p?.filter(u => u.role === 'preceptor') || [])
        
        const { data: mat } = await supabase.from('materias').select('id, name').eq('school_id', profile.school_id)
        setTodasLasMaterias(mat || [])
      }

    } catch (e: any) {
      console.error("Error cargando el curso:", e.message)
      toast.error("Hubo un problema al cargar los datos.")
    } finally {
      setLoading(false)
    }
  }

  const asignarDocente = async (profId: string, matId: string) => {
    const { error } = await supabase.from('profesor_materia').insert({
      profesor_id: profId,
      materia_id: matId,
      curso_id: courseId
    })
    if (error) toast.error("Error: " + error.message)
    else { toast.success("Asignación exitosa"); fetchData() }
  }

  const asignarPreceptor = async (precId: string) => {
    const { error } = await supabase.from('preceptor_courses').insert({
      preceptor_id: precId,
      course_id: courseId,
      school_id: curso.school_id
    })
    if (error) toast.error("Error: " + error.message)
    else { toast.success("Preceptor vinculado"); fetchData() }
  }

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Sincronizando nómina...</p>
    </div>
  )

  if (!curso) return <div className="p-20 text-center text-slate-500">No se pudo cargar la información del curso.</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase italic leading-none">{curso.name} "{curso.section}"</h1>
          <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mt-2 italic">Turno {curso.shift}</p>
        </div>
        <div className="bg-slate-100 px-6 py-2 rounded-2xl text-[10px] font-black uppercase text-slate-500 border border-slate-200">
           ID Gestión: {curso.id.slice(0,8)}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LISTADO DE ALUMNOS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest ml-4">Estudiantes Inscriptos ({alumnos.length})</h2>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase">
                  <tr>
                    <th className="p-6">Alumno</th>
                    <th className="p-6">Tutor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alumnos.map(a => (
                    <tr key={a.id} className="text-sm hover:bg-slate-50 transition-all">
                      <td className="p-6 font-bold text-slate-900 notranslate">{a.full_name} <br/><span className="text-[10px] font-medium text-slate-400 uppercase">DNI {a.dni}</span></td>
                      <td className="p-6 text-slate-500 font-medium">
                        <p className="text-slate-900">{(a.profiles as any)?.full_name || 'Sin vincular'}</p>
                        <p className="text-[10px] italic">{(a.profiles as any)?.email}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {alumnos.length === 0 && <p className="p-10 text-center text-slate-400 italic">No hay alumnos cargados.</p>}
          </div>
        </div>

        {/* GESTIÓN DE PERSONAL */}
        <div className="space-y-6">
          {/* PRECEPTORES */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 text-left">
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest border-b pb-4">Preceptoría</h3>
            <div className="space-y-3">
              {preceptoresAsignados.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xs">👤</div>
                  <p className="text-sm font-bold text-slate-800">{(p.profiles as any)?.full_name}</p>
                </div>
              ))}
            </div>
            {(userRole === 'directivo' || userRole === 'admin_koda') && (
              <select 
                onChange={(e) => { if(e.target.value) asignarPreceptor(e.target.value) }} 
                className="w-full mt-4 p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-slate-100 text-slate-900"
              >
                <option value="">+ Vincular Preceptor</option>
                {todosLosPreceptores.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            )}
          </div>

          {/* DOCENTES */}
          <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl text-left">
            <h3 className="font-black text-blue-400 uppercase text-xs tracking-widest border-b border-white/5 pb-4">Cuerpo Docente</h3>
            <div className="space-y-4">
              {cuerpoDocente.map(d => (
                <div key={d.id}>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{(d.materias as any)?.name}</p>
                  <p className="text-sm font-bold text-slate-100">{(d.profiles as any)?.full_name}</p>
                </div>
              ))}
            </div>
            {(userRole === 'directivo' || userRole === 'admin_koda') && (
               <div className="pt-4 mt-6 border-t border-white/5 space-y-3">
                 <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest ml-1">Nueva Cátedra:</p>
                 <select id="selMat" className="w-full p-3 bg-white/5 rounded-xl text-xs font-bold text-white outline-none border border-white/10">
                   <option value="" className="text-slate-900">Materia...</option>
                   {todasLasMaterias.map(m => <option key={m.id} value={m.id} className="text-slate-900">{m.name}</option>)}
                 </select>
                 <select id="selDoc" className="w-full p-3 bg-white/5 rounded-xl text-xs font-bold text-white outline-none border border-white/10">
                   <option value="" className="text-slate-900">Profesor...</option>
                   {todosLosDocentes.map(d => <option key={d.id} value={d.id} className="text-slate-900">{d.full_name}</option>)}
                 </select>
                 <button 
                   onClick={() => {
                     const m = (document.getElementById('selMat') as HTMLSelectElement).value;
                     const d = (document.getElementById('selDoc') as HTMLSelectElement).value;
                     if(m && d) asignarDocente(d, m);
                   }}
                   className="w-full bg-blue-600 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-900/40 active:scale-95 transition-all"
                 >
                   Guardar Asignación
                 </button>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}