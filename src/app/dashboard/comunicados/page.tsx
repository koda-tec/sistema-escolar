'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'
import PaywallGate from '@/app/components/PaywallGate'

export default function ComunicadosPage() {
  const [comunicados, setComunicados] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 1. Obtener perfil
      const { data: profData } = await supabase
        .from('profiles')
        .select('role, subscription_active, school_id')
        .eq('id', user?.id)
        .maybeSingle()
      
      setProfile(profData)

      // 2. Solo cargar comunicados si pagó o si es personal de la escuela
      if (profData && (profData.role !== 'padre' || profData.subscription_active)) {
          const { data } = await supabase
            .from('communications')
            .select(`*, profiles(full_name)`)
            .eq('school_id', profData.school_id)
            .order('created_at', { ascending: false })
          
          setComunicados(data || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">
      Cargando avisos...
    </div>
  )

  // --- MURO DE PAGO (PAYWALL) ---
  if (profile?.role === 'padre' && !profile?.subscription_active) {
    return <PaywallGate />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
  <div>
    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Comunicados</h1>
    <p className="text-slate-500 font-medium">Canal oficial de la institución.</p>
  </div>
  
  {/* Botón para STAFF */}
  {['directivo', 'docente', 'preceptor', 'admin_koda'].includes(profile?.role) && (
    <Link href="/dashboard/comunicados/nuevo" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">
      + Emitir Comunicado
    </Link>
  )}

  {profile?.role === 'preceptor' && (
  <div className="mt-12 space-y-6">
    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">🔔 Notas recibidas de padres</h2>
    {/* Aquí harías un fetch a la tabla 'parent_requests' filtrando por los alumnos de los cursos del preceptor */}
    <div className="bg-amber-50 p-6 rounded-2rem border border-amber-100 text-sm text-amber-800 font-medium italic">
      Sección de mensajes entrantes en desarrollo...
    </div>
  </div>
)}

  {/* Botón para PADRES */}
  {profile?.role === 'padre' && (
    <Link href="/dashboard/comunicados/solicitud" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-black transition-all">
      ✉️ Enviar Nota a Preceptoría
    </Link>
  )}
</header>

      <div className="grid grid-cols-1 gap-4">
        {comunicados.map((c) => (
          <Link 
            key={c.id} 
            href={`/dashboard/comunicados/${c.id}`}
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all group flex justify-between items-center"
          >
            <div className="space-y-1 text-left">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {c.title}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {new Date(c.created_at).toLocaleDateString()} • {c.profiles?.full_name || 'Institucional'}
              </p>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-blue-500 opacity-0 group-hover:opacity-100 transition-all uppercase">Leer más</span>
               <span className="text-slate-300 group-hover:text-blue-600 transition-all transform group-hover:translate-x-1">➜</span>
            </div>
          </Link>
        ))}

        {comunicados.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold italic">No hay comunicados publicados.</p>
          </div>
        )}
      </div>
    </div>
  )
}
