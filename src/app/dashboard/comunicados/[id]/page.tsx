'use client'

import { useEffect, useState, use } from 'react' // Importamos 'use'
import { createClient } from '@/app/utils/supabase/client'
import { useToast } from '@/app/components/Toast'

// 1. Corregimos la Interface: params debe ser una Promesa
interface DetalleComunicadoProps {
  params: Promise<{ id: string }>
}

export default function DetalleComunicado({ params }: DetalleComunicadoProps) {
  // 2. Usamos el hook 'use' para obtener el id de la promesa
  const { id } = use(params)
  
  const [comunicado, setComunicado] = useState<any>(null)
  const [readInfo, setReadInfo] = useState<any>(null)
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

        // 2. Obtener el rol del usuario
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        // 3. Lógica de lectura para Padres
        if (profile?.role === 'padre') {
          const { data: existingRead } = await supabase
            .from('communication_reads')
            .select('*')
            .eq('communication_id', id)
            .eq('parent_id', user.id)
            .maybeSingle()

          if (!existingRead) {
            // Si no existe el registro de lectura, lo creamos
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
      } catch (err: any) {
        console.error(err)
        showToast('Error cargando el mensaje', 'error')
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
      showToast("Lectura confirmada correctamente", "success")
      // Actualizamos el estado local en lugar de recargar toda la página
      setReadInfo((prev: any) => ({ ...prev, confirmed_at: new Date().toISOString() }))
    } else {
      showToast("Error al confirmar", "error")
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cargando Comunicado</p>
    </div>
  )

  if (!comunicado) return <div className="p-20 text-center text-slate-500">El comunicado no existe o ha sido eliminado.</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-700">
      <nav className="text-xs font-bold text-blue-600 uppercase tracking-widest">
        <a href="/dashboard/comunicados" className="hover:opacity-70 transition-opacity">← Volver a la lista</a>
      </nav>

      <article className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <header className="mb-8 border-b border-slate-50 pb-6 text-left">
          <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2 italic">
            {comunicado.title}
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Publicado por: <span className="text-slate-600 font-bold">{comunicado.profiles?.full_name}</span> • {new Date(comunicado.created_at).toLocaleString('es-AR')}
          </p>
        </header>

        <div className="text-slate-800 leading-relaxed whitespace-pre-wrap text-left font-medium">
          {comunicado.content}
        </div>

        {comunicado.require_confirmation && (
          <div className="mt-12 p-8 bg-blue-50 rounded-2rem border border-blue-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xl mb-4 shadow-lg shadow-blue-200">
              <span className="text-white">✍️</span>
            </div>
            <h4 className="font-black text-blue-900 mb-2 uppercase tracking-tight">Confirmación requerida</h4>
            <p className="text-sm text-blue-700/80 mb-6 font-medium">Esta notificación requiere una confirmación formal de lectura por parte del tutor.</p>
            
            {readInfo?.confirmed_at ? (
              <div className="bg-white text-green-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-green-200 shadow-sm flex items-center gap-2">
                <span className="text-lg">✅</span> Confirmado el {new Date(readInfo.confirmed_at).toLocaleDateString('es-AR')}
              </div>
            ) : (
              <button 
                onClick={handleConfirm} 
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20 active:scale-95"
              >
                Confirmar Lectura
              </button>
            )}
          </div>
        )}
      </article>
    </div>
  )
}