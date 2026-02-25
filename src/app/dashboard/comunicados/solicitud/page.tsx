'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function SolicitudPadrePage() {
  const [hijos, setHijos] = useState<any[]>([])
  const [selectedHijo, setSelectedHijo] = useState('')
  const [tipo, setTipo] = useState('inasistencia')
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchHijos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('students').select('id, full_name').eq('parent_id', user?.id)
      setHijos(data || [])
      if (data?.length) setSelectedHijo(data[0].id)
    }
    fetchHijos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).single()

    // 1. Guardar la solicitud en la DB
    const { data: newRequest, error } = await supabase
      .from('parent_requests')
      .insert({
        parent_id: user?.id,
        student_id: selectedHijo,
        school_id: profile?.school_id,
        type: tipo,
        note: nota
      })
      .select()
      .single()

    if (error) throw error

    // 2. Notificar al preceptor por Email (Llamada a nuestra nueva API)
    await fetch('/api/solicitudes/notificar-preceptor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: newRequest.id })
    })

    toast.success("Tu nota ha sido enviada y el preceptor ha sido notificado por email.")
    router.push('/dashboard/comunicados')
    
  } catch (error: any) {
    toast.error("Error al enviar la solicitud")
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <h1 className="text-2xl font-black text-slate-900 uppercase italic">Enviar Nota Oficial</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">¿Sobre qué hijo/a es el aviso?</label>
          <select value={selectedHijo} onChange={e => setSelectedHijo(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold">
            {hijos.map(h => <option key={h.id} value={h.id}>{h.full_name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Tipo de aviso</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold">
              <option value="inasistencia">Inasistencia</option>
              <option value="tardanza">Ingreso Tarde</option>
              <option value="reunion">Solicitud de Reunión</option>
              <option value="otro">Otro Motivo</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Mensaje Adicional</label>
          <textarea value={nota} onChange={e => setNota(e.target.value)} rows={4} placeholder="Escriba aquí los detalles..." className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none text-slate-900" required />
        </div>

        <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-blue-700 transition-all active:scale-95">
          {loading ? 'Enviando...' : 'Enviar al Preceptor'}
        </button>
      </form>
    </div>
  )
}