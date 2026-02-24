'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useToast } from '@/app/components/Toast'

export default function DetalleComunicado({ params }: { params: { id: string } }) {
  const { id } = params
  const [comunicado, setComunicado] = useState<any>(null)
  const [readInfo, setReadInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    const fetchAndMarkRead = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        showToast('No se encontró el usuario', 'error')
        setLoading(false)
        return
      }

      const { data: comm, error: commError } = await supabase
        .from('communications')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .single()

      if (commError) {
        showToast('Error cargando comunicado', 'error')
        setLoading(false)
        return
      }
      setComunicado(comm)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'padre') {
        const { data: existingRead } = await supabase
          .from('communication_reads')
          .select('*')
          .eq('communication_id', id)
          .eq('parent_id', user.id)
          .maybeSingle()

        if (!existingRead) {
          await supabase.from('communication_reads').insert({
            communication_id: id,
            parent_id: user.id,
            read_at: new Date().toISOString()
          })
          setReadInfo({ read_at: new Date().toISOString() })
        } else {
          setReadInfo(existingRead)
        }
      }
      setLoading(false)
    }
    fetchAndMarkRead()
  }, [id, supabase, showToast])

  const handleConfirm = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast('No se encontró el usuario', 'error')
      return
    }

    const { error } = await supabase
      .from('communication_reads')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('communication_id', id)
      .eq('parent_id', user.id)

    if (!error) {
      showToast("Comunicado confirmado", "success")
      window.location.reload()
    } else {
      showToast("Error al confirmar", "error")
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse">Cargando comunicado...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <nav className="text-xs font-bold text-blue-600 uppercase tracking-widest">
        <a href="/dashboard/comunicados">← Volver</a>
      </nav>

      <article className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <header className="mb-8 border-b pb-6">
          <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">{comunicado.title}</h1>
          <p className="text-sm text-slate-500 font-medium italic">
            Publicado por: {comunicado.profiles?.full_name} • {new Date(comunicado.created_at).toLocaleString()}
          </p>
        </header>

        <div className="text-slate-800 leading-relaxed whitespace-pre-wrap">
          {comunicado.content}
        </div>

        {comunicado.require_confirmation && (
          <div className="mt-12 p-8 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col items-center text-center">
            <h4 className="font-bold text-blue-900 mb-2">Confirmación de Notificación</h4>
            <p className="text-sm text-blue-700 mb-6">Este comunicado requiere que confirmes que has recibido y entendido la información.</p>
            
            {readInfo?.confirmed_at ? (
              <div className="bg-green-100 text-green-700 px-6 py-2 rounded-full font-bold text-sm">
                ✅ Confirmado el {new Date(readInfo.confirmed_at).toLocaleString()}
              </div>
            ) : (
              <button onClick={handleConfirm} className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                Confirmar Lectura
              </button>
            )}
          </div>
        )}
      </article>
    </div>
  )
}