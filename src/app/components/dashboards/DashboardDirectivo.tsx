import { createClient } from "@/app/utils/supabase/server";

export default async function DashboardDirectivo({ profile }: { profile: any }) {
  const supabase = await createClient();

  // 1. Total de Alumnos en la escuela
  const { count: totalAlumnos } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', profile.school_id);

  // 2. Asistencia Global de hoy
  const hoy = new Date().toISOString().split('T')[0];
  const { data: asistencias } = await supabase
    .from('attendance')
    .select('status, students!inner(school_id)')
    .eq('students.school_id', profile.school_id)
    .eq('date', hoy);

  const presentes = asistencias?.filter(a => a.status === 'presente').length || 0;
  const ausentes = asistencias?.filter(a => a.status === 'ausente').length || 0;
  const tasa = asistencias?.length ? Math.round((presentes / asistencias.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card title="Presentismo Hoy" value={`${tasa}%`} sub="Promedio general" color="green" />
      <Card title="Alumnos Totales" value={totalAlumnos || 0} sub="Matrícula activa" color="blue" />
      <Card title="Ausentes Críticos" value={ausentes} sub="Familias notificadas" color="red" />
    </div>
  );
}

// Subcomponente reutilizable para las tarjetas
function Card({ title, value, sub, color }: any) {
    const colors: any = { 
        blue: "text-blue-600 bg-blue-50", 
        green: "text-green-600 bg-green-50", 
        red: "text-red-600 bg-red-50" 
    };
    return (
        <div className="bg-white p-8 rounded-2rem border border-slate-100 shadow-sm">
            <span className={`${colors[color]} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest`}>{title}</span>
            <p className="text-5xl font-black mt-6 text-slate-900">{value}</p>
            <p className="text-slate-400 text-xs font-bold mt-2 uppercase">{sub}</p>
        </div>
    );
}