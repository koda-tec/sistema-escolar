'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function NuevoComunicado() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Datos para los selectores
  const [cursosAsignados, setCursosAsignados] = useState<any[]>([])
  const [alumnosDelCurso, setAlumnosDelCurso] = useState<any[]>([])
  
  // Estado del Formulario
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState<'toda-la-escuela' | 'curso' | 'alumno-especifico'>('curso')
  const [selectedCurso, setSelectedCurso] = useState('')
  const [selectedAlumno, setSelectedAlumno] = useState('') 
  const [confirm, setConfirm] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      setUserProfile(profile)

      const rol = profile?.role?.toLowerCase().trim()

      // LÓGICA DE CARGA SEGÚN ROL
      if (rol === 'preceptor') {
        const { data: asig } = await supabase.from('preceptor_courses').select('courses(*)').eq('preceptor_id', user.id)
        setCursosAsignados(asig?.map((a: any) => a.courses).filter(Boolean) || [])
      } 
      else if (rol === 'docente') {
        const { data: asig } = await supabase.from('profesor_materia').select('courses(*)').eq('profesor_id', user.id)
        const uniqueCourses = Array.from(new Map(asig?.map((a: any) => [a.courses.id, a.courses])).values());
        setCursosAsignados(uniqueCourses || [])
      } 
      else {
        // Directivos y Admin Koda ven todo
        const { data: todos } = await supabase.from('courses').select('*').eq('school_id', profile.school_id).order('name')
        setCursosAsignados(todos || [])
      }
    } catch (error) {
      console.error("Error inicializando:", error)
    } finally {
      setLoading(false)
    }
  }

  // Carga de alumnos cuando cambia el curso seleccionado
  useEffect(() => {
    if (selectedCurso && targetType === 'alumno-especifico') {
      const fetchAlumnos = async () => {
        const { data } = await supabase.from('students').select('id, full_name').eq('course_id', selectedCurso).order('full_name');
        setAlumnosDelCurso(data || [])
      }
      fetchAlumnos()
    }
  }, [selectedCurso, targetType, supabase])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (targetType !== 'toda-la-escuela' && !selectedCurso) return toast.error("Por favor, selecciona un curso")
    if (targetType === 'alumno-especifico' && !selectedAlumno) return toast.error("Por favor, selecciona un alumno")
    
    setSending(true)

    const payload = {
      school_id: userProfile?.school_id,
      sender_id: userProfile?.id,
      title,
      content,
      target_type: targetType,
      target_id: targetType === 'toda-la-escuela' ? null : (targetType === 'curso' ? selectedCurso : selectedAlumno),
      require_confirmation: confirm
    }
    
    try {
      const { data: newComm, error } = await supabase.from('communications').insert(payload).select().single()
      
      if (error) throw error

      // Notificar vía API (Email)
      fetch('/api/comunicados/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communicationId: newComm.id })
      })

      toast.success("Comunicado publicado con éxito")
      router.push('/dashboard/comunicados')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-400">CARGANDO CANAL...</div>

  const turnos = ['Mañana', 'Tarde', 'Noche']

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Nuevo Aviso Oficial</h1>
        <p className="text-slate-500 font-medium tracking-tight">Seleccioná los destinatarios y redactá tu mensaje.</p>
      </header>

      <form onSubmit={handleSend} className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10 text-left">
        
        {/* PASO 1: DESTINATARIOS */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4 text-left">
             <span className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-200">1</span>
             <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Alcance del Mensaje</h3>
          </div>

          {/* Selector de tipo de alcance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(userProfile?.role === 'directivo' || userProfile?.role === 'admin_koda') && (
              <button 
                type="button"
                onClick={() => { setTargetType('toda-la-escuela'); setSelectedCurso(''); setSelectedAlumno('') }}
                className={`p-5 rounded-2rem border-2 transition-all text-left ${targetType === 'toda-la-escuela' ? 'border-blue-600 bg-blue-600 text-white shadow-xl scale-[1.02]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
              >
                <span className="text-2xl block mb-2">🌎</span>
                <p className="font-black text-[11px] uppercase tracking-wider leading-none">Toda la Escuela</p>
              </button>
            )}

            <button 
              type="button"
              onClick={() => { setTargetType('curso'); setSelectedAlumno('') }}
              className={`p-5 rounded-2rem border-2 transition-all text-left ${targetType === 'curso' ? 'border-blue-600 bg-blue-600 text-white shadow-xl scale-[1.02]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
            >
              <span className="text-2xl block mb-2">🏫</span>
              <p className="font-black text-[11px] uppercase tracking-wider leading-none">Curso Completo</p>
            </button>

            <button 
              type="button"
              onClick={() => setTargetType('alumno-especifico')}
              className={`p-5 rounded-2rem border-2 transition-all text-left ${targetType === 'alumno-especifico' ? 'border-blue-600 bg-blue-600 text-white shadow-xl scale-[1.02]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
            >
              <span className="text-2xl block mb-2">👤</span>
              <p className="font-black text-[11px] uppercase tracking-wider leading-none">Alumno Individual</p>
            </button>
          </div>

          {/* LISTA DE CURSOS (Solo si no es para toda la escuela) */}
          {targetType !== 'toda-la-escuela' && (
            <div className="space-y-4 pt-4 animate-in slide-in-from-top-4 duration-500">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest text-left">Seleccionar Curso Destino</label>
              <div className="grid grid-cols-1 gap-4">
                {turnos.map(turno => {
                  const cursos = cursosAsignados.filter(c => c.shift === turno)
                  if (cursos.length === 0) return null
                  return (
                    <div key={turno} className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2rem border border-slate-100">
                      <span className="w-full text-[9px] font-black text-blue-500 uppercase mb-2 ml-1">{turno}</span>
                      {cursos.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCurso(c.id)}
                          className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all border ${selectedCurso === c.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}
                        >
                          {c.name} "{c.section}"
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* BUSCADOR DE ALUMNO (Solo si eligió Alumno Individual) */}
          {targetType === 'alumno-especifico' && selectedCurso && (
            <div className="pt-4 animate-in slide-in-from-top-4 duration-500">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest text-left">Seleccionar Alumno</label>
              <select 
                value={selectedAlumno} 
                onChange={e => setSelectedAlumno(e.target.value)}
                className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold border-none"
                required
              >
                <option value="">-- Buscar en la lista del aula --</option>
                {alumnosDelCurso.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* PASO 2: REDACCIÓN */}
        <div className="space-y-6 pt-10 border-t border-slate-100 text-left">
          <div className="flex items-center gap-3 text-left">
             <span className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-200">2</span>
             <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Contenido del Mensaje</h3>
          </div>
          
          <div className="space-y-4">
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Asunto (Ej: Reunión de Padres)" 
              className="w-full p-5 bg-slate-50 rounded-2xl outline-none text-slate-900 font-black text-lg focus:ring-2 focus:ring-blue-500 transition-all border-none"
              required 
            />
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              rows={8} 
              placeholder="Escriba el comunicado detallado aquí..." 
              className="w-full p-5 bg-slate-50 rounded-2xl outline-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 transition-all border-none"
              required 
            />
          </div>

          {/* Confirmación Checkbox */}
          <div 
            onClick={() => setConfirm(!confirm)}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${confirm ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-transparent text-slate-400'}`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 ${confirm ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
               {confirm && '✓'}
            </div>
            <div>
              <p className={`font-bold text-sm ${confirm ? 'text-blue-900' : 'text-slate-500'}`}>Solicitar confirmación de lectura oficial</p>
              <p className="text-[10px] font-medium opacity-70 italic">El tutor deberá presionar un botón de "Enterado" en la App.</p>
            </div>
          </div>
        </div>

        <button 
          disabled={sending || (targetType !== 'toda-la-escuela' && !selectedCurso)} 
          className="w-full bg-slate-950 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-30"
        >
          {sending ? 'Publicando...' : '🚀 Emitir Comunicado'}
        </button>
      </form>
    </div>
  )
}