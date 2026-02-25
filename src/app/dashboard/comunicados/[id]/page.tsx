'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useToast } from '@/app/components/Toast'
import Link from 'next/link'

interface DetalleComunicadoProps {
  params: Promise<{ id: string }>
}

export default function DetalleComunicado({ params }: DetalleComunicadoProps) {
  const { id } = use(params)
  
  const [comunicado, setComunicado] = useState<any>(null)
  const [readInfo, setReadInfo] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [confirmaciones, setConfirmaciones] = useState<any[]>([]) // Para trazabilidad (Staff)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    const fetchAndMarkRead = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // 1. Cargar el comunicado
        const { data: comm, error: commError } = await supabase
          .from('communications')
          .select('*, profiles(full_name)')
          .eq('id', id)
          .single()

        if (commError) throw commError
        setComunicado(comm)

        // 2. Obtener el perfil del usuario actual
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, id, subscription_active')
          .eq('id', user.id)
          .single()

        setProfile(profileData)
        const userRole = profileData?.role?.toLowerCase()

        // 3. Lógica para PADRES (Marcar lectura)
        if (userRole === 'padre') {
          const { data: existingRead } = await supabase
            .from('communication_reads')
            .select('*')
            .eq('communication_id', id)
            .eq('parent_id', user.id)
            .maybeSingle()

          if (!existingRead) {
            const { data: newRead } = await supabase.from('communication_reads').insert({
              communication_id: id,
              parent_id: user.id,
              read_at: new Date().toISOString()
            }).select().single()
            setReadInfo(newRead)
          } else {
            setReadInfo(existingRead)
          }
        }

        // 4. Lógica para STAFF (Ver quién leyó)
        if (['directivo', 'preceptor', 'admin_koda', 'docente'].includes(userRole)) {
          const { data: listado } = await supabase
            .from('communication_reads')
            .select(`
              read_at,
              confirmed_at,
              profiles:parent_id (full_name)
            `)
            .eq('communication_id', id)
          
          setConfirmaciones(listado || [])
        }

      } catch (err: any) {
        console.error(err)
        showToast('Error al cargar el comunicado', 'error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAndMarkRead()
  }, [id, supabase, showToast])

  const handleConfirm = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('communication_reads')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('communication_id', id)
      .eq('parent_id', user.id)

    if (!error) {
      showToast("Lectura confirmada", "success")
      setReadInfo((prev: any) => ({ ...prev, confirmed_at: new Date().toISOString() }))
    } else {
      showToast("Error al confirmar", "error")
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Abriendo Canal Seguro</p>
    </div>
  )

  if (!comunicado) return <div className="p-20 text-center text-slate-500">Comunicado no encontrado.</div>

  const isStaff = ['directivo', 'preceptor', 'admin_koda', 'docente'].includes(profile?.role?.toLowerCase())

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      <nav className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
        <Link href="/dashboard/comunicados" className="hover:opacity-70 transition-all">← Volver a la lista</Link>
      </nav>

      <article className="bg-white p-8 md:p-14 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Badge de importancia */}
        {comunicado.require_confirmation && (
          <div className="absolute top-0 right-0 bg-amber-500 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest">
            Firma requerida
          </div>
        )}

        <header className="mb-10 border-b border-slate-50 pb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight italic leading-tight mb-4 text-left">
            {comunicado.title}
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg shadow-inner">👤</div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900 leading-none">{comunicado.profiles?.full_name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">
                {new Date(comunicado.created_at).toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </header>

        <div className="text-slate-800 leading-relaxed whitespace-pre-wrap text-left font-medium text-lg">
          {comunicado.content}
        </div>

        {/* VISTA PARA PADRES: BOTÓN DE CONFIRMACIÓN */}
        {profile?.role?.toLowerCase() === 'padre' && comunicado.require_confirmation && (
          <div className="mt-14 p-10 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-xl shadow-blue-200 animate-bounce">
              <span className="text-white">✍️</span>
            </div>
            <h4 className="text-xl font-black text-blue-900 mb-2 uppercase tracking-tight">Confirmar Notificación</h4>
            <p className="text-blue-700/70 mb-8 font-medium max-w-sm">Al confirmar, la institución recibirá un aviso legal de que has leído este comunicado.</p>
            
            {readInfo?.confirmed_at ? (
              <div className="bg-white text-green-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-green-200 shadow-sm flex items-center gap-3">
                <span className="text-xl">✅</span> Confirmado el {new Date(readInfo.confirmed_at).toLocaleDateString('es-AR')}
              </div>
            ) : (
              <button 
                onClick={handleConfirm} 
                className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-900/20 active:scale-95"
              >
                Confirmar Lectura Ahora
              </button>
            )}
          </div>
        )}

        {/* VISTA PARA STAFF: TRAZABILIDAD (CONTROL DE LECTURA) */}
        {isStaff && (
          <div className="mt-16 pt-12 border-t border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Control de Recepción</h3>
               <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                 {confirmaciones.length} Lecturas
               </span>
            </div>
            
            <div className="bg-slate-50 rounded-2rem border border-slate-100 overflow-hidden shadow-inner">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-5">Padre / Tutor</th>
                      <th className="p-5">Fecha Visto</th>
                      <th className="p-5 text-center">Confirmó</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {confirmaciones.map((conf, i) => (
                      <tr key={i} className="text-[11px] font-bold text-slate-700">
                        <td className="p-5 notranslate">{(conf.profiles as any)?.full_name}</td>
                        <td className="p-5 font-medium text-slate-400">
                          {conf.read_at ? new Date(conf.read_at).toLocaleString('es-AR') : 'Pendiente'}
                        </td>
                        <td className="p-5 text-center">
                          {conf.confirmed_at ? (
                            <span className="text-green-600 font-black">✅ SÍ</span>
                          ) : (
                            <span className="text-slate-300 font-black">❌ NO</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {confirmaciones.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic text-sm">
                  Ningún padre ha visualizado este mensaje todavía.
                </div>
              )}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}