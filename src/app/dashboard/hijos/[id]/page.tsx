import { createClient } from '@/app/utils/supabase/server'

export default async function DetalleHijoPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const supabase = await createClient()
  
  // Esperamos los parámetros
  const { id } = await params;

  // Info del alumno - Forzamos el tipado para evitar el error de array
  const { data: alumno } = await supabase
    .from('students')
    .select('full_name, courses(name, section)')
    .eq('id', id)
    .single()

  // Historial de asistencia
  const { data: asistencias } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', id)
    .order('date', { ascending: false })

  // Solución técnica: Supabase a veces devuelve la relación como un objeto o como un array
  // Accedemos de forma segura al nombre y sección
  const cursoInfo = Array.isArray(alumno?.courses) ? alumno?.courses[0] : alumno?.courses

  return (
    <div className="space-y-8">
      <header>
        <nav className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
          <a href="/dashboard/hijos">← Volver</a>
        </nav>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {alumno?.full_name}
        </h1>
        <p className="text-slate-600 font-medium">
          {cursoInfo?.name} "{cursoInfo?.section}"
        </p>
      </header>

      <div className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold italic text-slate-900">Historial de Asistencia</h2>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
              P: {asistencias?.filter(a => a.status === 'presente').length}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
              A: {asistencias?.filter(a => a.status === 'ausente').length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {asistencias && asistencias.length > 0 ? (
            asistencias.map((reg) => (
              <div key={reg.id} className="p-6 flex justify-between items-center transition-colors hover:bg-slate-50/30">
                <div className="flex flex-col">
                  <span className="text-slate-900 font-bold">
                    {new Date(reg.date).toLocaleDateString('es-AR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                    Control Diario
                  </span>
                </div>
                
                <span className={`
                  px-4 py-2 rounded-xl text-xs font-black uppercase
                  ${reg.status === 'presente' ? 'bg-green-100 text-green-700' : 
                    reg.status === 'ausente' ? 'bg-red-100 text-red-700' : 
                    'bg-amber-100 text-amber-700'}
                `}>
                  {reg.status}
                </span>
              </div>
            ))
          ) : (
            <p className="p-10 text-center text-slate-400 italic">
              No hay registros de asistencia todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}