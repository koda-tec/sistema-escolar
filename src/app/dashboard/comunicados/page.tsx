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
  const [respuestas, setRespuestas] = useState<Record<string, string>>({}) // Estado para los inputs de respuesta
  
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

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

      // 1. Cargar Comunicados Generales
      const { data: comms } = await supabase
        .from('communications')
        .select(`*, profiles(full_name)`)
        .eq('school_id', profData.school_id)
        .order('created_at', { ascending: false })
      setComunicados(comms || [])

      // 2. Si es Preceptor, cargar Notas de Padres de sus cursos
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
              students:student_id (id, full_name, course_id, courses(name, section))
            `)
            .in('students.course_id', idsCursos)
            .order('created_at', { ascending: false })
          setNotasPadres(notas || [])
        }
      }
    } catch (error) {
      console.error("Error en fetchData:", error)
    } finally {
      setLoading(false)
    }
  }

  // FUNCIÓN: ACTUALIZAR ESTADO (La que faltaba)
  const handleUpdateStatus = async (notaId: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('parent_requests')
      .update({ status: nuevoEstado })
      .eq('id', notaId)
    
    if (!error) {
      toast.success(`Estado: ${nuevoEstado}`)
      setNotasPadres(prev => prev.map(n => n.id === notaId ? {...n, status: nuevoEstado} : n))
    }
  }

  // FUNCIÓN: JUSTIFICAR FALTA AUTOMÁTICAMENTE
  const handleJustificarFalta = async (nota: any) => {
    const fechaNota = new Date(nota.created_at).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('attendance')
      .update({ status: 'justificado' })
      .eq('student_id', nota.student_id)
      .eq('date', fechaNota)
      .select()

    if (error || data.length === 0) {
      toast.error("No se encontró inasistencia oficial para esta fecha")
    } else {
      await supabase.from('parent_requests').update({ status: 'respondido' }).eq('id', nota.id)
      toast.success("Falta justificada correctamente")
      fetchData()
    }
  }

  // FUNCIÓN: ENVIAR RESPUESTA POR ESCRITO
  const handleSendResponse = async (notaId: string) => {
  const respuesta = respuestas[notaId];
  if (!respuesta) return toast.error("Escribí un mensaje");

  setLoading(true);
  
  // 1. PRIMERO ACTUALIZAMOS LA DB
  const { error } = await supabase
    .from('parent_requests')
    .update({ 
      response_text: respuesta,
      status: 'respondido',
      responded_at: new Date().toISOString()
    })
    .eq('id', notaId);

  if (!error) {
    // 2. RECIÉN AHORA LLAMAMOS A LA API DE NOTIFICACIÓN
    await fetch('/api/solicitudes/notificar-padre', {
      method: 'POST',
      body: JSON.stringify({ requestId: notaId })
    });

    toast.success("Respuesta enviada");
    window.location.reload(); 
  } else {
    toast.error("Error al guardar la respuesta");
  }
  setLoading(false);
};

  if (loading) return (
    <div className="p-20 text-center animate-pulse flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Sincronizando Mensajes</p>
    </div>
  )

  const userRole = profile?.role?.toLowerCase().trim()

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-left font-sans text-slate-900">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-black tracking-tight uppercase italic leading-none">Comunicación</h1>
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
          <div className="flex items-center justify-between ml-2">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-amber-200 text-white">📥</div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Notas de Padres</h2>
             </div>
             <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
               {notasPadres.length} Pendientes
             </span>
          </div>

          <div className="grid grid-cols-1 gap-6 text-left">
            {notasPadres.length > 0 ? (
              notasPadres.map((nota) => (
                <div key={nota.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-md relative overflow-hidden group">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${nota.status === 'pendiente' ? 'bg-red-500' : 'bg-green-500'}`}></div>

                  <div className="flex flex-col gap-6 text-left">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            nota.type === 'inasistencia' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            {nota.type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            {new Date(nota.created_at).toLocaleString('es-AR')}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-slate-900 leading-tight">"{nota.note}"</p>
                      </div>

                      <div className="flex flex-col md:items-end gap-1 text-left md:text-right">
                         <p className="text-xs font-black text-slate-900 notranslate">{nota.profiles?.full_name}</p>
                         <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter italic leading-none">
                           Tutor de: {nota.students?.full_name} ({nota.students?.courses?.name})
                         </p>
                      </div>
                    </div>

                    {nota.response_text && (
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 animate-in fade-in zoom-in text-left">
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Tu Respuesta:</p>
                        <p className="text-sm text-slate-700 font-medium italic leading-relaxed">"{nota.response_text}"</p>
                      </div>
                    )}

                    {!nota.response_text && (
                      <div className="space-y-4 pt-2 text-left">
                        <textarea
                          value={respuestas[nota.id] || ''}
                          onChange={(e) => setRespuestas({ ...respuestas, [nota.id]: e.target.value })}
                          placeholder="Escribí una respuesta oficial para el padre..."
                          className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 border-none text-slate-900 font-medium transition-all"
                          rows={2}
                        />
                        <div className="flex flex-wrap gap-2 justify-end">
                          {nota.type === 'inasistencia' && nota.status !== 'respondido' && (
                            <button onClick={() => handleJustificarFalta(nota)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 active:scale-95">✅ Justificar</button>
                          )}
                          <button onClick={() => handleSendResponse(nota.id)} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95">Enviar Respuesta ✉️</button>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-left">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Gestión</p>
                       <select 
                          value={nota.status}
                          onChange={(e) => handleUpdateStatus(nota.id, e.target.value)}
                          className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer transition-all ${
                            nota.status === 'pendiente' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                          }`}
                       >
                         <option value="pendiente">Pendiente</option>
                         <option value="leido">Leído</option>
                         <option value="respondido">Respondido</option>
                       </select>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold italic">
                No hay notas pendientes de familias.
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECCIÓN GENERAL: CANAL OFICIAL */}
      <section className="space-y-6 pt-10 border-t border-slate-100 text-left">
        <div className="flex items-center gap-3 ml-2 text-left">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-200 text-white">📣</div>
             <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Canal Oficial</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {comunicados.map((c) => (
            <Link key={c.id} href={`/dashboard/comunicados/${c.id}`} className="bg-white p-7 rounded-[2.5rem] border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all group flex justify-between items-center text-left">
              <div className="space-y-2 text-left">
                <h3 className="text-xl font-black group-hover:text-blue-600 transition-colors leading-none italic text-slate-900">{c.title}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">
                  {new Date(c.created_at).toLocaleDateString('es-AR')} • Por {c.profiles?.full_name}
                </p>
              </div>
              <span className="text-slate-300 group-hover:text-blue-600 transition-all text-2xl group-hover:translate-x-1">➜</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}