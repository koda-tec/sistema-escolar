import { createClient } from "@/app/utils/supabase/server";
import InstallPWA from "../components/InstallPWA";

// Importamos los componentes de Dashboard por rol (que crearemos abajo)
import DashboardPadre from "../components/dashboards/DashboardPadre";
import DashboardDirectivo from "../components/dashboards/DashboardDirectivo";
import DashboardPreceptor from "../components/dashboards/DashboardPreceptor";
import DashboardAdminKoda from "../components/dashboards/DashboardAdminKoda";
import DashboardDocente from "../components/dashboards/DashboardDocente";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, schools(name)')
    .eq('id', user?.id)
    .maybeSingle();

  if (!profile) return <div className="p-10 text-slate-500 font-bold">Perfil no encontrado.</div>;

  const role = profile.role?.toLowerCase();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <InstallPWA />
      
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Hola, {profile.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 font-medium capitalize">
          Panel de Control — {role} {profile.schools?.name ? `| ${profile.schools.name}` : ''}
        </p>
      </header>

      {/* RENDERIZADO CONDICIONAL POR ROL */}
      {role === 'padre' && <DashboardPadre user={user} profile={profile} />}
      {role === 'directivo' && <DashboardDirectivo profile={profile} />}
      {role === 'preceptor' && <DashboardPreceptor profile={profile} />}
      {role === 'docente' && <DashboardDocente profile={profile} />}
      {role === 'admin_koda' && <DashboardAdminKoda />}

    </div>
  );
}