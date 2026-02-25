'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function NuevoComunicado() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Datos de selección
  const [cursosAsignados, setCursosAsignados] = useState<any[]>([])
  const [alumnosDelCurso, setAlumnosDelCurso] = useState<any[]>([])
  
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState<'curso' | 'alumno-especifico'>('curso')
  const [selectedCurso, setSelectedCurso] = useState('')
  const [selectedAlumno, setSelectedAlumno] = useState('') 
  const [confirm, setConfirm] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  // 1. CARGA INICIAL DE PERFIL Y CURSOS
  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      setUserProfile(profile)

      if (profile?.role?.toLowerCase() === 'preceptor') {
        const { data: asignaciones, error: errAsig } = await supabase
          .from('preceptor_courses')
          .select('course_id, courses (id, name, section, shift)')
          .eq('preceptor_id', user.id)

        if (errAsig) console.error("❌ Error Supabase:", errAsig)
        
        const listaCursos = asignaciones
          ?.map((a: any) => a.courses)
          .filter(c => c !== null) || []
        
        setCursosAsignados(listaCursos)
      } else {
        const { data: todosLosCursos } = await supabase
          .from('courses')
          .select('id, name, section, shift')
          .eq('school_id', profile?.school_id)
          .order('name')
        
        setCursosAsignados(todosLosCursos || [])
      }
    } catch (error) {
      console.error("Crash fetchInitialData:", error)
    } finally {
      setLoading(false)
    }
  }

  // 2. NUEVA MODIFICACIÓN: Cargar alumnos cuando se selecciona un curso
  useEffect(() => {
    const fetchAlumnos = async () => {
      // Solo buscamos si hay un curso seleccionado y el tipo es 'alumno-especifico'
      if (selectedCurso && targetType === 'alumno-especifico') {
        console.log("🔍 Buscando alumnos para el curso ID:", selectedCurso);
        
        const { data, error } = await supabase
          .from('students')
          .select('id, full_name')
          .eq('course_id', selectedCurso)
          .order('full_name');

        if (error) {
          console.error("❌ Error cargando alumnos:", error.message);
          toast.error("No se pudieron cargar los alumnos");
        } else {
          console.log("✅ Alumnos encontrados:", data);
          setAlumnosDelCurso(data || []);
        }
      }
    };

    fetchAlumnos();
  }, [selectedCurso, targetType, supabase]);

  // 3. ENVÍO DE FORMULARIO
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    const payload = {
      school_id: userProfile?.school_id,
      sender_id: userProfile?.id,
      title,
      content,
      target_type: targetType,
      target_id: targetType === 'curso' ? selectedCurso : selectedAlumno,
      require_confirmation: confirm
    }

    const { error } = await supabase.from('communications').insert(payload)

    if (error) {
      toast.error("Error al enviar: " + error.message)
    } else {
      toast.success("Comunicado enviado con éxito")
      router.push('/dashboard/comunicados')
    }
    setSending(false)
  }

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold">PREPARANDO CANAL DE COMUNICACIÓN...</div>

  const turnos = ['Mañana', 'Tarde', 'Noche']

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Nuevo Aviso Oficial</h1>
        <p className="text-slate-500 font-medium">Segmentá tu mensaje para llegar a la audiencia correcta.</p>
      </header>

      <form onSubmit={handleSend} className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 text-left">
        
        {/* SECCIÓN 1: DESTINATARIOS */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
             <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">1</span>
             <h3 className="font-bold text-slate-900 uppercase text-sm tracking-widest">¿A quién enviamos el mensaje?</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => { setTargetType('curso'); setSelectedAlumno('') }}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${targetType === 'curso' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
            >
              <p className={`font-black text-sm ${targetType === 'curso' ? 'text-blue-600' : ''}`}>CURSO COMPLETO</p>
              <p className="text-xs opacity-70">A todos los padres del curso</p>
            </button>
            <button 
              type="button"
              onClick={() => setTargetType('alumno-especifico')}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${targetType === 'alumno-especifico' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
            >
              <p className={`font-black text-sm ${targetType === 'alumno-especifico' ? 'text-blue-600' : ''}`}>ALUMNO ESPECÍFICO</p>
              <p className="text-xs opacity-70">Mensaje privado para una familia</p>
            </button>
          </div>

          {/* Selector de Cursos Organizados por Turno */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Seleccionar Curso</label>
            <div className="grid grid-cols-1 gap-4">
              {turnos.map(turno => {
                const cursos = cursosAsignados.filter(c => c.shift === turno)
                if (cursos.length === 0) return null
                return (
                  <div key={turno} className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="w-full text-[9px] font-black text-blue-500 uppercase mb-1 ml-1">{turno}</span>
                    {cursos.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCurso(c.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedCurso === c.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
                      >
                        {c.name} "{c.section}"
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selector de Alumno (si aplica) */}
          {targetType === 'alumno-especifico' && selectedCurso && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Seleccionar Alumno</label>
              <select 
                value={selectedAlumno} 
                onChange={e => setSelectedAlumno(e.target.value)}
                className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold border border-slate-100"
                required
              >
                <option value="">-- Buscar alumno --</option>
                {alumnosDelCurso.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* SECCIÓN 2: CONTENIDO */}
        <div className="space-y-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
             <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">2</span>
             <h3 className="font-bold text-slate-900 uppercase text-sm tracking-widest">Redacción</h3>
          </div>
          
          <div className="space-y-4">
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Asunto del comunicado..." 
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

          <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <input 
              type="checkbox" 
              id="confirm"
              checked={confirm} 
              onChange={e => setConfirm(e.target.checked)} 
              className="w-5 h-5 accent-blue-600 cursor-pointer"
            />
            <label htmlFor="confirm" className="text-sm font-bold text-blue-900 cursor-pointer select-none">
              Solicitar confirmación de lectura obligatoria
            </label>
          </div>
        </div>

        <button 
          disabled={sending || !selectedCurso || (targetType === 'alumno-especifico' && !selectedAlumno)} 
          className="w-full bg-slate-900 text-white py-5 rounded-2rem font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-30"
        >
          {sending ? 'Publicando...' : '🚀 Publicar Comunicado'}
        </button>
      </form>
    </div>
  )
}