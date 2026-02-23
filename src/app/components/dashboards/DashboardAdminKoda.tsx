import { createClient } from "@/app/utils/supabase/server";

export default async function DashboardAdminKoda() {
  const supabase = await createClient();
  const { count: totalEscuelas } = await supabase.from('schools').select('*', { count: 'exact', head: true });
  const { count: totalUsuarios } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900">
      <div className="bg-blue-600 p-8 rounded-2rem text-white shadow-xl shadow-blue-200">
        <p className="text-xs font-black uppercase opacity-80 mb-2">Total de Instituciones</p>
        <p className="text-6xl font-black tracking-tighter">{totalEscuelas || 0}</p>
      </div>
      <div className="bg-white p-8 rounded-2rem border border-slate-100 shadow-sm">
        <p className="text-xs font-black uppercase text-slate-400 mb-2">Usuarios en el sistema</p>
        <p className="text-6xl font-black text-slate-900 tracking-tighter">{totalUsuarios || 0}</p>
      </div>
    </div>
  );
}