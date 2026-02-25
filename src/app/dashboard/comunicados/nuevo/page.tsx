'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function NuevoComunicado() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  const [cursosAsignados, setCursosAsignados] = useState<any[]>([])
  const [alumnosDelCurso, setAlumnosDelCurso] = useState<any[]>([])
  
  // Form state mejorado
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

      if (rol === 'preceptor') {
        // 1. PRECEPTOR: Trae sus cursos de preceptor_courses
        const { data: asig } = await supabase.from('preceptor_courses').select('courses(*)').eq('preceptor_id', user.id)
        setCursosAsignados(asig?.map((a: any) => a.courses).filter(Boolean) || [])
      } 
      else if (rol === 'docente') {
        // 2. DOCENTE: Trae solo sus cursos de profesor_materia
        const { data: asig } = await supabase.from('profesor_materia').select('courses(*)').eq('profesor_id', user.id)
        // Eliminamos duplicados por si el docente tiene varias materias en el mismo curso
        const uniqueCourses = Array.from(new Map(asig?.map((a: any) => [a.courses.id, a.courses])).values());
        setCursosAsignados(uniqueCourses || [])
      } 
      else if (rol === 'directivo' || rol === 'admin_koda') {
        // 3. DIRECTIVO: Trae todos los cursos de la escuela
        const { data: todos } = await supabase.from('courses').select('*').eq('school_id', profile.school_id).order('name')
        setCursosAsignados(todos || [])
        setTargetType('toda-la-escuela') // Default para directivos
      }
    } catch (error) {
      console.error("Error inicializando:", error)
    } finally {
      setLoading(false)
    }
  }

  // Carga de alumnos para mensajes individuales
  useEffect(() => {
    if (selectedCurso && targetType === 'alumno-especifico') {
      const fetchAlumnos = async () => {
        const { data } = await supabase.from('students').select('id, full_name').eq('course_id', selectedCurso).order('full_name');
        setAlumnosDelCurso(data || [])
      }
      fetchAlumnos()
    }
  }, [selectedCurso, targetType])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    const payload = {
      school_id: userProfile?.school_id,
      sender_id: userProfile?.id,
      title,
      content,
      target_type: targetType,
      // Si es para toda la escuela, el target_id es NULL
      target_id: targetType === 'toda-la-escuela' ? null : (targetType === 'curso' ? selectedCurso : selectedAlumno),
      require_confirmation: confirm
    }
    
    const { data: newComm, error } = await supabase.from('communications').insert(payload).select().single()
    
    if (error) {
      toast.error("Error: " + error.message)
    } else {
      // Llamada a la API de notificaciones
      fetch('/api/comunicados/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communicationId: newComm.id })
      })
      toast.success("Comunicado publicado")
      router.push('/dashboard/comunicados')
    }
    setSending(false)
  }

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Iniciando canal seguro...</div>

  const turnos = ['Mañana', 'Tarde', 'Noche']

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Emitir Aviso</h1>
        <p className="text-slate-500 font-medium">Gestioná la comunicación oficial de la institución.</p>
      </header>

      <form onSubmit={handleSend} className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 text-left">
        
        {/* SECCIÓN 1: DESTINATARIOS */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4 text-left">
             <span className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xs">1</span>
             <h3 className="font-bold text-slate-900 uppercase text-sm tracking-widest">¿A quién va dirigido?</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* OPCIÓN: TODA LA ESCUELA (Solo Directivos/Admin) */}
            {(userProfile?.role === 'directivo' || userProfile?.role === 'admin_koda') && (
              <button 
                type="button"
                onClick={() => { setTargetType('toda-la-escuela'); setSelectedCurso('') }}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${targetType === 'toda-la-escuela' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
              >
                <p className={`font-black text-[10px] uppercase ${targetType === 'toda-la-escuela' ? 'text-blue-600' : ''}`}>🌎 Toda la Escuela</p>
                <p className="text-[10px] opacity-70">Aviso general institucional</p>
              </button>
            )}

            <button 
              type="button"
              onClick={() => { setTargetType('curso'); setSelectedAlumno('') }}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${targetType === 'curso' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
            >
              <p className={`font-black text-[10px] uppercase ${targetType === 'curso' ? 'text-blue-600' : ''}`}>🏫 Curso Completo</p>
              <p className="text-[10px] opacity-70">A los padres de un aula</p>
            </button>

            <button 
              type="button"
              onClick={() => setTargetType('alumno-especifico')}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${targetType === 'alumno-especifico' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
            >
              <p className={`font-black text-[10px] uppercase ${targetType === 'alumno-especifico' ? 'text-blue-600' : ''}`}>👤 Alumno Individual</p>
              <p className="text-[10px] opacity-70">Mensaje privado por familia</p>
            </button>
          </div>

          {/* Selector de Cursos (Solo si no es para toda la escuela) */}
          {targetType !== 'toda-la-escuela' && (
            <div className="space-y-4 text-left animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest text-left">Seleccionar Curso</label>
              <div className="grid grid-cols-1 gap-4 text-left">
                {turnos.map(turno => {
                  const cursos = cursosAsignados.filter(c => c.shift === turno)
                  if (cursos.length === 0) return null
                  return (
                    <div key={turno} className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                      <span className="w-full text-[9px] font-black text-blue-500 uppercase mb-1 ml-1 text-left">{turno}</span>
                      {cursos.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCurso(c.id)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${selectedCurso === c.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
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

          {/* Selector de Alumno Individual */}
          {targetType === 'alumno-especifico' && selectedCurso && (
            <div className="animate-in slide-in-from-top-2 duration-300 text-left">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Seleccionar Alumno</label>
              <select 
                value={selectedAlumno} 
                onChange={e => setSelectedAlumno(e.target.value)}
                className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold border-none"
                required
              >
                <option value="">-- Buscar en la lista --</option>
                {alumnosDelCurso.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* SECCIÓN 2: REDACCIÓN */}
        <div className="space-y-6 pt-6 border-t border-slate-100 text-left">
          <div className="flex items-center gap-3 text-left">
             <span className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xs">2</span>
             <h3 className="font-bold text-slate-900 uppercase text-sm tracking-widest">Mensaje</h3>
          </div>
          
          <div className="space-y-4 text-left">
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Asunto o Título..." 
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 transition-all border-none"
              required 
            />
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              rows={6} 
              placeholder="Escriba el contenido aquí..." 
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 transition-all border-none"
              required 
            />
          </div>

          <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100 cursor-pointer" onClick={() => setConfirm(!confirm)}>
            <input 
              type="checkbox" 
              checked={confirm} 
              readOnly
              className="w-5 h-5 accent-blue-600"
            />
            <label className="text-sm font-bold text-blue-900 cursor-pointer select-none">
              Solicitar confirmación de lectura oficial
            </label>
          </div>
        </div>

        <button 
          disabled={sending || (targetType !== 'toda-la-escuela' && !selectedCurso)} 
          className="w-full bg-slate-950 text-white py-5 rounded-2rem font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-30"
        >
          {sending ? 'Publicando...' : '🚀 Publicar Ahora'}
        </button>
      </form>
    </div>
  )
}