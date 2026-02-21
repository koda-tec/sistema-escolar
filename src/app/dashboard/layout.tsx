'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const router = useRouter()
  const pathname = usePathname() // Para saber qué link marcar como activo
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

  // Función para estilos de links activos
  const getLinkStyle = (path: string) => {
    const isActive = pathname === path
    return `flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-bold ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* NAVBAR MÓVIL (Sticky) */}
      <header className="md:hidden bg-slate-950 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">K</div>
          <h2 className="font-black tracking-tighter uppercase text-xs truncate max-w-180px">
            {brandName}
          </h2>
        </div>
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-xl text-white active:scale-90 transition-all"
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-950 text-white transform transition-transform duration-300 ease-out
        md:translate-x-0 md:static md:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full border-r border-white/5 shadow-2xl">
          
          {/* Logo Area */}
          <div className="p-8 hidden md:block text-center lg:text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/40">
                K
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter leading-none">Koda<span className="text-blue-500">Ed</span></h1>
                <p className="text-[9px] font-bold text-slate-500 tracking-[0.3em] uppercase mt-1">Software Factory</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Institución</p>
                <p className="text-sm font-bold text-slate-200 truncate">{brandName}</p>
            </div>
          </div>

          {/* Navegación Principal */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            <Link onClick={() => setSidebarOpen(false)} href="/dashboard" className={getLinkStyle('/dashboard')}>
              <span className="text-lg">🏠</span> Inicio
            </Link>
            
            {/* ROL: ADMIN KODA */}
            {profile?.role === 'admin_koda' && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-500 font-black px-3 tracking-[0.2em]">SaaS Master</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin-koda" className={getLinkStyle('/dashboard/admin-koda')}>
                  <span className="text-lg">🏢</span> Gestión Escuelas
                </Link>
              </>
            )}

            {/* ROL: DIRECTIVO */}
            {profile?.role === 'directivo' && profile?.school_id && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-500 font-black px-3 tracking-[0.2em]">Dirección</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/cursos" className={getLinkStyle('/dashboard/admin/cursos')}>
                  <span className="text-lg">🏫</span> Gestión Cursos
                </Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/personal" className={getLinkStyle('/dashboard/admin/personal')}>
                  <span className="text-lg">👨‍🏫</span> Gestión Personal
                </Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/estadisticas" className={getLinkStyle('/dashboard/admin/estadisticas')}>
                  <span className="text-lg">📊</span> Estadísticas
                </Link>
              </>
            )}

            {/* ROL: PRECEPTOR */}
            {profile?.role === 'preceptor' && profile?.school_id && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-500 font-black px-3 tracking-[0.2em]">Operación</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/asistencia" className={getLinkStyle('/dashboard/asistencia')}>
                  <span className="text-lg">📝</span> Tomar Asistencia
                </Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/alumnos" className={getLinkStyle('/dashboard/admin/alumnos')}>
                  <span className="text-lg">👥</span> Gestión Alumnos
                </Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/libretas" className={getLinkStyle('/dashboard/admin/libretas')}>
                  <span className="text-lg">📄</span> Carga de Libretas
                </Link>
              </>
            )}

            {/* ROL: DOCENTE */}
            {profile?.role === 'docente' && profile?.school_id && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-500 font-black px-3 tracking-[0.2em]">Aula</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/docente/materias" className={getLinkStyle('/dashboard/docente/materias')}>
                  <span className="text-lg">📓</span> Mis Materias
                </Link>
              </>
            )}

            {/* ROL: PADRE */}
            {profile?.role === 'padre' && profile?.school_id && (
              <>
                 <div className="pt-6 pb-2 text-[10px] uppercase text-slate-500 font-black px-3 tracking-[0.2em]">Familia</div>
                 <Link onClick={() => setSidebarOpen(false)} href="/dashboard/hijos" className={getLinkStyle('/dashboard/hijos')}>
                    <span className="text-lg">👨‍🎓</span> Mis Hijos
                 </Link>
              </>
            )}

            {/* COMUNICADOS */}
            {profile?.school_id && (
              <Link onClick={() => setSidebarOpen(false)} href="/dashboard/comunicados" className={getLinkStyle('/dashboard/comunicados')}>
                <span className="text-lg">📩</span> Comunicados
              </Link>
            )}
          </nav>

          {/* User Section */}
          <div className="p-4 mt-auto">
            <div className="bg-slate-900/50 rounded-3xl p-4 border border-white/5 shadow-inner">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-blue-500 uppercase">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-bold truncate text-slate-100">{profile?.full_name || 'Usuario'}</p>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{profile?.role}</p>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl text-xs font-black transition-all border border-red-500/20 active:scale-95 flex items-center justify-center gap-2"
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
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-30 md:hidden transition-all duration-500"
        ></div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-10 lg:p-14 overflow-x-hidden min-h-screen">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {children}
        </div>
      </main>
    </div>
  )
}