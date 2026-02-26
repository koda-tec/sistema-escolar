import { createClient } from "@/app/utils/supabase/server";
import Link from 'next/link';
import BotonPagoMP from "./BotonPagoMP";

export default async function DashboardPadre({ user, profile }: { user: any, profile: any }) {
  const supabase = await createClient();
  const hoy = new Date().toISOString().split('T')[0];

  // 1. Obtener IDs de los hijos
  const { data: hijos } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('parent_id', user?.id);

  const idsHijos = hijos?.map(h => h.id) || [];

  // 2. Consultas en paralelo (FORZAMOS NO-CACHE para ver cambios al instante)
  const [commCount, libCount, asistHoy, misNotas] = await Promise.all([
    supabase.from('communications').select('*', { count: 'exact', head: true }).eq('school_id', profile?.school_id),
    supabase.from('libretas').select('*', { count: 'exact', head: true }).in('student_id', idsHijos),
    supabase.from('attendance').select('status').in('student_id', idsHijos).eq('date', hoy),
    
    // Traemos las notas con todas las columnas necesarias
    supabase.from('parent_requests')
      .select('id, type, note, status, response_text, created_at')
      .eq('parent_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  // 3. Lógica de estado de asistencia
  let estadoAsistencia = "--";
  let colorAsist = "slate";
  if (idsHijos.length > 0) {
    if (asistHoy.data && asistHoy.data.length > 0) {
      const tieneAusente = asistHoy.data.some(a => a.status === 'ausente');
      const tieneJustificado = asistHoy.data.some(a => a.status === 'justificado');
      estadoAsistencia = tieneAusente ? "Ausente" : tieneJustificado ? "Justificada" : "Presente";
      colorAsist = tieneAusente ? "red" : tieneJustificado ? "amber" : "green";
    } else {
      estadoAsistencia = "Pendiente";
      colorAsist = "blue";
    }
  }

  const isPaid = profile?.subscription_active === true;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10 text-left">
      
      {/* SECCIÓN DE PAGO (Si no está activo) */}
      {!isPaid && (
        <div className="relative overflow-hidden bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl border border-white/5 animate-pulse-subtle">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-left space-y-2">
              <h2 className="text-2xl font-black tracking-tight uppercase italic text-blue-400">Acceso Limitado</h2>
              <p className="text-slate-300 text-sm font-medium max-w-sm">Activá el ciclo lectivo 2026 para ver el presentismo detallado y las libretas de tus hijos.</p>
            </div>
            <BotonPagoMP />
          </div>
        </div>
      )}

      {/* MÉTRICAS (Estilos mejorados con colores vivos) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Comunicados" value={commCount.count || 0} sub="Mensajes nuevos" icon="🔔" color="blue" isPaid={true} />
        <StatCard title="Asistencia" value={isPaid ? estadoAsistencia : "🔒"} sub="Estado de hoy" icon="📅" color={colorAsist} isPaid={isPaid} />
        <StatCard title="Libretas" value={libCount.count || 0} sub="PDFs cargados" icon="📄" color="purple" isPaid={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COLUMNA: GRUPO FAMILIAR */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-left">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs shadow-lg shadow-blue-200">K</div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hijos Vinculados</h3>
          </div>
          <div className="space-y-4">
            {hijos?.map(h => (
              <Link key={h.id} href={`/dashboard/hijos/${h.id}`} className={`flex items-center justify-between p-5 rounded-3xl border border-slate-100 transition-all ${isPaid ? 'hover:border-blue-500 hover:bg-blue-50/30' : 'opacity-40 grayscale pointer-events-none'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                    {h.full_name.charAt(0)}
                  </div>
                  <span className="font-black text-slate-800 notranslate text-lg leading-none">{h.full_name}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-blue-600 text-xl font-bold">➜</div>
              </Link>
            ))}
          </div>
        </div>

        {/* COLUMNA: MIS NOTAS (FEEDBACK DINÁMICO) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notas a Preceptoría</h3>
             <Link href="/dashboard/comunicados/solicitud" className="text-[10px] font-black text-blue-600 uppercase underline decoration-2 underline-offset-4">Nueva Nota</Link>
          </div>
          
          <div className="space-y-6">
            {misNotas.data?.map((nota: any) => (
              <div key={nota.id} className="p-5 rounded-2rem bg-slate-50/50 border border-slate-100 space-y-4 transition-all hover:bg-white hover:shadow-md">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{nota.type}</span>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg shadow-sm border ${
                    nota.status === 'pendiente' ? 'bg-red-500 text-white border-red-400' :
                    nota.status === 'leido' ? 'bg-amber-500 text-white border-amber-400' :
                    'bg-emerald-500 text-white border-emerald-400'
                  }`}>
                    {nota.status}
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 italic font-medium leading-relaxed">" {nota.note} "</p>

                {/* LA RESPUESTA: AHORA DESTACADA EN AZUL */}
                {nota.response_text && (
                  <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200 animate-in slide-in-from-left-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-200 mb-1">Respuesta de la Escuela:</p>
                    <p className="text-sm font-bold leading-tight">"{nota.response_text}"</p>
                  </div>
                )}
                
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest pt-2 border-t border-slate-100">
                  Enviado el {new Date(nota.created_at).toLocaleDateString('es-AR')}
                </p>
              </div>
            ))}
            {misNotas.data?.length === 0 && (
              <div className="py-12 text-center text-slate-300 italic font-medium">No has enviado notas todavía.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color, isPaid }: any) {
  const colors: any = { 
    blue: "text-blue-600 bg-blue-50 border-blue-100", 
    green: "text-emerald-600 bg-emerald-50 border-emerald-100", 
    red: "text-rose-600 bg-rose-50 border-rose-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    purple: "text-violet-600 bg-violet-50 border-violet-100"
  };
  
  return (
    <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-all text-left bg-white ${isPaid ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-80'}`}>
      <div className="flex justify-between items-center mb-8">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-5xl font-black tracking-tighter ${colors[color].split(' ')[0]} ${!isPaid && title === 'Asistencia' ? 'opacity-10' : ''}`}>
        {value}
      </p>
      <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">{sub}</p>
    </div>
  );
}