import { createClient } from "@/app/utils/supabase/server";
import Link from 'next/link';
import BotonPagoMP from "./BotonPagoMP";

export default async function DashboardPadre({ user, profile }: { user: any, profile: any }) {
  const supabase = await createClient();
  const hoy = new Date().toISOString().split('T')[0];

  // 1. Obtener IDs de los hijos vinculados
  const { data: hijos } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('parent_id', user?.id);

  const idsHijos = hijos?.map(h => h.id) || [];

  // 2. Consultas en paralelo (CON PROTECCIÓN PARA ARRAYS VACÍOS)
  const [commCount, libCount, asistHoy, misNotas] = await Promise.all([
    // Comunicados (siempre se consulta por escuela)
    supabase.from('communications').select('*', { count: 'exact', head: true }).eq('school_id', profile?.school_id),
    
    // Libretas (Solo si tiene hijos)
    idsHijos.length > 0 
      ? supabase.from('libretas').select('*', { count: 'exact', head: true }).in('student_id', idsHijos)
      : Promise.resolve({ count: 0 }),

    // Asistencia (Solo si tiene hijos)
    idsHijos.length > 0 
      ? supabase.from('attendance').select('status').in('student_id', idsHijos).eq('date', hoy)
      : Promise.resolve({ data: [] }),

    // Notas enviadas
    supabase.from('parent_requests')
      .select('id, type, note, status, response_text, created_at, responded_at')
      .eq('parent_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  // 3. Lógica de estado de asistencia inteligente
  let estadoAsistencia = "--";
  let colorAsist = "slate";
  
  if (idsHijos.length > 0) {
    const dataAsist = asistHoy.data || [];
    if (dataAsist.length > 0) {
      const tieneAusente = dataAsist.some((a: any) => a.status === 'ausente');
      const tieneJustificado = dataAsist.some((a: any) => a.status === 'justificado');
      
      if (tieneAusente) {
        estadoAsistencia = "Ausente";
        colorAsist = "red";
      } else if (tieneJustificado) {
        estadoAsistencia = "Justificada";
        colorAsist = "amber";
      } else {
        estadoAsistencia = "Presente";
        colorAsist = "green";
      }
    } else {
      estadoAsistencia = "Pendiente";
      colorAsist = "blue";
    }
  }

  const isPaid = profile?.subscription_active === true;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10 text-left">
      
      {/* BANNER DE PAGO */}
      {!isPaid && (
        <div className="relative overflow-hidden bg-slate-950 p-8 md:p-12 rounded-[3rem] text-white shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-20 -mt-20 text-left"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-left space-y-2">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic text-blue-400 leading-none">Acceso Limitado</h2>
              <p className="text-slate-400 text-sm font-medium max-w-sm leading-relaxed">Activá el ciclo lectivo 2026 para desbloquear el seguimiento de asistencia y libretas digitales.</p>
            </div>
            <BotonPagoMP />
          </div>
        </div>
      )}

      {/* TARJETAS DE ESTADÍSTICA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Comunicados" value={commCount.count || 0} sub="Mensajes nuevos" icon="🔔" color="blue" isPaid={true} />
        <StatCard title="Asistencia" value={isPaid ? estadoAsistencia : "🔒"} sub="Estado de hoy" icon="📅" color={colorAsist} isPaid={isPaid} />
        <StatCard title="Libretas" value={libCount.count || 0} sub="PDFs cargados" icon="📄" color="purple" isPaid={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* GRUPO FAMILIAR */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-left">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-lg">K</div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hijos Vinculados</h3>
          </div>
          
          <div className="space-y-4">
            {hijos && hijos.length > 0 ? (
              hijos.map(h => (
                <Link key={h.id} href={`/dashboard/hijos/${h.id}`} className={`flex items-center justify-between p-5 rounded-3xl border border-slate-100 transition-all ${isPaid ? 'hover:border-blue-500 hover:bg-blue-50/30' : 'opacity-40 grayscale pointer-events-none'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shadow-lg uppercase text-xl">
                      {h.full_name.charAt(0)}
                    </div>
                    <span className="font-black text-slate-800 notranslate text-lg">{h.full_name}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-blue-600 text-xl">➜</div>
                </Link>
              ))
            ) : (
              <div className="py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none">Sin alumnos asociados</p>
              </div>
            )}
          </div>
        </div>

        {/* NOTAS A PRECEPTORÍA */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notas a Preceptoría</h3>
            <Link href="/dashboard/comunicados/solicitud" className="text-[10px] font-black text-blue-600 uppercase underline underline-offset-4 decoration-2">Nueva Nota +</Link>
          </div>

          <div className="space-y-6">
            {misNotas.data?.map((nota: any) => (
              <div key={nota.id} className="relative p-6 rounded-[2.2rem] bg-white border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                {/* Barra lateral de estado */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  nota.status === 'pendiente' ? 'bg-red-500' : nota.status === 'leido' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></div>

                <div className="flex justify-between items-center pl-2">
                  <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{nota.type}</span>
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full shadow-sm border ${
                    nota.status === 'pendiente' ? 'bg-red-500 text-white border-red-400' :
                    nota.status === 'leido' ? 'bg-amber-500 text-white border-amber-400' :
                    'bg-emerald-500 text-white border-emerald-400'
                  }`}>
                    {nota.status}
                  </span>
                </div>

                <p className="pl-2 text-sm text-slate-600 italic font-medium">"{nota.note}"</p>

                {/* RESPUESTA DESTACADA */}
                {nota.response_text && (
                  <div className="ml-2 p-5 bg-blue-600 rounded-[1.8rem] text-white shadow-xl shadow-blue-900/20 animate-in slide-in-from-left-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-[10px]">💬</div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-100">Respuesta de la Escuela</p>
                    </div>
                    <p className="text-sm font-bold leading-tight drop-shadow-sm">{nota.response_text}</p>
                    <p className="text-[8px] text-blue-300 mt-3 font-black text-right uppercase tracking-widest">
                      Respondido el {new Date(nota.responded_at || nota.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                )}

                <div className="pl-2 pt-2 border-t border-slate-50 flex justify-between items-center">
                  <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest leading-none">ID: {nota.id.slice(0, 8)}</p>
                  <p className="text-[9px] text-slate-400 font-bold leading-none">{new Date(nota.created_at).toLocaleDateString('es-AR')}</p>
                </div>
              </div>
            ))}
            {misNotas.data?.length === 0 && (
              <div className="py-12 text-center text-slate-300 italic text-sm font-medium">No has enviado notas oficiales todavía.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// SUBCOMPONENTE DE TARJETA
function StatCard({ title, value, sub, icon, color, isPaid }: any) {
  const colors: any = { 
    blue: "text-blue-600 bg-blue-50 border-blue-100", 
    green: "text-emerald-600 bg-emerald-50 border-emerald-100", 
    red: "text-rose-600 bg-rose-50 border-rose-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    purple: "text-violet-600 bg-violet-50 border-violet-100",
    slate: "text-slate-500 bg-slate-50 border-slate-100"
  };
  
  return (
    <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-all text-left bg-white ${isPaid ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-80'}`}>
      <div className="flex justify-between items-center mb-8">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-5xl font-black tracking-tighter text-left ${colors[color]?.split(' ')[0]} ${!isPaid && title === 'Asistencia' ? 'opacity-10' : ''}`}>
        {value}
      </p>
      <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest leading-none">{sub}</p>
    </div>
  );
}