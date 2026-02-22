import { createClient } from "../utils/supabase/client"
export const dynamic = 'force-dynamic' 
import InstallPWA from "../components/InstallPWA"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Obtenemos los datos del perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  return (
    <div className="space-y-6">
      <InstallPWA />
      <header>
        <h1 className="text-3xl font-bold text-slate-800">
          Hola, {profile?.full_name?.split(' ')[0] || 'Bienvenido'} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          {profile?.role === 'padre' 
            ? 'Aquí tienes el resumen escolar de tus hijos.' 
            : 'Panel de gestión académica institucional.'}
        </p>
      </header>

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-blue-600 bg-blue-50 p-2 rounded-lg text-xs font-bold uppercase">Avisos</span>
          <p className="text-4xl font-black mt-4 text-slate-800">0</p>
          <p className="text-slate-500 text-sm mt-1">Comunicados nuevos hoy</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-green-600 bg-green-50 p-2 rounded-lg text-xs font-bold uppercase">Asistencia</span>
          <p className="text-4xl font-black mt-4 text-slate-800">--</p>
          <p className="text-slate-500 text-sm mt-1">Estado de hoy</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-purple-600 bg-purple-50 p-2 rounded-lg text-xs font-bold uppercase">Libreta</span>
          <p className="text-4xl font-black mt-4 text-slate-800">0</p>
          <p className="text-slate-500 text-sm mt-1">PDFs cargados recientemente</p>
        </div>
      </div>

      {/* Sección Informativa Inferior */}
      <div className="bg-blue-600 rounded-2xl p-8 text-white">
        <h3 className="text-xl font-bold mb-2">Información Importante</h3>
        <p className="text-blue-100 text-sm max-w-xl">
          Recuerda que ahora puedes descargar las libretas digitales desde la sección de "Mis Hijos". 
          Si notas alguna inasistencia que no corresponde, por favor envía una comunicación formal.
        </p>
      </div>
    </div>
  )
}