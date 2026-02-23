import { createClient } from "@/app/utils/supabase/server";

export default async function DashboardDocente({ profile }: { profile: any }) {
  const supabase = await createClient();

  // 1. Contar materias que dicta este docente
  const { count: totalMaterias } = await supabase
    .from('profesor_materia')
    .select('*', { count: 'exact', head: true })
    .eq('profesor_id', profile.id);

  // 2. Contar comunicados enviados por él
  const { count: totalEnviados } = await supabase
    .from('communications')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', profile.id);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2rem border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Actividad Académica</span>
            <span className="text-2xl">📓</span>
          </div>
          <p className="text-5xl font-black text-slate-900">{totalMaterias || 0}</p>
          <p className="text-slate-400 text-sm font-bold mt-2 uppercase">Materias a cargo</p>
        </div>

        <div className="bg-white p-8 rounded-2rem border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Comunicación</span>
            <span className="text-2xl">📩</span>
          </div>
          <p className="text-5xl font-black text-slate-900">{totalEnviados || 0}</p>
          <p className="text-slate-400 text-sm font-bold mt-2 uppercase">Avisos enviados</p>
        </div>
      </div>

      {/* Sección de accesos rápidos para el docente */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold mb-2">¿Necesitás enviar una novedad?</h3>
          <p className="text-slate-400 text-sm">Podés publicar avisos específicos para tus materias desde la sección de comunicados.</p>
        </div>
        <a href="/dashboard/comunicados/nuevo" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all whitespace-nowrap">
          Redactar Aviso
        </a>
      </div>
    </div>
  );
}