// src/components/dashboards/DashboardAdminKoda.tsx
import { createClient } from "@/app/utils/supabase/server";

export default async function DashboardAdminKoda() {
  const supabase = await createClient();

  // Traer métricas globales del sistema
  const [escuelas, usuarios] = await Promise.all([
    supabase.from('schools').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card Escuelas */}
        <div className="bg-linear-to-br from-blue-600 to-blue-800 p-12 rounded-[3rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-4xl">🏢</span>
              <p className="text-xs font-black uppercase tracking-[0.3em] opacity-80">Red de Instituciones</p>
            </div>
            <p className="text-8xl font-black tracking-tighter mb-2">{escuelas.count || 0}</p>
            <p className="text-blue-100 font-bold text-lg">Escuelas operando en KodaEd</p>
          </div>
        </div>

        {/* Card Usuarios */}
        <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-slate-100 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-4xl">👥</span>
              <p className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">Comunidad Global</p>
            </div>
            <p className="text-8xl font-black text-slate-900 tracking-tighter mb-2">{usuarios.count || 0}</p>
            <p className="font-bold text-lg text-slate-400">Usuarios registrados totales</p>
          </div>
        </div>

      </div>

      {/* Info Técnica SaaS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 p-6 rounded-2rem border border-slate-100 flex items-center gap-4">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-xl">🚀</div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Estado del Sistema</p>
              <p className="text-sm font-bold text-green-600">Operativo (100%)</p>
           </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-2rem border border-slate-100 flex items-center gap-4">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-xl">🛡️</div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Seguridad RLS</p>
              <p className="text-sm font-bold text-blue-600">Activa y Monitoreada</p>
           </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-2rem border border-slate-100 flex items-center gap-4">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-xl">☁️</div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Infraestructura</p>
              <p className="text-sm font-bold text-indigo-600">SaaS Multi-tenant</p>
           </div>
        </div>
      </div>
    </div>
  );
}