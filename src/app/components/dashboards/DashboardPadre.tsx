import { createClient } from "@/app/utils/supabase/server";
import Link from 'next/link';
import BotonPagoMP from "./BotonPagoMP";

export default async function DashboardPadre({ user, profile }: { user: any, profile: any }) {
  const supabase = await createClient();
  const hoy = new Date().toISOString().split('T')[0];

  // 1. Obtener IDs de los hijos
  const { data: hijos } = await supabase.from('students').select('id, full_name').eq('parent_id', user?.id);
  const idsHijos = hijos?.map(h => h.id) || [];

  // 2. Consultas en paralelo incluyendo las notas enviadas
  const [commCount, libCount, asistHoy, misNotas] = await Promise.all([
    supabase.from('communications').select('*', { count: 'exact', head: true }).eq('school_id', profile?.school_id),
    supabase.from('libretas').select('*', { count: 'exact', head: true }).in('student_id', idsHijos),
    supabase.from('attendance').select('status').in('student_id', idsHijos).eq('date', hoy),
    supabase.from('parent_requests').select('*').eq('parent_id', user?.id).order('created_at', { ascending: false }).limit(3)
  ]);

  // 3. Lógica de estado de asistencia corregida
  let estadoAsistencia = "--";
  let colorAsistencia = "green";
  if (idsHijos.length > 0) {
    if (asistHoy.data && asistHoy.data.length > 0) {
      const tieneAusente = asistHoy.data.some(a => a.status === 'ausente');
      const tieneJustificado = asistHoy.data.some(a => a.status === 'justificado');
      
      if (tieneAusente) {
        estadoAsistencia = "Ausente";
        colorAsistencia = "red";
      } else if (tieneJustificado) {
        estadoAsistencia = "Justificada";
        colorAsistencia = "amber";
      } else {
        estadoAsistencia = "Presente";
        colorAsistencia = "green";
      }
    } else {
      estadoAsistencia = "Pendiente";
      colorAsistencia = "blue";
    }
  }

  const isPaid = profile?.subscription_active === true;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* BANNER DE PAGO (Solo si no pagó) */}
      {!isPaid && (
        <div className="relative overflow-hidden bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-left space-y-2">
              <h2 className="text-2xl font-black tracking-tight leading-none uppercase italic">Activa KodaEd Pro</h2>
              <p className="text-slate-400 text-sm font-medium">Desbloquea el seguimiento detallado de tus hijos.</p>
            </div>
            <BotonPagoMP />
          </div>
        </div>
      )}

      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Avisos" value={commCount.count || 0} sub="Mensajes nuevos" icon="🔔" color="blue" isPaid={true} />
        <StatCard title="Asistencia" value={isPaid ? estadoAsistencia : "🔒"} sub="Estado de hoy" icon="📅" color={colorAsistencia} isPaid={isPaid} />
        <StatCard title="Libretas" value={libCount.count || 0} sub="PDFs cargados" icon="📄" color="purple" isPaid={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* HIJOS VINCULADOS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-left">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Grupo Familiar</h3>
          <div className="space-y-3">
            {hijos?.map(h => (
              <Link key={h.id} href={`/dashboard/hijos/${h.id}`} className={`flex items-center justify-between p-4 rounded-2xl border border-slate-100 transition-all ${isPaid ? 'hover:border-blue-500 hover:bg-blue-50/30' : 'opacity-40 grayscale pointer-events-none'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
                    {h.full_name.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-900 notranslate">{h.full_name}</span>
                </div>
                <span className="text-blue-600 text-lg">➜</span>
              </Link>
            ))}
          </div>
        </div>

        {/* MIS NOTAS ENVIADAS (FEEDBACK PARA EL PADRE) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-left">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Mis Notas a Preceptoría</h3>
          <div className="space-y-4">
            {misNotas.data?.map((nota: any) => (
              <div key={nota.id} className="border-b border-slate-50 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{nota.type}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                    nota.status === 'pendiente' ? 'bg-slate-100 text-slate-500' :
                    nota.status === 'leido' ? 'bg-amber-100 text-amber-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {nota.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1 italic">"{nota.note}"</p>
                <p className="text-[9px] text-slate-300 mt-1 font-bold">{new Date(nota.created_at).toLocaleDateString('es-AR')}</p>
              </div>
            ))}
            {misNotas.data?.length === 0 && (
              <p className="text-center text-slate-400 text-sm italic py-10">No has enviado notas oficiales aún.</p>
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
    <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-all text-left bg-white ${isPaid ? 'hover:shadow-xl' : ''}`}>
      <div className="flex justify-between items-center mb-6 text-left">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-black tracking-tighter text-left ${colors[color].split(' ')[0]} ${!isPaid && title === 'Asistencia' ? 'opacity-20' : ''}`}>
        {value}
      </p>
      <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter text-left">{sub}</p>
    </div>
  );
}