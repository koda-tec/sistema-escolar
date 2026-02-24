'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast'

export default function NuevoComunicado() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState('toda-la-escuela')
  const [targetId, setTargetId] = useState('')
  const [selectedParents, setSelectedParents] = useState<string[]>([])
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [cursos, setCursos] = useState<any[]>([])
  const [padres, setPadres] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const supabase = createClient()
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).single()

      if (!profile?.school_id) {
        setLoadingData(false)
        return
      }

      const { data: cursosData } = await supabase
        .from('courses')
        .select('id, name, section')
        .eq('school_id', profile.school_id)
        .order('name')

      const { data: padresData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('school_id', profile.school_id)
        .eq('role', 'padre')
        .order('full_name')

      setCursos(cursosData || [])
      setPadres(padresData || [])
      setLoadingData(false)
    }
    fetchData()
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).single()

    if (!profile?.school_id) {
      showToast('No se pudo identificar la escuela', 'error')
      setLoading(false)
      return
    }

    if (targetType === 'curso' && !targetId) {
      showToast('Debés seleccionar un curso', 'error')
      setLoading(false)
      return
    }

    if (targetType === 'alumno-especifico' && selectedParents.length === 0) {
      showToast('Debés seleccionar al menos un padre', 'error')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('communications').insert({
      school_id: profile.school_id,
      sender_id: user?.id,
      title,
      content,
      target_type: targetType,
      target_id: targetType === 'toda-la-escuela' ? null : targetId,
      target_parents: targetType === 'alumno-especifico' ? selectedParents : null,
      require_confirmation: confirm
    })

    if (error) {
      showToast("Error: " + error.message, "error")
      setLoading(false)
      return
    }

    showToast("Comunicado enviado correctamente", "success")
    setLoading(false)
    router.push('/dashboard/comunicados')
  }

  const toggleParent = (parentId: string) => {
    setSelectedParents(prev =>
      prev.includes(parentId) ? prev.filter(id => id !== parentId) : [...prev, parentId]
    )
  }

  const selectAllParents = () => {
    if (selectedParents.length === padres.length) {
      setSelectedParents([])
    } else {
      setSelectedParents(padres.map(p => p.id))
    }
  }

  if (loadingData) {
    return <p>Cargando información...</p>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Redactar Comunicado</h1>

      <form onSubmit={handleSend} className="bg-white p-8 rounded-2rem border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Asunto / Título</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none text-slate-900"
            placeholder="Ej: Reunión de padres"
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Contenido del mensaje</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={6}
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none text-slate-900"
            placeholder="Escribí el comunicado..."
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1 mb-3 block">Enviar a</label>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <button
              type="button"
              onClick={() => { setTargetType('toda-la-escuela'); setTargetId(''); setSelectedParents([]); }}
              className={`p-4 rounded-2xl border-2 text-center ${targetType === 'toda-la-escuela' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className="text-2xl">🏢</span>
              <p className="text-xs font-bold mt-1">Toda la Escuela</p>
            </button>

            <button
              type="button"
              onClick={() => { setTargetType('curso'); setTargetId(''); setSelectedParents([]); }}
              className={`p-4 rounded-2xl border-2 text-center ${targetType === 'curso' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className="text-2xl">🏫</span>
              <p className="text-xs font-bold mt-1">Comunicado sobre un curso</p>
            </button>

            <button
              type="button"
              onClick={() => { setTargetType('alumno-especifico'); setTargetId(''); setSelectedParents([]); }}
              className={`p-4 rounded-2xl border-2 text-center ${targetType === 'alumno-especifico' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className="text-2xl">👨‍👩‍👧</span>
              <p className="text-xs font-bold mt-1">Padres específicos</p>
            </button>
          </div>
        </div>

        {/* Selectores de curso o padres según targetType */}
        {targetType === 'curso' && (
          <div>
            <label className="text-[11px] font-bold text-slate-900 uppercase ml-1 mb-2 block">Seleccionar curso</label>
            <select
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
            >
              <option value="">-- Seleccionar curso --</option>
              {cursos.map(curso => (
                <option key={curso.id} value={curso.id}>
                  {curso.name} {curso.section ? `- ${curso.section}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {targetType === 'alumno-especifico' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Seleccionar padres</label>
              <button
                type="button"
                onClick={() => selectedParents.length === padres.length ? setSelectedParents([]) : setSelectedParents(padres.map(p => p.id))}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                {selectedParents.length === padres.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl p-4 space-y-2">
              {padres.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No hay padres registrados</p>
              ) : (
                padres.map(padre => (
                  <label
                    key={padre.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedParents.includes(padre.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedParents.includes(padre.id)}
                      onChange={() => {
                        if (selectedParents.includes(padre.id)) {
                          setSelectedParents(selectedParents.filter(id => id !== padre.id))
                        } else {
                          setSelectedParents([...selectedParents, padre.id])
                        }
                      }}
                      className="w-5 h-5 accent-blue-600 rounded"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{padre.full_name}</p>
                      <p className="text-xs text-slate-500">{padre.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 ml-1">{selectedParents.length} padre(s) seleccionado(s)</p>
          </div>
        )}

        {/* Confirmación */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            checked={confirm}
            onChange={e => setConfirm(e.target.checked)}
            className="w-5 h-5 accent-blue-600 rounded"
            id="confirm"
          />
          <label htmlFor="confirm" className="text-sm font-bold text-slate-700 cursor-pointer">
            Solicitar confirmación de lectura
          </label>
        </div>

        {/* Botón */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Publicar Comunicado'}
        </button>
      </form>
    </div>
  )
}