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

      // Control de cambio de contraseña para preceptor, docente, directivo y padre
      const rol = profileData?.role?.toLowerCase().trim()
      const debeCambiarPassword = ['preceptor', 'docente', 'directivo', 'padre'].includes(rol)
      const isChangingPassPage = pathname.startsWith('/dashboard/perfil/cambiar-password')
      
      if (profileData?.must_change_password && debeCambiarPassword && !isChangingPassPage) {
        router.push('/dashboard/perfil/cambiar-password')
      }
    }
    getData()
  }, [router, supabase, pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // NORMALIZACIÓN DE VARIABLES
  const userRole = profile?.role?.toLowerCase().trim() || ''
  const isPaid = profile?.subscription_active === true
  const hasSchool = !!profile?.school_id
  const brandName = profile?.schools?.name || "KodaEd"
  
  const mustChangePassword = profile?.must_change_password && ['preceptor', 'docente', 'directivo', 'padre'].includes(userRole)

  const getLinkStyle = (path: string, isLocked: boolean = false) => {
    const isActive = pathname === path
    return `${linkStyle} ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 opacity-100 scale-[1.02]' 
        : isLocked
          ? 'text-slate-600 opacity-60 italic' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
    }`
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  )

  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="max-w-md w-full">{children}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-900 overflow-x-hidden">
      
      {/* NAVBAR MÓVIL (HEADER) */}
      <header className="md:hidden bg-slate-950 text-white px-4 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] flex justify-between items-center sticky top-0 z-60 border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg">K</div>
          <div className="flex flex-col text-left">
            <span className="text-blue-500 font-black text-[9px] uppercase tracking-widest leading-none">Institución</span>
            <h2 className="font-black tracking-tighter uppercase text-[11px] truncate max-w-150px leading-tight">
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
          
          {/* Logo Desktop */}
          <div className="p-8 hidden md:block text-left">
            <div className="flex items-center gap-3 mb-6 font-black text-xl tracking-tighter uppercase italic text-white">
               Koda<span className="text-blue-600 font-black">Ed</span>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 text-left">SaaS Node</p>
                <p className="text-sm font-bold text-slate-200 truncate text-left">{brandName}</p>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto pt-28 md:pt-0 custom-scrollbar text-left">
            
            <Link onClick={() => setSidebarOpen(false)} href="/dashboard" className={getLinkStyle('/dashboard')}>
              <span className="flex items-center gap-3"><span>🏠</span> Inicio</span>
            </Link>
            
            {/* ADMIN KODA */}
            {userRole === 'admin_koda' && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-widest">SaaS Master</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin-koda" className={getLinkStyle('/dashboard/admin-koda')}>
                   <span>🏢</span> Gestión Escuelas
                </Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin-koda/usuarios-por-escuela" className={getLinkStyle('/dashboard/admin-koda/usuarios-por-escuela')}>
                   <span>👥</span> Creación de Directivo
                </Link>
              </>
            )}

            {/* DIRECTIVO */}
            {userRole === 'directivo' && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-widest">Dirección</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/cursos" className={getLinkStyle('/dashboard/admin/cursos')}><span>🏫</span> Gestión Cursos</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/personal" className={getLinkStyle('/dashboard/admin/personal')}><span>👨‍🏫</span> Gestión Personal</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/estadisticas" className={getLinkStyle('/dashboard/admin/estadisticas')}><span>📊</span> Estadísticas</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/alumnos/promocion" className={getLinkStyle('/dashboard/admin/alumnos/promocion')}><span>🚀</span> Promoción Ciclo</Link>
              </>
            )}

            {/* PRECEPTOR */}
            {userRole === 'preceptor' && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-widest">Operación</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/asistencia" className={getLinkStyle('/dashboard/asistencia')}><span>📝</span> Tomar Asistencia</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/alumnos" className={getLinkStyle('/dashboard/admin/alumnos')}><span>👥</span> Gestión Alumnos</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/preceptor/libretas" className={getLinkStyle('/dashboard/preceptor/libretas')}><span>📄</span> Carga de Libretas</Link>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/admin/alumnos/promocion" className={getLinkStyle('/dashboard/admin/alumnos/promocion')}><span>🚀</span> Promoción Ciclo</Link>
              </>
            )}

            {/* DOCENTE */}
            {userRole === 'docente' && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-widest">Aula</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/docente/materias" className={getLinkStyle('/dashboard/docente/materias')}><span>📓</span> Mis Materias</Link>
              </>
            )}

            {/* PADRE */}
            {userRole === 'padre' && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-widest flex justify-between items-center">
                   Familia {!isPaid && <span className="text-amber-500 text-[8px]">LIMITADO</span>}
                </div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/hijos" className={getLinkStyle('/dashboard/hijos', !isPaid)}>
                   <span className="flex items-center justify-between w-full">
                     <span className="flex items-center gap-3"><span>👨‍🎓</span> Mis Hijos</span>
                     {!isPaid && <span className="text-xs">🔒</span>}
                   </span>
                </Link>
              </>
            )}

            {/* COMUNICADOS (Para todos los que tengan un rol asignado) */}
            {(hasSchool || userRole === 'padre' || userRole === 'admin_koda') && (
              <>
                <div className="pt-6 pb-2 text-[10px] uppercase text-slate-600 font-black px-4 tracking-widest">Social</div>
                <Link onClick={() => setSidebarOpen(false)} href="/dashboard/comunicados" className={getLinkStyle('/dashboard/comunicados', userRole === 'padre' && !isPaid)}>
                   <span className="flex items-center justify-between w-full">
                     <span className="flex items-center gap-3"><span>📩</span> Comunicados</span>
                     {userRole === 'padre' && !isPaid && <span className="text-xs">🔒</span>}
                   </span>
                </Link>
              </>
            )}
          </nav>

          {/* User Profile Area */}
          <div className="p-4 mt-auto mb-[env(safe-area-inset-bottom,1.5rem)] text-left">
            <div className="bg-white/5 rounded-2rem p-4 border border-white/5 shadow-inner">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-blue-500 border border-white/10 uppercase">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-bold truncate text-white leading-tight">{profile?.full_name || 'Usuario'}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-left">
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