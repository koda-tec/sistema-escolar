'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      // 1. Obtener el usuario de la sesión
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return router.push('/login')
      }
      
      setUser(user)

      // 2. Obtener perfil y datos de la escuela vinculada (Lógica SaaS)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          schools (
            name,
            logo_url
          )
        `)
        .eq('id', user.id)
        .maybeSingle()

      setProfile(profileData)
      setLoading(false)
    }

    getData()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Nombre dinámico según la escuela o nombre del sistema
  const brandName = profile?.schools?.name || "KUADERNO"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col md:flex-row">
      
      {/* NAVBAR MÓVIL */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-[10px] font-black">K</div>
          <h2 className="font-bold tracking-tighter text-blue-400 uppercase text-sm truncate max-w-150px">
            {brandName}
          </h2>
        </div>
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-800 rounded-lg text-white active:scale-95 transition-transform"
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full shadow-2xl">
          {/* Logo / Brand Area */}
          <div className="p-6 border-b border-slate-800 hidden md:block">
            <h2 className="text-xl font-black tracking-tighter text-blue-500 uppercase">
              {brandName}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1">SISTEMA INTEGRAL</p>
          </div>

          {/* Navegación por Roles */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <Link 
              onClick={() => setSidebarOpen(false)} 
              href="/dashboard" 
              className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-all text-sm font-medium text-slate-300 hover:text-white"
            >
              <span>🏠</span> Inicio
            </Link>
            
            {/* Si NO tiene escuela vinculada (Estado Pendiente SaaS) */}
            {!profile?.school_id && (
               <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                 <p className="text-[10px] text-amber-500 font-bold uppercase mb-1">Estado</p>
                 <p className="text-xs text-amber-200/70 leading-tight">Esperando vinculación con institución...</p>
               </div>
            )}

            {/* Links para PADRES */}
            {profile?.role === 'padre' && profile?.school_id && (
              <Link onClick={() => setSidebarOpen(false)} href="/dashboard/hijos" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-all text-sm">
                <span>👨‍🎓</span> Mis Hijos
              </Link>
            )}

            {/* Links para PRECEPTORES */}
            {(profile?.role === 'preceptor' || profile?.role === 'directivo') && profile?.school_id && (
              <Link onClick={() => setSidebarOpen(false)} href="/dashboard/asistencia" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-all text-sm">
                <span>📝</span> Tomar Asistencia
              </Link>
            )}

            {/* Link para COMUNICADOS (Común a todos con escuela) */}
            {profile?.school_id && (
              <Link onClick={() => setSidebarOpen(false)} href="/dashboard/comunicados" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-all text-sm">
                <span>📩</span> Comunicados
              </Link>
            )}
          </nav>

          {/* User Profile Area */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/30">
            <div className="mb-4 px-2">
              <p className="text-sm font-bold truncate text-slate-200">
                {profile?.full_name || user?.email?.split('@')[0]}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-black">
                  {profile?.role || 'USUARIO'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="w-full py-2.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all font-bold flex items-center justify-center gap-2"
            >
              <span>🚪</span> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* OVERLAY PARA MÓVIL */}
      {isSidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
        ></div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-10 overflow-x-hidden min-h-screen">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  )
}