'use client'
import { useEffect, useState, use } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'

export default function DetalleCursoDocente({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [curso, setCurso] = useState<any>(null)
  const [materiasCuerpo, setMateriasCuerpo] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Obtener info básica del curso
        const { data: cursoData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()
        setCurso(cursoData)

        // 2. Obtener lista de alumnos vinculados a este curso
        const { data: alumnosData } = await supabase
          .from('students')
          .select('id, full_name, dni, profiles:parent_id(full_name, email)')
          .eq('course_id', courseId)
          .order('full_name')
        setAlumnos(alumnosData || [])

        // 3. Obtener las materias y profesores asignados a este curso
        const { data: cuerpoDocente } = await supabase
          .from('profesor_materia')
          .select(`
            id,
            materias (name),
            profiles:profesor_id (full_name, email)
          `)
          .eq('curso_id', courseId)
        
        setMateriasCuerpo(cuerpoDocente || [])

      } catch (error) {
        console.error("Error cargando detalle del curso:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [courseId, supabase])

  if (loading) return (
    <div className="p-20 text-center animate-pulse">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Cargando nómina...</p>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">
            <Link href="/dashboard/docente/materias" className="hover:underline">← Volver a mis materias</Link>
          </nav>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            {curso?.name} "{curso?.section}"
          </h1>
          <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-widest">
            Turno {curso?.shift || 'No asignado'} • Gestión de Aula
          </p>
        </div>
        <div className="bg-slate-900 text-white px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl">
          {alumnos.length} Alumnos
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: LISTA DE ALUMNOS (2/3 de la pantalla) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 ml-4">
             <span className="text-xl">👥</span>
             <h2 className="font-black text-slate-900 uppercase text-sm tracking-widest">Nómina de Estudiantes</h2>
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="p-6">Estudiante</th>
                    <th className="p-6">Tutor Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alumnos.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-6">
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors notranslate">{a.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">DNI: {a.dni}</p>
                      </td>
                      <td className="p-6">
                        <p className="text-slate-700 font-bold text-sm">{(a.profiles as any)?.full_name || 'Sin vincular'}</p>
                        <p className="text-[10px] text-blue-500 font-medium italic">{(a.profiles as any)?.email}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {alumnos.length === 0 && (
              <div className="p-20 text-center text-slate-400 italic font-medium">
                No hay alumnos inscriptos en este curso.
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: MATERIAS Y DOCENTES (1/3 de la pantalla) */}
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-3 ml-4">
             <span className="text-xl">👨‍🏫</span>
             <h2 className="font-black text-slate-900 uppercase text-sm tracking-widest">Cuerpo Docente</h2>
          </div>
          
          <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full"></div>
            
            {materiasCuerpo.length > 0 ? (
              <div className="space-y-6 relative z-10">
                {materiasCuerpo.map((m) => (
                  <div key={m.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0 group/item">
                    <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1 group-hover/item:text-blue-300 transition-colors">
                      {m.materias?.name}
                    </p>
                    <p className="font-bold text-slate-100 text-sm">{(m.profiles as any)?.full_name}</p>
                    <p className="text-[10px] text-slate-500 italic mt-0.5">{(m.profiles as any)?.email}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 relative z-10">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Sin materias asignadas</p>
              </div>
            )}

            <div className="pt-4 mt-6 border-t border-white/5 relative z-10">
               <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em]">KodaEd Academic System</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}