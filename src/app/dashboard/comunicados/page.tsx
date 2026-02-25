'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ComunicadosPage() {
  const [comunicados, setComunicados] = useState<any[]>([])
  const [notasPadres, setNotasPadres] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profData } = await supabase
          .from('profiles')
          .select('id, role, subscription_active, school_id')
          .eq('id', user?.id)
          .maybeSingle()
        
        setProfile(profData)

        if (!profData) return

        // 1. CARGAR COMUNICADOS GENERALES (Para todos)
        const { data: comms } = await supabase
          .from('communications')
          .select(`*, profiles(full_name)`)
          .eq('school_id', profData.school_id)
          .order('created_at', { ascending: false })
        setComunicados(comms || [])

        // 2. LÓGICA ESPECÍFICA PARA PRECEPTOR: Cargar Notas de Padres
        if (profData.role?.toLowerCase() === 'preceptor') {
          // Buscamos los cursos que tiene asignados
          const { data: asignaciones } = await supabase
            .from('preceptor_courses')
            .select('course_id')
            .eq('preceptor_id', profData.id)
          
          const idsCursos = asignaciones?.map(a => a.course_id) || []

          if (idsCursos.length > 0) {
            // Buscamos notas de alumnos que pertenezcan a esos cursos
            const { data: notas } = await supabase
              .from('parent_requests')
              .select(`
                *,
                profiles:parent_id (full_name),
                students:student_id (full_name, course_id, courses(name, section))
              `)
              .in('students.course_id', idsCursos)
              .order('created_at', { ascending: false })
            
            setNotasPadres(notas || [])
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleUpdateStatus = async (notaId: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('parent_requests')
      .update({ status: nuevoEstado })
      .eq('id', notaId)
    
    if (!error) {
      toast.success("Estado actualizado")
      setNotasPadres(prev => prev.map(n => n.id === notaId ? {...n, status: nuevoEstado} : n))
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse">Cargando...</div>

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER DINÁMICO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Comunicación</h1>
          <p className="text-slate-500 font-medium">Bandeja de mensajes institucionales.</p>
        </div>
        
        {['directivo', 'docente', 'preceptor', 'admin_koda'].includes(profile?.role?.toLowerCase()) && (
          <Link href="/dashboard/comunicados/nuevo" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            + Emitir Comunicado
          </Link>
        )}

        {profile?.role?.toLowerCase() === 'padre' && (
          <Link href="/dashboard/comunicados/solicitud" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-black transition-all">
            ✉️ Enviar Nota a Preceptoría
          </Link>
        )}
      </header>

      {/* SECCIÓN PRECEPTOR: NOTAS ENTRANTES */}
      {profile?.role?.toLowerCase() === 'preceptor' && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl shadow-inner">📥</div>
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Notas de Padres</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {notasPadres.length > 0 ? (
              notasPadres.map((nota) => (
                <div key={nota.id} className="bg-white p-6 rounded-2rem border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6 transition-all hover:border-amber-300">
                  <div className="flex-1 text-left space-y-2">
                    <div className="flex items-center gap-2">
                       <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                         {nota.type}
                       </span>
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                         {new Date(nota.created_at).toLocaleString('es-AR')}
                       </span>
                    </div>
                    <p className="text-slate-900 font-medium leading-relaxed">"{nota.note}"</p>
                    <p className="text-xs text-slate-500 font-bold">
                       Padre/Tutor: <span className="text-slate-900">{nota.profiles?.full_name}</span> • 
                       Alumno: <span className="text-blue-600">{nota.students?.full_name} ({nota.students?.courses?.name})</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                     <select 
                        value={nota.status}
                        onChange={(e) => handleUpdateStatus(nota.id, e.target.value)}
                        className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border-none outline-none transition-all ${
                          nota.status === 'pendiente' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                        }`}
                     >
                       <option value="pendiente">Pendiente</option>
                       <option value="leido">Leído</option>
                       <option value="respondido">Respondido</option>
                     </select>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center text-slate-400 font-medium italic">
                No has recibido notas de padres aún.
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECCIÓN GENERAL: COMUNICADOS EMITIDOS */}
      <section className="space-y-6 pt-10 border-t border-slate-100">
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-200 text-white">📣</div>
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight text-left">Canal Oficial</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {comunicados.map((c) => (
            <Link 
              key={c.id} 
              href={`/dashboard/comunicados/${c.id}`}
              className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all group flex justify-between items-center"
            >
              <div className="space-y-1 text-left">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{c.title}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                  {new Date(c.created_at).toLocaleDateString()} • Emitido por {c.profiles?.full_name}
                </p>
              </div>
              <span className="text-slate-300 group-hover:text-blue-600 transition-all">➜</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}