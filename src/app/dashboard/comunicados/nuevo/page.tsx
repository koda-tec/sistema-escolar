'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Curso {
  id: string
  name: string
  section: string
}

interface Materia {
  id: string
  name: string
}

interface Padre {
  id: string
  full_name: string
  email: string
}

export default function NuevoComunicado() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState('institution')
  const [targetId, setTargetId] = useState('')
  const [selectedParents, setSelectedParents] = useState<string[]>([])
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Datos para los selectores
  const [cursos, setCursos] = useState<Curso[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [padres, setPadres] = useState<Padre[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const supabase = createClient()
  const router = useRouter()

  // Cargar cursos, materias y padres
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).single()

      if (!profile?.school_id) {
        setLoadingData(false)
        return
      }

      // Cargar cursos
      const { data: cursosData } = await supabase
        .from('courses')
        .select('id, name, section')
        .eq('school_id', profile.school_id)
        .order('name')
      setCursos(cursosData || [])

      // Cargar materias
      const { data: materiasData } = await supabase
        .from('materias')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('name')
      setMaterias(materiasData || [])

      // Cargar padres (de la tabla profiles con role 'padre')
      const { data: padresData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('school_id', profile.school_id)
        .eq('role', 'padre')
        .order('full_name')
      setPadres(padresData || [])

      setLoadingData(false)
    }
    fetchData()
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).single()

      // Validar que se haya seleccionado un destino
      if (targetType === 'course' && !targetId) {
        toast.error('Debes seleccionar un curso')
        setLoading(false)
        return
      }
      if (targetType === 'materia' && !targetId) {
        toast.error('Debes seleccionar una materia')
        setLoading(false)
        return
      }
      if (targetType === 'parents' && selectedParents.length === 0) {
        toast.error('Debes seleccionar al menos un padre')
        setLoading(false)
        return
      }

      // Crear el comunicado
      const { data: comunicado, error } = await supabase
        .from('communications')
        .insert({
          school_id: profile?.school_id,
          sender_id: user?.id,
          title,
          content,
          target_type: targetType,
          target_id: targetType === 'parents' ? null : targetId,
          target_parents: targetType === 'parents' ? selectedParents : null,
          require_confirmation: confirm
        })
        .select()
        .single()

      if (error) {
        toast.error('Error: ' + error.message)
        setLoading(false)
        return
      }

      // Si el target es 'parents', crear registros en communication_reads para cada padre seleccionado
      if (targetType === 'parents' && comunicado) {
        const readsData = selectedParents.map(parentId => ({
          communication_id: comunicado.id,
          parent_id: parentId,
          read_at: null,
          confirmed_at: null
        }))

        const { error: readsError } = await supabase
          .from('communication_reads')
          .insert(readsData)

        if (readsError) {
          console.error('Error creando registros de lectura:', readsError)
        }
      }

      toast.success('Comunicado enviado correctamente')
      router.push('/dashboard/comunicados')

    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }

    setLoading(false)
  }

  const toggleParent = (parentId: string) => {
    setSelectedParents(prev => 
      prev.includes(parentId)
        ? prev.filter(id => id !== parentId)
        : [...prev, parentId]
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
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-slate-900">Redactar Comunicado</h1>
        <div className="bg-white p-8 rounded-2rem border border-slate-200 shadow-sm space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-12 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Redactar Comunicado</h1>

      <form onSubmit={handleSend} className="bg-white p-8 rounded-2rem border border-slate-200 shadow-sm space-y-6">
        {/* Título */}
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

        {/* Contenido */}
        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Contenido del mensaje</label>
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            rows={6} 
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none text-slate-900"
            placeholder="Escribí tu comunicado aquí..."
            required 
          />
        </div>

        {/* Destinatarios */}
        <div>
          <label className="text-[11px] font-bold text-slate-900 uppercase ml-1 mb-3 block">Enviar a</label>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <button
              type="button"
              onClick={() => { setTargetType('institution'); setTargetId(''); setSelectedParents([]); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                targetType === 'institution' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl">🏢</span>
              <p className="text-xs font-bold mt-1">Toda la Escuela</p>
            </button>

            <button
              type="button"
              onClick={() => { setTargetType('course'); setTargetId(''); setSelectedParents([]); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                targetType === 'course' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl">🏫</span>
              <p className="text-xs font-bold mt-1">Un Curso</p>
            </button>

            <button
              type="button"
              onClick={() => { setTargetType('materia'); setTargetId(''); setSelectedParents([]); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                targetType === 'materia' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl">📚</span>
              <p className="text-xs font-bold mt-1">Una Materia</p>
            </button>

            <button
              type="button"
              onClick={() => { setTargetType('parents'); setTargetId(''); setSelectedParents([]); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                targetType === 'parents' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl">👨‍👩‍👧</span>
              <p className="text-xs font-bold mt-1">Padres Específicos</p>
            </button>
          </div>

          {/* Selector de Curso */}
          {targetType === 'course' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase ml-1 mb-2 block">Seleccionar Curso</label>
              <select 
                value={targetId} 
                onChange={e => setTargetId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none text-slate-900"
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

          {/* Selector de Materia */}
          {targetType === 'materia' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase ml-1 mb-2 block">Seleccionar Materia</label>
              <select 
                value={targetId} 
                onChange={e => setTargetId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none text-slate-900"
              >
                <option value="">-- Seleccionar materia --</option>
                {materias.map(materia => (
                  <option key={materia.id} value={materia.id}>{materia.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de Padres */}
          {targetType === 'parents' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase ml-1">Seleccionar Padres</label>
                <button
                  type="button"
                  onClick={selectAllParents}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  {selectedParents.length === padres.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl p-4 space-y-2">
                {padres.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">
                    No hay padres registrados en la institución
                  </p>
                ) : (
                  padres.map(padre => (
                    <label 
                      key={padre.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        selectedParents.includes(padre.id) 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedParents.includes(padre.id)}
                        onChange={() => toggleParent(padre.id)}
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
              
              <p className="text-xs text-slate-500 mt-2 ml-1">
                {selectedParents.length} padre(s) seleccionado(s)
              </p>
            </div>
          )}
        </div>

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