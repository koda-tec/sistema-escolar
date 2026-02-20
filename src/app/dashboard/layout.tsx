'use client' // Lo convertimos en client component para manejar el menú responsive
import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUser(user)

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      setProfile(data)
    }
    getData()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col md:flex-row">
      
      {/* NAVBAR MÓVIL (Solo se ve en pantallas pequeñas) */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <h2 className="font-bold tracking-tighter text-blue-400">KUADERNO</h2>
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-800 rounded-lg text-white"
        >
          {isSidebarOpen ? '✖' : '☰'}
        </button>
      </header>

      {/* SIDEBAR (Responsive) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-800 hidden md:block">
            <h2 className="text-2xl font-black tracking-tighter text-blue-500">KUADERNO</h2>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Link onClick={() => setSidebarOpen(false)} href="/dashboard" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-all">
              <span>🏠</span> Inicio
            </Link>
            
            {profile?.role === 'padre' && (
              <Link onClick={() => setSidebarOpen(false)} href="/dashboard/hijos" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-all">
                <span>👨‍🎓</span> Mis Hijos
              </Link>
            )}

            {/* Agregamos más links según el rol aquí */}
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-950/50">
            <div className="mb-4 px-2">
              <p className="text-sm font-bold truncate">{profile?.full_name || user?.email}</p>
              <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">{profile?.role}</p>
            </div>
            <button 
              onClick={handleSignOut}
              className="w-full py-2.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all font-bold"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* OVERLAY PARA MÓVIL (Oscurece el fondo cuando el menú está abierto) */}
      {isSidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        ></div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}