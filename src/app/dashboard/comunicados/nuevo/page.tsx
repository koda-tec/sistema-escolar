'use client'
import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast'

export default function NuevoComunicado() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState('toda-la-escuela')
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()
  const { showToast } = useToast()

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).single()

    const { error } = await supabase.from('communications').insert({
      school_id: profile?.school_id,
      sender_id: user?.id,
      title,
      content,
      target_type: targetType,
      require_confirmation: confirm
    })

    if (error) {
      showToast("Error: " + error.message, "error")
    } else {
      showToast("Comunicado enviado correctamente", "success")
      router.push('/dashboard/comunicados')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Redactar Comunicado</h1>

      <form onSubmit={handleSend} className="bg-white p-8 rounded-2rem border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Asunto / Título</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900" required />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Contenido del mensaje</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Alcance</label>
            <select value={targetType} onChange={e => setTargetType(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl transition-all outline-none text-slate-900">
              <option value="toda-la-escuela">Toda la Institución</option>
              {/* Aquí luego podríamos filtrar por curso */}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} className="w-5 h-5 accent-blue-600 rounded" id="confirm" />
            <label htmlFor="confirm" className="text-sm font-bold text-slate-700 cursor-pointer">Solicitar confirmación de lectura</label>
          </div>
        </div>

        <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95">
          {loading ? 'Enviando...' : 'Publicar Comunicado'}
        </button>
      </form>
    </div>
  )
}