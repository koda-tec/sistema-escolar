import { createClient } from '@/app/utils/supabase/server'

export default async function DetalleHijoPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const supabase = await createClient()
  
  // 1. Esperamos los parámetros de la URL
  const { id } = await params;

  // 2. Info del alumno y su curso (relación)
  const { data: alumno } = await supabase
    .from('students')
    .select('full_name, courses(name, section)')
    .eq('id', id)
    .single()

  // 3. Historial de asistencia
  const { data: asistencias } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', id)
    .order('date', { ascending: false })

  // 4. NUEVO: Consulta de Libretas Digitales
  const { data: libretas } = await supabase
    .from('libretas')
    .select('*')
    .eq('student_id', id)
    .order('anio', { ascending: false })
    .order('trimestre', { ascending: false })

  // Solución técnica para el tipado de la relación 'courses'
  const cursoInfo = Array.isArray(alumno?.courses) ? alumno?.courses[0] : alumno?.courses

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* CABECERA Y NAVEGACIÓN */}
      <header>
        <nav className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">
          <a href="/dashboard/hijos" className="hover:opacity-70 flex items-center gap-1">
            ← Volver a mis hijos
          </a>
        </nav>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight notranslate">
          {alumno?.full_name}
        </h1>
        <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-[0.2em]">
          {cursoInfo?.name} "{cursoInfo?.section}"
        </p>
      </header>

      {/* --- SECCIÓN: LIBRETAS DIGITALES --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-200">
            📄
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Libretas Digitales</h2>
        </div>

        {libretas && libretas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {libretas.map((libreta) => (
              <div key={libreta.id} className="bg-white p-6 rounded-2rem border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-[10px] font-black shadow-inner">
                    PDF
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{libreta.trimestre}° Trimestre - {libreta.anio}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Subido el {new Date(libreta.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <a 
                  href={libreta.archivo_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-slate-950 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                  Ver Notas
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-bold text-sm italic">
              Aún no se han cargado libretas para este alumno.
            </p>
          </div>
        )}
      </section>

      {/* --- SECCIÓN: ASISTENCIA --- */}
      <section className="space-y-4 pt-6 border-t border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-slate-200">
                    📅
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight text-left">Historial de Asistencia</h2>
            </div>
            <div className="flex gap-2">
                <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-green-100">
                  P: {asistencias?.filter(a => a.status === 'presente').length}
                </div>
                <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-red-100">
                  A: {asistencias?.filter(a => a.status === 'ausente').length}
                </div>
            </div>
        </div>

        <div className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {asistencias && asistencias.length > 0 ? (
              asistencias.map((reg) => (
                <div key={reg.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors text-left">
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-bold capitalize">
                      {new Date(reg.date).toLocaleDateString('es-AR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </span>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Registro Oficial</span>
                  </div>
                  
                  <span className={`
                    px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest
                    ${reg.status === 'presente' ? 'bg-green-100 text-green-700' : 
                      reg.status === 'ausente' ? 'bg-red-100 text-red-700' : 
                      'bg-amber-100 text-amber-700'}
                  `}>
                    {reg.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="p-10 text-center text-slate-400 italic font-medium">
                No hay registros de asistencia todavía.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}