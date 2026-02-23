// src/components/dashboards/DashboardPreceptor.tsx
import { createClient } from "@/app/utils/supabase/server";

export default async function DashboardPreceptor({ profile }: { profile: any }) {
  const supabase = await createClient();
  const { count: totalAlumnos } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', profile.school_id);
  const { data: cursos } = await supabase.from('courses').select('name, section').eq('school_id', profile.school_id);

  return (
    <div className="space-y-6">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">{totalAlumnos || 0}</h2>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Alumnos bajo tu gestión</p>
        </div>
        <div className="h-px w-full md:w-px md:h-12 bg-slate-100"></div>
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">{cursos?.length || 0}</h2>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Cursos activos</p>
        </div>
        <a href="/dashboard/asistencia" className="w-full md:w-auto bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
          Pasar Asistencia
        </a>
      </div>
    </div>
  );
}