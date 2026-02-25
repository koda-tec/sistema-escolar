'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast' // Cambiado a react-hot-toast para consistencia

export default function LibretasPage() {
  const [loading, setLoading] = useState(true)
  const [cursos, setCursos] = useState<any[]>([])
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [libretas, setLibretas] = useState<any[]>([])
  
  // Form state
  const [selectedCurso, setSelectedCurso] = useState('')
  const [selectedAlumno, setSelectedAlumno] = useState('')
  const [tipoPeriodo, setTipoPeriodo] = useState('Trimestre')
  const [numeroPeriodo, setNumeroPeriodo] = useState('1')
  const [anio, setAnio] = useState(new Date().getFullYear().toString())
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const supabase = createClient()

  // 1. Cargar cursos segmentados por rol y asignación
  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Obtenemos el perfil para saber el rol y la escuela
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, school_id')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile) return

        const rol = profile.role?.toLowerCase().trim()

        if (rol === 'preceptor') {
          // SI ES PRECEPTOR: Traer solo los cursos asignados en 'preceptor_courses'
          const { data: asignaciones, error } = await supabase
            .from('preceptor_courses')
            .select('courses(id, name, section, shift)')
            .eq('preceptor_id', user.id)
          
          if (error) throw error
          setCursos(asignaciones?.map((a: any) => a.courses).filter(Boolean) || [])
        } else {
          // SI ES DIRECTIVO/ADMIN: Traer todos los cursos de la escuela
          const { data: todos, error } = await supabase
            .from('courses')
            .select('id, name, section, shift')
            .eq('school_id', profile.school_id)
            .order('name')
          
          if (error) throw error
          setCursos(todos || [])
        }
      } catch (error: any) {
        console.error('Error cargando cursos:', error)
        toast.error('No se pudieron cargar los cursos')
      } finally {
        setLoading(false)
      }
    }

    fetchCursos()
  }, [supabase])

  // 2. Cargar alumnos cuando se selecciona un curso
  useEffect(() => {
    const fetchAlumnos = async () => {
      if (!selectedCurso) {
        setAlumnos([])
        return
      }

      const { data, error } = await supabase
        .from('students')
        .select('id, full_name')
        .eq('course_id', selectedCurso)
        .order('full_name', { ascending: true })

      if (error) {
        console.error('Error cargando alumnos:', error)
      } else {
        setAlumnos(data || [])
      }
    }

    fetchAlumnos()
  }, [selectedCurso, supabase])

  // 3. Cargar historial de libretas del curso seleccionado
  useEffect(() => {
    const fetchLibretas = async () => {
      if (!selectedCurso) {
        setLibretas([])
        return
      }

      const { data, error } = await supabase
        .from('libretas')
        .select(`
          *,
          student:student_id(full_name)
        `)
        .eq('course_id', selectedCurso)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando libretas:', error)
      } else {
        setLibretas(data || [])
      }
    }

    fetchLibretas()
  }, [selectedCurso, supabase])

  // 4. Lógica de Subida y Notificación
    // 4. Lógica de Subida y Notificación
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // CORRECCIÓN: Usamos numeroPeriodo en lugar de trimestre
    if (!selectedCurso || !selectedAlumno || !file || !numeroPeriodo || !anio) {
      toast.error('Por favor, completá todos los campos')
      return
    }

    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', selectedCurso)
      formData.append('studentId', selectedAlumno)
      formData.append('trimestre', numeroPeriodo) // Enviamos numeroPeriodo al backend
      formData.append('anio', anio)

      // A. Subida del archivo y registro en DB
      const response = await fetch('/api/libretas/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.error) {
        toast.error(result.error)
      } else {
        // B. Notificación por Email al padre
        try {
          await fetch('/api/libretas/notificar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              studentId: selectedAlumno, 
              trimestre: numeroPeriodo, // Usamos la variable correcta
              anio 
            })
          });
          toast.success('¡Libreta cargada y tutor notificado!');
        } catch (notifError) {
          toast.success('Libreta cargada (error en el envío del mail)');
        }
        
        // Limpiar campos y refrescar
        setFile(null)
        setSelectedAlumno('')
        // En lugar de reload, podrías llamar a la función que carga las libretas
        // pero reload funciona para una solución rápida
        window.location.reload() 
      }
    } catch (error) {
      toast.error('Error al procesar la libreta')
    } finally {
      setUploading(false)
    }
  }


  const handleDelete = async (libretaId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta libreta?')) return

    const { error } = await supabase
      .from('libretas')
      .delete()
      .eq('id', libretaId)

    if (error) {
      toast.error('Error al eliminar')
    } else {
      toast.success('Libreta eliminada')
      setLibretas(libretas.filter(l => l.id !== libretaId))
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Preparando gestión de documentos...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Gestión de Libretas</h1>
        <p className="text-slate-500 font-medium italic">Digitalizá y notificá las calificaciones oficiales.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LADO IZQUIERDO: FORMULARIO */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight border-b border-slate-50 pb-4">Subir Reporte</h2>
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Curso Asignado</label>
              <select
                value={selectedCurso}
                onChange={(e) => { setSelectedCurso(e.target.value); setSelectedAlumno('') }}
                className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold border-none"
                required
              >
                <option value="">Seleccionar curso...</option>
                {cursos.map(c => (
                  <option key={c.id} value={c.id}>{c.name} "{c.section}" - {c.shift}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Alumno</label>
              <select
                value={selectedAlumno}
                onChange={(e) => setSelectedAlumno(e.target.value)}
                disabled={!selectedCurso || alumnos.length === 0}
                className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold border-none disabled:opacity-50"
                required
              >
                <option value="">-- Buscar en el aula --</option>
                {alumnos.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Tipo de Periodo</label>
                <select 
                  value={tipoPeriodo} 
                  onChange={(e) => {
                    setTipoPeriodo(e.target.value);
                    setNumeroPeriodo('1'); // Resetear al cambiar tipo
                  }} 
                  className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold border-none"
                >
                  <option value="Trimestre">Trimestre</option>
                  <option value="Cuatrimestre">Cuatrimestre</option>
                  <option value="Informe">Informe Especial</option>
                  <option value="Final">Examen Final</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Número</label>
                <select 
                  value={numeroPeriodo} 
                  onChange={(e) => setNumeroPeriodo(e.target.value)} 
                  className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 font-bold border-none"
                >
                  <option value="1">1° {tipoPeriodo}</option>
                  <option value="2">2° {tipoPeriodo}</option>
                  {tipoPeriodo === 'Trimestre' && <option value="3">3° Trimestre</option>}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest text-left">Archivo PDF</label>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                className="w-full mt-1 p-3 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-500 uppercase" 
                required 
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedCurso || !selectedAlumno || !file}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-30"
            >
              {uploading ? 'PROCESANDO...' : '🚀 PUBLICAR Y NOTIFICAR'}
            </button>
          </form>
        </div>

        {/* LADO DERECHO: HISTORIAL */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight border-b border-slate-50 pb-4 text-left">Recientes</h2>
          <div className="space-y-3 overflow-y-auto max-h-500px custom-scrollbar">
            {libretas.map(l => (
              <div key={l.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100 hover:border-blue-300 transition-all">
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm notranslate">{l.student?.full_name}</p>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                    {l.trimestre}° Trimestre - {l.anio}
                  </p>
                </div>
                <div className="flex gap-2">
                   <a href={l.archivo_url} target="_blank" className="bg-white p-2 rounded-xl border border-slate-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">👁️</a>
                   <button onClick={() => handleDelete(l.id)} className="bg-white p-2 rounded-xl border border-slate-200 text-red-600 hover:bg-red-50 transition-all">🗑️</button>
                </div>
              </div>
            ))}
            {libretas.length === 0 && <p className="text-center text-slate-300 italic text-sm py-10">Selecciona un curso para ver el historial.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}