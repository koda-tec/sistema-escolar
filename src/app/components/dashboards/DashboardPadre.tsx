import { createClient } from "@/app/utils/supabase/server";

export default async function DashboardPadre({ user, profile }: { user: any, profile: any }) {
  const supabase = await createClient();

  // 1. Obtener IDs de los hijos
  const { data: hijos } = await supabase
    .from('students')
    .select('id')
    .eq('parent_id', user?.id);

  const idsHijos = hijos?.map(h => h.id) || [];

  // 2. Consultas en paralelo
  const [comunicadosCount, libretasCount, asistenciaHoy] = await Promise.all([
    supabase.from('communications').select('*', { count: 'exact', head: true }).eq('school_id', profile?.school_id),
    supabase.from('libretas').select('*', { count: 'exact', head: true }).in('student_id', idsHijos),
    supabase.from('attendance').select('status').in('student_id', idsHijos).eq('date', new Date().toISOString().split('T')[0])
  ]);

  // Lógica de asistencia
  let estadoAsistencia = idsHijos.length > 0 ? (asistenciaHoy.data?.length ? (asistenciaHoy.data.some(a => a.status === 'ausente') ? "Ausente" : "Presente") : "Pendiente") : "--";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Avisos" value={comunicadosCount.count || 0} sub="Mensajes de la escuela" color="blue" />
        <Card title="Asistencia" value={estadoAsistencia} sub="Estado de hoy" color={estadoAsistencia === 'Ausente' ? 'red' : 'green'} />
        <Card title="Libretas" value={libretasCount.count || 0} sub="PDFs disponibles" color="purple" />
      </div>

      <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h3 className="text-2xl font-black italic">Información para Familias</h3>
          <p className="text-blue-100 text-sm max-w-xl font-medium leading-relaxed">
            Recordá que podés descargar las libretas digitales y justificar inasistencias desde la sección de <span className="text-white font-bold underline">"Mis Hijos"</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

// Subcomponente de tarjeta (Podés moverlo a un archivo compartido luego)
function Card({ title, value, sub, color }: any) {
    const colors: any = { 
        blue: "text-blue-600 bg-blue-50", 
        green: "text-green-600 bg-green-50", 
        red: "text-red-600 bg-red-50",
        purple: "text-purple-600 bg-purple-50"
    };
    return (
        <div className="bg-white p-8 rounded-2rem border border-slate-100 shadow-sm">
            <span className={`${colors[color]} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest`}>{title}</span>
            <p className="text-4xl font-black mt-6 text-slate-900">{value}</p>
            <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-tighter">{sub}</p>
        </div>
    );
}