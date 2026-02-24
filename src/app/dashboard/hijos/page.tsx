'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useToast } from '@/app/components/Toast'
import Link from 'next/link'
import PaywallGate from '@/app/components/PaywallGate'

export default function MisHijosPage() {
  const [hijos, setHijos] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null) 
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  
  const { showToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setUserEmail(user.email ?? null)
        
        // 1. OBTENER EL PERFIL (Fundamental para el Paywall)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, subscription_active')
          .eq('id', user?.id)
          .maybeSingle()

        if (profileError) throw profileError
        setProfile(profileData)

        // 2. SOLO CARGAR HIJOS SI PAGÓ O SI ES PERSONAL (Directivo/Preceptor)
        const isPaidParent = profileData?.role === 'padre' && profileData?.subscription_active;
        const isStaff = ['directivo', 'preceptor', 'admin_koda', 'docente'].includes(profileData?.role?.toLowerCase());

        if (isPaidParent || isStaff) {
          const { data, error } = await supabase
            .from('students')
            .select(`
              id,
              full_name,
              dni,
              courses (name, section),
              schools (name)
            `)
            .eq('parent_id', user?.id)

          if (error) throw error
          setHijos(data || [])
        }
      } catch (err: any) {
        console.error('Error:', err.message)
        showToast('No se pudieron cargar los datos', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, showToast])

  // 1. ESTADO DE CARGA
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Verificando acceso...</p>
      </div>
    )
  }

  // 2. MURO DE PAGO (Si es padre y no tiene suscripción activa)
  const isPaid = profile?.subscription_active === true;
  if (profile?.role === 'padre' && !isPaid) {
    return <PaywallGate />; 
  }

  // 3. VISTA NORMAL (Si pagó o es personal de la escuela)
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight text-left">Mis Hijos</h1>
        <p className="text-slate-500 font-medium text-left">Seguimiento académico y asistencia en tiempo real.</p>
      </header>

      {hijos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hijos.map((hijo) => (
            <div key={hijo.id} className="bg-white rounded-2rem border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:bg-blue-600 transition-colors duration-500">
                    <span className="group-hover:scale-110 transition-transform">🎓</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                    Alumno Regular
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors notranslate text-left">
                  {hijo.full_name}
                </h3>
                <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-tight text-left">
                  {hijo.schools?.name}
                </p>

                <div className="grid grid-cols-2 gap-4 py-5 my-6 border-y border-slate-50 text-left">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Curso</p>
                    <p className="text-sm font-bold text-slate-800">
                      {hijo.courses?.name} "{hijo.courses?.section}"
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DNI</p>
                    <p className="text-sm font-bold text-slate-800">{hijo.dni}</p>
                  </div>
                </div>

                <Link 
                  href={`/dashboard/hijos/${hijo.id}`}
                  className="mt-2 w-full bg-slate-950 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                  Ver Asistencia y Notas 📊
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ESTADO VACÍO: Cuando no hay alumnos vinculados */
        <div className="bg-white p-10 md:p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center space-y-6">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-5xl shadow-inner border border-slate-100">
            🔍
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No tienes alumnos vinculados</h2>
            <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
              Para visualizar la información escolar, la institución debe asociar tu cuenta de correo electrónico con el legajo del estudiante.
            </p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 max-w-sm mx-auto">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 text-center">Tu Email de Acceso</p>
            <p className="text-sm font-bold text-slate-700 break-all text-center">{userEmail}</p>
            <p className="text-[10px] text-slate-400 mt-3 italic text-center">Proporcione este email en secretaría o preceptoría.</p>
          </div>
        </div>
      )}
    </div>
  )
}