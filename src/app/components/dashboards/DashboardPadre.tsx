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

  // 2. Consultas en paralelo para los contadores
  const [commCount, libCount, asistHoy] = await Promise.all([
    supabase.from('communications').select('*', { count: 'exact', head: true }).eq('school_id', profile?.school_id),
    supabase.from('libretas').select('*', { count: 'exact', head: true }).in('student_id', idsHijos),
    supabase.from('attendance').select('status').in('student_id', idsHijos).eq('date', hoy)
  ]);

  // 3. Lógica de estado de asistencia
  let estadoAsistencia = "--";
  if (idsHijos.length > 0) {
    if (asistHoy.data && asistHoy.data.length > 0) {
      const tieneAusente = asistHoy.data.some(a => a.status === 'ausente');
      estadoAsistencia = tieneAusente ? "Ausente" : "Presente";
    } else {
      estadoAsistencia = "Pendiente";
    }
  }

  // 4. VERIFICACIÓN DE SUSCRIPCIÓN (Lógica de Cobro)
  const isPaid = profile?.subscription_active === true;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* SECCIÓN DE BLOQUEO / PAGO (Si no pagó los $30.000) */}
      {!isPaid && (
        <div className="relative overflow-hidden bg-linear-to-br from-slate-900 to-slate-800 p-8 md:p-12 rounded-[3rem] text-white shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4">
              <span className="bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                Ciclo Lectivo 2026
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
                Activá el acceso de <br /> tu familia
              </h2>
              <p className="text-slate-400 max-w-sm font-medium">
                Para visualizar inasistencias, comunicados y libretas digitales, es necesario abonar el acceso anual por alumno.
              </p>
            </div>
            
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-md text-center w-full md:w-auto">
              <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Abono Único Anual</p>
              <p className="text-4xl font-black mb-6">$30.000</p>
              <BotonPagoMP />
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD REAL (Se ve borroso o bloqueado si no pagó, según prefieras) */}
      <div className={!isPaid ? "opacity-40 pointer-events-none grayscale select-none" : ""}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Avisos" value={commCount.count || 0} sub="Mensajes nuevos" icon="🔔" color="blue" />
          <StatCard title="Asistencia" value={estadoAsistencia} sub="Estado de hoy" icon="📅" color={estadoAsistencia === 'Ausente' ? 'red' : 'green'} />
          <StatCard title="Libretas" value={libCount.count || 0} sub="PDFs cargados" icon="📄" color="purple" />
        </div>

        <div className="mt-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Hijos vinculados</h3>
          <div className="flex flex-wrap gap-4">
            {hijos && hijos.length > 0 ? (
              hijos.map(h => (
                <Link key={h.id} href={`/dashboard/hijos/${h.id}`} className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 hover:border-blue-500 hover:bg-white transition-all font-bold text-slate-700 flex items-center gap-3 group shadow-sm">
                  <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-lg shadow-inner">🎓</span>
                  <span className="notranslate">{h.full_name}</span>
                </Link>
              ))
            ) : (
              <p className="text-slate-400 italic text-sm font-medium p-2 text-left">No hay alumnos vinculados a tu cuenta todavía.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// SUBCOMPONENTE: TARJETAS DE ESTADÍSTICAS
function StatCard({ title, value, sub, icon, color }: any) {
  const colors: any = { 
    blue: "bg-blue-500 text-blue-600 bg-blue-50", 
    green: "bg-emerald-500 text-emerald-600 bg-emerald-50", 
    red: "bg-rose-500 text-rose-600 bg-rose-50", 
    purple: "bg-violet-500 text-violet-600 bg-violet-50" 
  };
  
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all text-left">
      <div className="relative z-10 text-left">
        <div className="flex justify-between items-center mb-6 text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
          <span className="text-2xl">{icon}</span>
        </div>
        <p className={`text-4xl font-black tracking-tighter ${value === 'Ausente' ? 'text-rose-600' : 'text-slate-900'} text-left`}>
          {value}
        </p>
        <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter text-left">{sub}</p>
      </div>
    </div>
  );
}