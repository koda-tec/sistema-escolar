'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { toast } from 'sonner'

export default function LibretasPage() {
  const [loading, setLoading] = useState(false)
  const [cursos, setCursos] = useState<any[]>([])
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [libretas, setLibretas] = useState<any[]>([])
  
  // Form state
  const [selectedCurso, setSelectedCurso] = useState('')
  const [selectedAlumno, setSelectedAlumno] = useState('')
  const [trimestre, setTrimestre] = useState('1')
  const [anio, setAnio] = useState(new Date().getFullYear().toString())
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const supabase = createClient()

  // Cargar cursos al inicio
  useEffect(() => {
    const fetchCursos = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, school_id')
        .order('name')

      if (error) {
        console.error('Error cargando cursos:', error)
        toast.error('Error al cargar cursos')
      } else {
        setCursos(data || [])
      }
    }

    fetchCursos()
  }, [])

  // Cargar alumnos cuando se selecciona un curso (Corregido para la estructura KodaEd)
  useEffect(() => {
    const fetchAlumnos = async () => {
      if (!selectedCurso) {
        setAlumnos([])
        return
      }

      // Traemos los alumnos directamente de la tabla 'students' 
      // filtrando por el ID del curso seleccionado
      const { data: studentsData, error } = await supabase
        .from('students')
        .select('id, full_name, dni')
        .eq('course_id', selectedCurso)
        .order('full_name', { ascending: true })

      if (error) {
        console.error('Error cargando alumnos:', error)
        toast.error('Error al cargar la lista de alumnos')
      } else {
        // Ahora 'alumnos' contendrá la lista de objetos con id y full_name
        setAlumnos(studentsData || [])
      }
    }

    fetchAlumnos()
  }, [selectedCurso, supabase])

  // Cargar libretas del curso seleccionado
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
          student:student_id(full_name, email),
          course:course_id(name)
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    // Validaciones
    if (!selectedCurso || !selectedAlumno || !file || !trimestre || !anio) {
      toast.error('Por favor, completá todos los campos')
      setUploading(false)
      return
    }

    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF')
      setUploading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', selectedCurso)
      formData.append('studentId', selectedAlumno)
      formData.append('trimestre', trimestre)
      formData.append('anio', anio)

      const response = await fetch('/api/libretas/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('¡Libreta subida correctamente!')
        
        // Limpiar formulario
        setFile(null)
        setSelectedAlumno('')
        
        // Recargar libretas
        const { data } = await supabase
          .from('libretas')
          .select(`
            *,
            student:student_id(full_name, email),
            course:course_id(name)
          `)
          .eq('course_id', selectedCurso)
          .order('created_at', { ascending: false })
        
        setLibretas(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al subir la libreta')
    }

    setUploading(false)
  }

  const handleDelete = async (libretaId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta libreta?')) return

    const { error } = await supabase
      .from('libretas')
      .delete()
      .eq('id', libretaId)

    if (error) {
      toast.error('Error al eliminar la libreta')
    } else {
      toast.success('Libreta eliminada')
      setLibretas(libretas.filter(l => l.id !== libretaId))
    }
  }

  const handleDownload = (url: string, nombre: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = nombre
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Libretas</h1>
          <p className="text-slate-500 mt-2">Subí las libretas en PDF de los alumnos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario para subir libreta */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Subir Libreta</h2>

            <form onSubmit={handleUpload} className="space-y-5">
              {/* Seleccionar Curso */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Curso *
                </label>
                <select
                  value={selectedCurso}
                  onChange={(e) => {
                    setSelectedCurso(e.target.value)
                    setSelectedAlumno('')
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"
                  required
                >
                  <option value="">Seleccionar curso...</option>
                  {cursos.map(curso => (
                    <option key={curso.id} value={curso.id}>
                      {curso.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seleccionar Alumno */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Alumno *
                </label>
                <select
                  value={selectedAlumno}
                  onChange={(e) => setSelectedAlumno(e.target.value)}
                  disabled={!selectedCurso || alumnos.length === 0}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                  required
                >
                  <option value="">Seleccionar alumno...</option>
                  {alumnos.map(alumno => (
                    <option key={alumno.id} value={alumno.id}>
                      {alumno.full_name}
                    </option>
                  ))}
                </select>
                {selectedCurso && alumnos.length === 0 && (
                  <p className="text-sm text-slate-400 mt-1">
                    No hay alumnos en este curso
                  </p>
                )}
              </div>

              {/* Trimestre y Año */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Trimestre *
                  </label>
                  <select
                    value={trimestre}
                    onChange={(e) => setTrimestre(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"
                    required
                  >
                    <option value="1">1° Trimestre</option>
                    <option value="2">2° Trimestre</option>
                    <option value="3">3° Trimestre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Año *
                  </label>
                  <select
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900"
                    required
                  >
                    {[2023, 2024, 2025, 2026].map(año => (
                      <option key={año} value={año.toString()}>
                        {año}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Archivo PDF */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Archivo PDF *
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all"
                  required
                />
                {file && (
                  <p className="text-sm text-slate-500 mt-1">
                    Archivo seleccionado: {file.name}
                  </p>
                )}
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={uploading || !selectedCurso || !selectedAlumno || !file}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Subiendo...' : 'Subir Libreta'}
              </button>
            </form>
          </div>

          {/* Lista de libretas */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Libretas Cargadas
              {selectedCurso && (
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({libretas.length})
                </span>
              )}
            </h2>

            {!selectedCurso ? (
              <div className="text-center py-12 text-slate-400">
                <p>Seleccioná un curso para ver las libretas</p>
              </div>
            ) : libretas.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>No hay libretas cargadas para este curso</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-500px overflow-y-auto">
                {libretas.map((libreta) => (
                  <div 
                    key={libreta.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                        PDF
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {libreta.student?.full_name || 'Alumno'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {libreta.trimestre}° Trimestre {libreta.anio} • {libreta.archivo_nombre}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(libreta.archivo_url, libreta.archivo_nombre)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Descargar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(libreta.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}