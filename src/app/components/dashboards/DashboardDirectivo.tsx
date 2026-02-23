// src/components/dashboards/DashboardDirectivo.tsx
import { createClient } from "@/app/utils/supabase/server";

export default async function DashboardDirectivo({ profile }: { profile: any }) {
  const supabase = await createClient();
  const hoy = new Date().toISOString().split('T')[0];

  // 1. Consultas en paralelo para rendimiento máximo
  const [estudiantes, personal, asistencias] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', profile.school_id),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', profile.school_id).in('role', ['docente', 'preceptor']),
    supabase.from('attendance').select('status, students!inner(school_id)').eq('students.school_id', profile.school_id).eq('date', hoy)
  ]);

  // 2. Cálculo de métricas de asistencia
  const totalAsistenciasHoy = asistencias.data?.length || 0;
  const presentes = asistencias.data?.filter(a => a.status === 'presente').length || 0;
  const porcentajePresentismo = totalAsistenciasHoy > 0 ? Math.round((presentes / totalAsistenciasHoy) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 opacity-[0.03] rounded-bl-full transition-all group-hover:scale-110"></div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">Asistencia General</p>
          <div className="flex items-baseline gap-2">
            <p className="text-6xl font-black text-slate-900 tracking-tighter">{porcentajePresentismo}%</p>
            <p className="text-green-600 font-bold text-sm">Hoy</p>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${porcentajePresentismo}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-[0.03] rounded-bl-full transition-all group-hover:scale-110"></div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">Matrícula Total</p>
          <p className="text-6xl font-black text-slate-900 tracking-tighter">{estudiantes.count || 0}</p>
          <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-tight">Alumnos registrados</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-[0.03] rounded-bl-full transition-all group-hover:scale-110"></div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">Cuerpo Docente</p>
          <p className="text-6xl font-black text-slate-900 tracking-tighter">{personal.count || 0}</p>
          <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-tight">Profesores y Preceptores</p>
        </div>
      </div>

      {/* Banner de Acción */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 blur-[80px]"></div>
        <div className="relative z-10 text-center lg:text-left">
          <h3 className="text-2xl font-black mb-2 tracking-tight">Reporte Semanal de Calificaciones</h3>
          <p className="text-slate-400 font-medium">Hay libretas pendientes de firma para el 2do Trimestre.</p>
        </div>
        <a href="/dashboard/admin/libretas" className="relative z-10 bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-blue-900/40 active:scale-95">
          Gestionar Libretas
        </a>
      </div>
    </div>
  );
}