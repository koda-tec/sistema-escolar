'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const linkStyle = "flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-bold "

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) return router.push('/login')
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, schools(name, logo_url)')
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

  const brandName = profile?.schools?.name || "KodaEd"

  const getLinkStyle = (path: string) => {
    const isActive = pathname === path
    return `${linkStyle} ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 scale-[1.02]' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
    }`
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Cargando Panel</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-900 overflow-x-hidden">
      
      {/* NAVBAR MÓVIL - Optimizado para iPhone (Safe Areas) */}
      <header className="md:hidden bg-slate-950 text-white px-4 pb-4 pt-[env(safe-area-inset-top,1rem)] flex justify-between items-center sticky top-0 z-50 shadow-2xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-linear-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-900/20">K</div>
          <h2 className="font-black tracking-tighter uppercase text-[10px] leading-tight truncate max-w-180px">
            <span className="text-blue-500 block">Institución</span>
            {brandName}
          </h2>
        </div>
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="w-11 h-11 flex items-center justify-center bg-slate-900 border border-white/10 rounded-2xl text-white active:scale-90 transition-all shadow-inner"
        >
          {isSidebarOpen ? <span className="text-xl">✕</span> : <span className="text-xl">☰</span>}
        </button>
      </header>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-950 text-white transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        md:translate-x-0 md:static md:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full border-r border-white/5">
          
          {/* Logo Area Desktop */}
          <div className="p-8 hidden md:block">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-900/40">K</div>
              <div>
                <h1 className="text-lg font-black tracking-tighter leading-none italic">Koda<span className="text-blue-500">Ed</span></h1>
                <p className="text-[9px] font-bold text-slate-500 tracking-[0.3em] uppercase mt-1">Management</p>
              </div>
            </div>
            
            <div className="p-4 bg-white/0.03 rounded-1.5rem border border-white/5 backdrop-blur-sm">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 opacity-80">SaaS Node</p>
                <p className="text-sm font-bold text-slate-200 truncate leading-tight">{brandName}</p>
            </div>
          </div>

          {/* Navegación Principal */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar pt-6 md:pt-0">
            <Link onClick={() => setSidebarOpen(false)} href="/dashboard" className={getLinkStyle('/dashboard')}>
              <span className="text-lg">🏠</span> Inicio
            </Link>
            
            {profile?.role === 'admin_koda' && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-[0.2em]">SaaS Master</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin-koda" className={getLinkStyle('/dashboard/admin-koda')}>
                  <span className="text-lg">🏢</span> Gestión Escuelas
                </Link>
              </>
            )}

            {profile?.role === 'directivo' && profile?.school_id && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-[0.2em]">Dirección</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/cursos" className={getLinkStyle('/dashboard/admin/cursos')}><span>🏫</span> Gestión Cursos</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/personal" className={getLinkStyle('/dashboard/admin/personal')}><span>👨‍🏫</span> Gestión Personal</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/estadisticas" className={getLinkStyle('/dashboard/admin/estadisticas')}><span>📊</span> Estadísticas</Link>
              </>
            )}

            {profile?.role === 'preceptor' && profile?.school_id && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-[0.2em]">Operación</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/asistencia" className={getLinkStyle('/dashboard/asistencia')}><span>📝</span> Tomar Asistencia</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/alumnos" className={getLinkStyle('/dashboard/admin/alumnos')}><span>👥</span> Gestión Alumnos</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/preceptor/libretas" className={getLinkStyle('/dashboard/preceptor/libretas')}><span>📄</span> Carga de Libretas</Link>
              </>
            )}

            {profile?.role === 'docente' && profile?.school_id && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-[0.2em]">Aula</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/docente/materias" className={getLinkStyle('/dashboard/docente/materias')}><span>📓</span> Mis Materias</Link>
              </>
            )}

            {profile?.role === 'padre' && profile?.school_id && (
              <>
                 <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-[0.2em]">Familia</div>
                 <Link onClick={() => setSidebarOpen(false)} href="/dashboard/hijos" className={getLinkStyle('/dashboard/hijos')}><span>👨‍🎓</span> Mis Hijos</Link>
              </>
            )}

            {profile?.school_id && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-[0.2em]">Social</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/comunicados" className={getLinkStyle('/dashboard/comunicados')}><span>📩</span> Comunicados</Link>
              </>
            )}
          </nav>

          {/* User Section - Mejorado para iOS Home Indicator */}
          <div className="p-4 mt-auto mb-[env(safe-area-inset-bottom,0px)]">
            <div className="bg-white/0.03 rounded-2rem p-4 border border-white/5 shadow-inner">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center font-black text-blue-500 uppercase shadow-lg">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-bold truncate text-slate-100">{profile?.full_name || 'Usuario'}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{profile?.role}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🚪</span> CERRAR SESIÓN
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* OVERLAY MÓVIL */}
      {isSidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-30 md:hidden transition-all duration-500 ease-in-out"
        ></div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-10 lg:p-12 overflow-x-hidden min-h-screen">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
          {children}
        </div>
      </main>
    </div>
  )
}