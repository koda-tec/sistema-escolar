// src/components/dashboards/DashboardPadre.tsx
import { createClient } from "@/app/utils/supabase/server";
import Link from 'next/link';

export default async function DashboardPadre({ user, profile }: { user: any, profile: any }) {
  const supabase = await createClient();
  const hoy = new Date().toISOString().split('T')[0];

  const { data: hijos } = await supabase.from('students').select('id, full_name').eq('parent_id', user?.id);
  const idsHijos = hijos?.map(h => h.id) || [];

  const [commCount, libCount, asistHoy] = await Promise.all([
    supabase.from('communications').select('*', { count: 'exact', head: true }).eq('school_id', profile?.school_id),
    supabase.from('libretas').select('*', { count: 'exact', head: true }).in('student_id', idsHijos),
    supabase.from('attendance').select('status').in('student_id', idsHijos).eq('date', hoy)
  ]);

  let estadoAsistencia = idsHijos.length > 0 ? (asistHoy.data?.some(a => a.status === 'ausente') ? "Ausente" : asistHoy.data?.length ? "Presente" : "Pendiente") : "--";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Avisos" value={commCount.count || 0} sub="Mensajes nuevos" icon="🔔" color="blue" />
        <StatCard title="Asistencia" value={estadoAsistencia} sub="Estado de hoy" icon="📅" color={estadoAsistencia === 'Ausente' ? 'red' : 'green'} />
        <StatCard title="Libretas" value={libCount.count || 0} sub="PDFs cargados" icon="📄" color="purple" />
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Hijos vinculados</h3>
        <div className="flex flex-wrap gap-4">
          {hijos?.map(h => (
            <Link key={h.id} href={`/dashboard/hijos/${h.id}`} className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 hover:border-blue-500 transition-all font-bold text-slate-700 flex items-center gap-3 group">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-xs">🎓</span>
              {h.full_name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color }: any) {
  const colors: any = { blue: "bg-blue-500", green: "bg-emerald-500", red: "bg-rose-500", purple: "bg-violet-500" };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
      <div className={`absolute top-0 right-0 w-24 h-24 ${colors[color]} opacity-[0.03] rounded-bl-full`}></div>
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
          <span className="text-xl">{icon}</span>
        </div>
        <p className={`text-4xl font-black tracking-tight ${value === 'Ausente' ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
        <p className="text-xs font-bold text-slate-400 mt-2 uppercase">{sub}</p>
      </div>
    </div>
  );
}