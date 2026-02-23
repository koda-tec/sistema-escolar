import { createClient } from "@/app/utils/supabase/server";
import InstallPWA from "../components/InstallPWA";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // 1. Obtener perfil con school_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .maybeSingle();

  // 2. Obtener IDs de los hijos (estudiantes vinculados a este padre)
  const { data: hijos } = await supabase
    .from('students')
    .select('id')
    .eq('parent_id', user?.id);

  const idsHijos = hijos?.map(h => h.id) || [];

  // 3. CONSULTAS PARA CONTADORES (En paralelo para mayor velocidad)
  
  // Contador de Comunicados (Avisos de la escuela)
  const { count: totalComunicados } = await supabase
    .from('communications')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', profile?.school_id);

  // Contador de Libretas (Total de PDFs de sus hijos)
  const { count: totalLibretas } = await supabase
    .from('libretas')
    .select('*', { count: 'exact', head: true })
    .in('student_id', idsHijos);

  // Estado de Asistencia hoy (Buscamos si alguno de los hijos tiene inasistencia hoy)
  const hoy = new Date().toISOString().split('T')[0];
  const { data: asistenciaHoy } = await supabase
    .from('attendance')
    .select('status')
    .in('student_id', idsHijos)
    .eq('date', hoy);

  // Lógica para el texto de asistencia
  let estadoAsistencia = "--";
  if (idsHijos.length > 0) {
    if (asistenciaHoy && asistenciaHoy.length > 0) {
      const tieneAusente = asistenciaHoy.some(a => a.status === 'ausente');
      estadoAsistencia = tieneAusente ? "Ausente" : "Presente";
    } else {
      estadoAsistencia = "Pendiente";
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <InstallPWA />
      
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Hola, {profile?.full_name?.split(' ')[0] || 'Bienvenido'} 👋
        </h1>
        <p className="text-slate-500 mt-1 font-medium">
          {profile?.role === 'padre' 
            ? 'Resumen escolar de tus hijos para hoy.' 
            : 'Panel de gestión institucional.'}
        </p>
      </header>

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card: Avisos */}
        <div className="bg-white p-8 rounded-2rem shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            Comunicados
          </span>
          <p className="text-5xl font-black mt-6 text-slate-900">
            {totalComunicados || 0}
          </p>
          <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-tighter">
            Mensajes institucionales
          </p>
        </div>

        {/* Card: Asistencia */}
        <div className="bg-white p-8 rounded-2rem shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            Asistencia
          </span>
          <p className={`text-4xl font-black mt-6 ${estadoAsistencia === 'Ausente' ? 'text-red-500' : 'text-slate-900'}`}>
            {estadoAsistencia}
          </p>
          <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-tighter">
            Estado de hoy
          </p>
        </div>

        {/* Card: Libreta */}
        <div className="bg-white p-8 rounded-2rem shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <span className="text-purple-600 bg-purple-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            Libreta
          </span>
          <p className="text-5xl font-black mt-6 text-slate-900">
            {totalLibretas || 0}
          </p>
          <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-tighter">
            PDFs disponibles
          </p>
        </div>
      </div>

      {/* Sección Informativa Inferior */}
      <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
        
        <div className="relative z-10 space-y-4">
          <h3 className="text-2xl font-black tracking-tight italic">Información Importante</h3>
          <p className="text-blue-100 text-sm max-w-xl font-medium leading-relaxed">
            Recordá que ahora podés descargar las libretas digitales desde la sección de <span className="text-white font-bold underline">"Mis Hijos"</span>. 
            Si notás alguna inasistencia que no corresponde, por favor enviá una comunicación formal o acercate a la preceptoría.
          </p>
        </div>
      </div>
    </div>
  )
}