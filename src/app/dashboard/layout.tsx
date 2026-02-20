import { createClient } from '@/app/utils/supabase/server' // Revisa que esta ruta sea exacta
import { redirect } from 'next/navigation'
import Link from 'next/link'
export const dynamic = 'force-dynamic' 

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // Usamos maybeSingle para evitar el error de "0 filas"
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle()

    return (
      <div className="flex min-h-screen bg-gray-100 font-sans">
        <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
          <div className="p-6 border-b border-slate-800 font-bold text-xl text-blue-400">
            KUADERNO
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/dashboard" className="block p-3 hover:bg-slate-800 rounded-lg transition">🏠 Inicio</Link>
            
            {profile?.role === 'padre' && (
               <Link href="/dashboard/hijos" className="block p-3 hover:bg-slate-800 rounded-lg transition">👨‍🎓 Mis Hijos</Link>
            )}
            
            {!profile && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-xs">
                Perfil no configurado en la DB
              </div>
            )}
          </nav>
          <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
            {user.email}
          </div>
        </aside>

        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    )
  } catch (e) {
    console.error(e)
    return <div className="p-20 text-red-500 font-bold">Error crítico en el Dashboard. Revisa la consola del servidor.</div>
  }
}