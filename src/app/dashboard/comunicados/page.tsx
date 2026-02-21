'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import Link from 'next/link'

export default function ComunicadosPage() {
  const [comunicados, setComunicados] = useState<any[]>([])
  const [role, setRole] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('role, school_id').eq('id', user?.id).maybeSingle()
      setRole(profile?.role || '')

      const { data } = await supabase
        .from('communications')
        .select(`*, profiles(full_name)`)
        .eq('school_id', profile?.school_id)
        .order('created_at', { ascending: false })
      
      setComunicados(data || [])
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Comunicados</h1>
          <p className="text-slate-600">Mensajes oficiales de la institución.</p>
        </div>
        
        {['directivo', 'docente', 'preceptor', 'admin_koda'].includes(role) && (
          <Link href="/dashboard/comunicados/nuevo" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            + Nuevo Comunicado
          </Link>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4">
        {comunicados.map((c) => (
          <Link 
            key={c.id} 
            href={`/dashboard/comunicados/${c.id}`}
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all group flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{c.title}</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
                Por: {c.profiles?.full_name} • {new Date(c.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {c.require_confirmation && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                  Requiere Firma
                </span>
              )}
              <span className="text-slate-300 group-hover:text-blue-600 transition-colors">➜</span>
            </div>
          </Link>
        ))}

        {comunicados.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No hay comunicados para mostrar.</p>
          </div>
        )}
      </div>
    </div>
  )
}