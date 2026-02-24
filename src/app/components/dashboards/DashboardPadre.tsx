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

  // 4. VERIFICACIÓN DE SUSCRIPCIÓN
  const isPaid = profile?.subscription_active === true;

  // Lógica de visualización condicionada por el pago
  // Mostramos los números de Avisos y Libretas para generar interés (FOMO)
  // Pero bloqueamos totalmente el dato de Asistencia
  const displayAsistencia = isPaid ? estadoAsistencia : "🔒 BLOQUEADO";
  const asistenciaColor = isPaid && estadoAsistencia === 'Ausente' ? 'red' : 'green';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* SECCIÓN DE BLOQUEO / PAGO */}
      {!isPaid && (
        <div className="relative overflow-hidden bg-slate-950 p-8 md:p-12 rounded-[3rem] text-white shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4">
              <span className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                Acceso Limitado
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
                Activá el Ciclo <br /> Lectivo 2026
              </h2>
              <p className="text-slate-400 max-w-sm font-medium">
                Tu cuenta se encuentra en modo lectura. Para ver el detalle de inasistencias y comunicados, activá el abono anual.
              </p>
            </div>
            
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-md text-center w-full md:w-auto">
              <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Pago único anual</p>
              <p className="text-4xl font-black mb-6 text-white">$30.000</p>
              <BotonPagoMP />
            </div>
          </div>
        </div>
      )}

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Avisos" 
          value={commCount.count || 0} 
          sub="Novedades de la escuela" 
          icon="🔔" 
          color="blue" 
          isPaid={true} // Siempre visible el número para incentivar
        />
        <StatCard 
          title="Asistencia" 
          value={displayAsistencia} 
          sub="Seguimiento en vivo" 
          icon="📅" 
          color={asistenciaColor} 
          isPaid={isPaid} // Si no pagó, se verá bloqueado
        />
        <StatCard 
          title="Libretas" 
          value={libCount.count || 0} 
          sub="PDFs disponibles" 
          icon="📄" 
          color="purple" 
          isPaid={true} // Siempre visible el número
        />
      </div>

      {/* SECCIÓN DE HIJOS (Bloqueada visualmente si no pagó) */}
      <div className={`mt-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all duration-500 ${!isPaid ? 'opacity-40 grayscale pointer-events-none blur-[2px]' : ''}`}>
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Hijos vinculados</h3>
        <div className="flex flex-wrap gap-4">
          {hijos && hijos.length > 0 ? (
            hijos.map(h => (
              <Link key={h.id} href={`/dashboard/hijos/${h.id}`} className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 hover:border-blue-500 hover:bg-white transition-all font-bold text-slate-700 flex items-center gap-3 group shadow-sm">
                <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-lg shadow-inner">🎓</span>
                <span className="notranslate text-slate-900">{h.full_name}</span>
              </Link>
            ))
          ) : (
            <p className="text-slate-400 italic text-sm font-medium p-2 text-left">No hay alumnos vinculados todavía.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color, isPaid }: any) {
  const colors: any = { 
    blue: "bg-blue-500 text-blue-600 bg-blue-50", 
    green: "bg-emerald-500 text-emerald-600 bg-green-50", 
    red: "bg-rose-500 text-rose-600 bg-red-50", 
    purple: "bg-violet-500 text-violet-600 bg-purple-50" 
  };
  
  return (
    <div className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden transition-all text-left ${!isPaid && title === 'Asistencia' ? 'bg-slate-50' : ''}`}>
      <div className="relative z-10 text-left">
        <div className="flex justify-between items-center mb-6 text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
          <span className={`text-2xl ${!isPaid && title === 'Asistencia' ? 'grayscale opacity-30' : ''}`}>{icon}</span>
        </div>
        <p className={`text-3xl font-black tracking-tighter text-left ${!isPaid && title === 'Asistencia' ? 'text-slate-300 italic' : 'text-slate-900'} ${value === 'Ausente' ? 'text-rose-600' : ''}`}>
          {value}
        </p>
        <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter text-left">{sub}</p>
      </div>
    </div>
  );
}