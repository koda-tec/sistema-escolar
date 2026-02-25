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

        // 1. CARGAR COMUNICADOS GENERALES (Filtrados por RLS)
        const { data: comms, error: errComms } = await supabase
          .from('communications')
          .select(`*, profiles(full_name)`)
          .eq('school_id', profData.school_id)
          .order('created_at', { ascending: false })
        
        setComunicados(comms || [])

        // 2. LÓGICA PARA PRECEPTOR: Notas de Padres
        if (profData.role?.toLowerCase() === 'preceptor') {
          const { data: asignaciones } = await supabase
            .from('preceptor_courses')
            .select('course_id')
            .eq('preceptor_id', profData.id)
          
          const idsCursos = asignaciones?.map(a => a.course_id) || []

          if (idsCursos.length > 0) {
            const { data: notas } = await supabase
              .from('parent_requests')
              .select(`
                *,
                profiles:parent_id (full_name),
                students:student_id (
                  id,
                  full_name, 
                  course_id, 
                  courses(name, section)
                )
              `)
              .in('students.course_id', idsCursos)
              .order('created_at', { ascending: false })
            
            setNotasPadres(notas || [])
          }
        }
      } catch (error) {
        console.error("Crash fetchData:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase])

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

  // --- NUEVA FUNCIÓN: JUSTIFICADOR AUTOMÁTICO ---
  const handleJustificarFalta = async (nota: any) => {
    const fechaNota = new Date(nota.created_at).toISOString().split('T')[0]
    
    // 1. Buscamos y actualizamos la falta en la tabla 'attendance'
    const { data, error } = await supabase
      .from('attendance')
      .update({ status: 'justificado' })
      .eq('student_id', nota.student_id)
      .eq('date', fechaNota)
      .select()

    if (error || data.length === 0) {
      toast.error("No se encontró un 'Ausente' oficial para esta fecha")
    } else {
      // 2. Si se justificó bien, marcamos la nota como respondida
      await supabase.from('parent_requests').update({ status: 'respondido' }).eq('id', nota.id)
      toast.success("Falta justificada en el registro oficial")
      
      // Actualizamos UI local
      setNotasPadres(prev => prev.map(n => n.id === nota.id ? {...n, status: 'respondido'} : n))
    }
  }

  if (loading) return (
    <div className="p-20 text-center animate-pulse flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando Mensajes</p>
    </div>
  )

  const userRole = profile?.role?.toLowerCase().trim()

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-left">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Comunicación</h1>
          <p className="text-slate-500 font-medium mt-2">Bandeja de mensajes y avisos oficiales.</p>
        </div>
        
        {['directivo', 'docente', 'preceptor', 'admin_koda'].includes(userRole) && (
          <Link href="/dashboard/comunicados/nuevo" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
            + Emitir Comunicado
          </Link>
        )}

        {userRole === 'padre' && (
          <Link href="/dashboard/comunicados/solicitud" className="bg-slate-950 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">
            ✉️ Enviar Nota a Preceptoría
          </Link>
        )}
      </header>

      {/* SECCIÓN PRECEPTOR: NOTAS DE PADRES */}
      {userRole === 'preceptor' && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 ml-2 text-left">
             <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl shadow-inner">📥</div>
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Notas de Padres</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {notasPadres.length > 0 ? (
              notasPadres.map((nota) => (
                <div key={nota.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6 transition-all hover:border-amber-300 relative overflow-hidden">
                  
                  <div className="flex-1 text-left space-y-3">
                    <div className="flex items-center gap-2">
                       <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                         {nota.type}
                       </span>
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                         {new Date(nota.created_at).toLocaleString('es-AR')}
                       </span>
                    </div>
                    <p className="text-slate-900 font-bold leading-relaxed text-lg">"{nota.note}"</p>
                    <div className="pt-2 border-t border-slate-50">
                      <p className="text-xs text-slate-500 font-medium">
                        Tutor: <span className="text-slate-900 font-bold">{nota.profiles?.full_name}</span>
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Alumno: <span className="text-blue-600 font-black uppercase italic">{nota.students?.full_name} ({nota.students?.courses?.name})</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 justify-center min-w-150px">
                     {/* BOTÓN JUSTIFICAR AUTOMÁTICO */}
                     {nota.type === 'inasistencia' && nota.status !== 'respondido' && (
                        <button 
                          onClick={() => handleJustificarFalta(nota)}
                          className="w-full bg-green-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100 mb-1"
                        >
                          ✅ Justificar Falta
                        </button>
                     )}
                     
                     <select 
                        value={nota.status}
                        onChange={(e) => handleUpdateStatus(nota.id, e.target.value)}
                        className={`w-full text-[10px] font-black uppercase px-4 py-2.5 rounded-xl border-none outline-none transition-all cursor-pointer ${
                          nota.status === 'pendiente' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                        }`}
                     >
                       <option value="pendiente">Marcar Pendiente</option>
                       <option value="leido">Marcar Leído</option>
                       <option value="respondido">Marcar Respondido</option>
                     </select>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold italic">
                No has recibido notas de familias vinculadas.
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECCIÓN GENERAL: CANAL OFICIAL */}
      <section className="space-y-6 pt-10 border-t border-slate-100 text-left">
        <div className="flex items-center gap-3 ml-2 text-left">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-200 text-white">📣</div>
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Canal Oficial</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {comunicados.map((c) => (
            <Link 
              key={c.id} 
              href={`/dashboard/comunicados/${c.id}`}
              className="bg-white p-7 rounded-[2.5rem] border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all group flex justify-between items-center text-left"
            >
              <div className="space-y-2 text-left">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-none italic">{c.title}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">
                  {new Date(c.created_at).toLocaleDateString('es-AR')} • Emitido por {c.profiles?.full_name}
                </p>
              </div>
              <span className="text-slate-300 group-hover:text-blue-600 transition-all text-2xl group-hover:translate-x-1 duration-300">➜</span>
            </Link>
          ))}
          {comunicados.length === 0 && (
            <p className="p-10 text-center text-slate-400 italic font-bold uppercase text-xs tracking-widest">Sin anuncios publicados.</p>
          )}
        </div>
      </section>
    </div>
  )
}