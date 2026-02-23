// src/components/dashboards/DashboardDocente.tsx
import { createClient } from "@/app/utils/supabase/server";

export default async function DashboardDocente({ profile }: { profile: any }) {
  const supabase = await createClient();
  const { data: materias } = await supabase.from('profesor_materia').select('id, materias(name), courses(name, section)').eq('profesor_id', profile.id);
  const { count: sentComm } = await supabase.from('communications').select('*', { count: 'exact', head: true }).eq('sender_id', profile.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px]"></div>
          <h2 className="text-3xl font-black tracking-tighter mb-2">Resumen Académico</h2>
          <p className="text-slate-400 font-medium mb-8">Tenés {materias?.length || 0} materias activas en este ciclo.</p>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Materias</p>
                <p className="text-2xl font-black">{materias?.length || 0}</p>
             </div>
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Avisos Enviados</p>
                <p className="text-2xl font-black">{sentComm || 0}</p>
             </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Mis Clases</h3>
        <div className="space-y-3">
          {materias?.map((m: any) => (
            <div key={m.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">{(m.materias as any)?.name}</span>
              <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded-lg">{(m.courses as any)?.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}