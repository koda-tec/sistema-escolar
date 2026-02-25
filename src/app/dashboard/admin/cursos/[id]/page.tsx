'use client'
import { useEffect, useState, use } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function DetalleCursoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')
  const [curso, setCurso] = useState<any>(null)
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [cuerpoDocente, setCuerpoDocente] = useState<any[]>([])
  const [preceptoresAsignados, setPreceptoresAsignados] = useState<any[]>([])
  
  // Listas para el Directivo (Buscador)
  const [todosLosDocentes, setTodosLosDocentes] = useState<any[]>([])
  const [todosLosPreceptores, setTodosLosPreceptores] = useState<any[]>([])
  const [todasLasMaterias, setTodasLasMaterias] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [courseId])

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('role, school_id').eq('id', user?.id).single()
      setUserRole(profile?.role || '')

      // 1. Info del Curso
      const { data: c } = await supabase.from('courses').select('*').eq('id', courseId).single()
      setCurso(c)

      // 2. Alumnos
      const { data: alu } = await supabase.from('students').select('*, profiles:parent_id(full_name, email)').eq('course_id', courseId).order('full_name')
      setAlumnos(alu || [])

      // 3. Docentes y Materias en este curso
      const { data: doc } = await supabase.from('profesor_materia').select('id, materias(name), profiles:profesor_id(full_name, email)').eq('curso_id', courseId)
      setCuerpoDocente(doc || [])

      // 4. Preceptores en este curso
      const { data: prec } = await supabase.from('preceptor_courses').select('id, profiles:preceptor_id(full_name, email)').eq('course_id', courseId)
      setPreceptoresAsignados(prec || [])

      // 5. Si es Directivo, cargar listas para asignar
       if (profile?.role === 'directivo') {
        const { data: p } = await supabase
            .from('profiles')
            .select('id, full_name, role') // Recordá agregar 'role' aquí también
            .eq('school_id', profile.school_id)
        
        setTodosLosDocentes(p?.filter(u => u.role === 'docente') || [])
        setTodosLosPreceptores(p?.filter(u => u.role === 'preceptor') || [])
        
        const { data: mat } = await supabase
            .from('materias')
            .select('id, name')
            .eq('school_id', profile.school_id)
        
        setTodasLasMaterias(mat || [])
        } // <--- ESTA LLAVE CIERRA EL IF

        } catch (e) { 
        console.error(e) 
        } finally { 
        setLoading(false) 
        } // <--- ESTA LLAVE CIERRA EL TRY/CATCH

  const asignarDocente = async (profId: string, matId: string) => {
    const { error } = await supabase.from('profesor_materia').insert({
      profesor_id: profId,
      materia_id: matId,
      curso_id: courseId
    })
    if (error) toast.error("Error al asignar")
    else { toast.success("Docente asignado"); fetchData() }
  }

  const asignarPreceptor = async (precId: string) => {
    const { error } = await supabase.from('preceptor_courses').insert({
      preceptor_id: precId,
      course_id: courseId,
      school_id: curso.school_id
    })
    if (error) toast.error("Error al asignar")
    else { toast.success("Preceptor asignado"); fetchData() }
  }

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-400">CARGANDO AULA...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase italic leading-none">{curso?.name} "{curso?.section}"</h1>
          <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mt-2">Turno {curso?.shift}</p>
        </div>
        <div className="bg-slate-100 px-6 py-2 rounded-2xl text-[10px] font-black uppercase text-slate-500 border border-slate-200">
           SaaS Node: {curso?.id.slice(0,8)}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: ESTUDIANTES */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest ml-4">Nómina de Alumnos ({alumnos.length})</h2>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase">
                <tr>
                  <th className="p-6">Nombre y DNI</th>
                  <th className="p-6">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alumnos.map(a => (
                  <tr key={a.id} className="text-sm hover:bg-slate-50 transition-all">
                    <td className="p-6 font-bold text-slate-800 notranslate">{a.full_name} <br/><span className="text-[10px] font-medium text-slate-400">DNI {a.dni}</span></td>
                    <td className="p-6 text-slate-500 font-medium">{(a.profiles as any)?.full_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA: PERSONAL Y GESTIÓN */}
        <div className="space-y-6">
          
          {/* SECCIÓN PRECEPTORES */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest border-b pb-4">Preceptoría</h3>
            <div className="space-y-3">
              {preceptoresAsignados.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">👤</div>
                  <p className="text-sm font-bold text-slate-800">{(p.profiles as any)?.full_name}</p>
                </div>
              ))}
            </div>
            {userRole === 'directivo' && (
              <select onChange={(e) => asignarPreceptor(e.target.value)} className="w-full mt-4 p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-slate-100">
                <option value="">+ Asignar Preceptor</option>
                {todosLosPreceptores.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            )}
          </div>

          {/* SECCIÓN DOCENTES */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
            <h3 className="font-black text-blue-400 uppercase text-xs tracking-widest border-b border-white/10 pb-4">Cuerpo Docente</h3>
            <div className="space-y-4">
              {cuerpoDocente.map(d => (
                <div key={d.id} className="text-left">
                  <p className="text-[9px] font-black text-slate-500 uppercase">{(d.materias as any)?.name}</p>
                  <p className="text-sm font-bold text-white">{(d.profiles as any)?.full_name}</p>
                </div>
              ))}
            </div>
            {userRole === 'directivo' && (
               <div className="pt-4 space-y-2">
                 <p className="text-[10px] font-bold text-blue-300 uppercase ml-1">Nueva Asignación:</p>
                 <FormAsignarDocente docentes={todosLosDocentes} materias={todasLasMaterias} onAsignar={asignarDocente} />
               </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// Mini componente para el formulario de asignación de docentes
// Componente fuera de la función principal
function FormAsignarDocente({ docentes, materias, onAsignar }: any) {
  const [d, setD] = useState('')
  const [m, setM] = useState('')
  
  return (
    <div className="space-y-2">
      <select 
        value={m} 
        onChange={e => setM(e.target.value)} 
        className="w-full p-3 bg-white/10 rounded-xl text-xs font-bold border-none text-white outline-none"
      >
        <option value="" className="text-slate-900">Materia...</option>
        {materias.map((mat: any) => (
          <option key={mat.id} value={mat.id} className="text-slate-900">{mat.name}</option>
        ))}
      </select>
      
      <select 
        value={d} 
        onChange={e => setD(e.target.value)} 
        className="w-full p-3 bg-white/10 rounded-xl text-xs font-bold border-none text-white outline-none"
      >
        <option value="" className="text-slate-900">Profesor...</option>
        {docentes.map((doc: any) => (
          <option key={doc.id} value={doc.id} className="text-slate-900">{doc.full_name}</option>
        ))}
      </select>
      
      <button 
        onClick={() => { if(d && m) onAsignar(d, m) }}
        className="w-full bg-blue-600 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-blue-500 transition-all"
      >
        Vincular a Cátedra
      </button>
    </div>
  )
}
}