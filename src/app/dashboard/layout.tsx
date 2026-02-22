'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const linkStyle = "flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-bold w-full "

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

  // Normalización para comparaciones seguras
  const userRole = profile?.role?.toLowerCase().trim() || ''
  const hasSchool = !!profile?.school_id
  const brandName = profile?.schools?.name || "KodaEd"

  const getLinkStyle = (path: string) => {
    const isActive = pathname === path
    return `${linkStyle} ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 opacity-100 scale-[1.02]' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
    }`
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-900 overflow-x-hidden">
      
      {/* NAVBAR MÓVIL (HEADER SUPERIOR) */}
      <header className="md:hidden bg-slate-950 text-white px-4 pb-4 pt-[env(safe-area-inset-top,1.2rem)] flex justify-between items-center sticky top-0 z-60 border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg">K</div>
          <div className="flex flex-col">
            <span className="text-blue-500 font-black text-[9px] uppercase tracking-widest leading-none">Institución</span>
            <h2 className="font-black tracking-tighter uppercase text-[11px] truncate max-w-160px leading-tight">
              {brandName}
            </h2>
          </div>
        </div>
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="w-11 h-11 flex items-center justify-center bg-slate-900 border border-white/10 rounded-2xl text-white active:scale-90 transition-all"
        >
          {isSidebarOpen ? <span>✕</span> : <span>☰</span>}
        </button>
      </header>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white transform transition-transform duration-500
        md:translate-x-0 md:static md:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full border-r border-white/5">
          
          <div className="p-8 hidden md:block">
            <div className="flex items-center gap-3 mb-6 font-black text-xl tracking-tighter uppercase italic text-white text-left">
               Koda<span className="text-blue-600 font-black">Ed</span>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 text-left">SaaS Node</p>
                <p className="text-sm font-bold text-slate-200 truncate text-left">{brandName}</p>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto pt-28 md:pt-0 custom-scrollbar">
            
            <Link onClick={() => setSidebarOpen(false)} href="/dashboard" className={getLinkStyle('/dashboard')}>
              <span className="flex items-center gap-3"><span>🏠</span> Inicio</span>
            </Link>
            
            {/* 1. ADMIN KODA */}
            {userRole === 'admin_koda' && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-widest text-left">SaaS Master</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin-koda" className={getLinkStyle('/dashboard/admin-koda')}>
                   <span>🏢</span> Gestión Escuelas
                </Link>
              </>
            )}

            {/* 2. DIRECTIVO (Administración Escolar) */}
            {userRole === 'directivo' && hasSchool && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-widest text-left">Dirección</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/cursos" className={getLinkStyle('/dashboard/admin/cursos')}><span>🏫</span> Gestión Cursos</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/personal" className={getLinkStyle('/dashboard/admin/personal')}><span>👨‍🏫</span> Gestión Personal</Link>
                {/* REINSTALADO: Link de Estadísticas */}
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/estadisticas" className={getLinkStyle('/dashboard/admin/estadisticas')}><span>📊</span> Estadísticas</Link>
              </>
            )}

            {/* 3. PRECEPTOR (Operación) */}
            {userRole === 'preceptor' && hasSchool && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-widest text-left">Operación</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/asistencia" className={getLinkStyle('/dashboard/asistencia')}><span>📝</span> Tomar Asistencia</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/alumnos" className={getLinkStyle('/dashboard/admin/alumnos')}><span>👥</span> Gestión Alumnos</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/preceptor/libretas" className={getLinkStyle('/dashboard/preceptor/libretas')}><span>📄</span> Carga de Libretas</Link>
              </>
            )}

            {/* 4. DOCENTE */}
            {userRole === 'docente' && hasSchool && (
                <>
                  <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-widest text-left">Aula</div>
                  <Link onClick={() => setSidebarOpen(false)} href="/dashboard/docente/materias" className={getLinkStyle('/dashboard/docente/materias')}><span>📓</span> Mis Materias</Link>
                </>
            )}

            {/* 5. PADRE */}
            {userRole === 'padre' && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-widest text-left">Familia</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/hijos" className={getLinkStyle('/dashboard/hijos')}>
                   <span className="flex items-center gap-3"><span>👨‍🎓</span> Mis Hijos</span>
                </Link>
              </>
            )}

            {/* SOCIAL (Comunicados) */}
            <Link onClick={() => setSidebarOpen(false)} href="/dashboard/comunicados" className={getLinkStyle('/dashboard/comunicados')}>
                <span className="flex items-center gap-3"><span>📩</span> Comunicados</span>
            </Link>
          </nav>

          {/* Footer Sidebar */}
          <div className="p-4 mt-auto mb-[env(safe-area-inset-bottom,1.5rem)]">
            <div className="bg-white/5 rounded-2rem p-4 border border-white/5 shadow-inner text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-blue-500 border border-white/10 uppercase">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-bold truncate text-white leading-tight">{profile?.full_name || 'Usuario'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{profile?.role}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 active:scale-95 transition-all"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* OVERLAY */}
      {isSidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-all duration-500"></div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-10 lg:p-12 overflow-x-hidden min-h-screen">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {children}
        </div>
      </main>
    </div>
  )
}