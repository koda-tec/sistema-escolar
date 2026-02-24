'use client'
import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

export default function SolicitudPadre({ studentId, parentId }: { studentId: string, parentId: string }) {
  const [tipo, setTipo] = useState('reunion')
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const enviar = async () => {
    setLoading(true)
    const { error } = await supabase.from('parent_requests').insert({
      parent_id: parentId,
      student_id: studentId,
      type: tipo,
      note: nota
    })

    if (!error) {
      toast.success("Solicitud enviada al preceptor")
      setNota('')
    }
    setLoading(false)
  }

  return (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
      <h4 className="font-bold text-slate-900 text-sm uppercase tracking-widest text-left">Nueva Solicitud</h4>
      <select 
        value={tipo} 
        onChange={e => setTipo(e.target.value)}
        className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm outline-none text-slate-900"
      >
        <option value="reunion">Solicitar Reunión</option>
        <option value="tardanza">Notificar Ingreso Tarde</option>
        <option value="inasistencia">Notificar Inasistencia</option>
      </select>
      <textarea 
        value={nota} 
        onChange={e => setNota(e.target.value)}
        placeholder="Nota adicional..." 
        className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm outline-none text-slate-900"
        rows={3}
      />
      <button 
        onClick={enviar} 
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar al Preceptor'}
      </button>
    </div>
  )
}