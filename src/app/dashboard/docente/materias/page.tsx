'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useToast } from '@/app/components/Toast'
import Link from 'next/link'

export default function MisMaterias() {
  const [materias, setMaterias] = useState<any[]>([])
  const [cursos, setCursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  
  // Formulario nueva materia
  const [nombreMateria, setNombreMateria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [cursoSeleccionado, setCursoSeleccionado] = useState('')
  const [creando, setCreando] = useState(false)
  
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user?.id)
        .maybeSingle()

      if (!profile?.school_id) {
        setLoading(false)
        return
      }

      // 1. Obtener los cursos de la escuela (con turno)
      const { data: cursosData } = await supabase
        .from('courses')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name')
      
      setCursos(cursosData || [])

      // 2. Obtener las materias del profesor con relación a materias y cursos (incluyendo shift)
      const { data: materiasData, error } = await supabase
        .from('profesor_materia')
        .select(`
          id,
          materias (id, name, description),
          courses (id, name, section, shift) 
        `)
        .eq('profesor_id', user?.id)
      
      if (error) throw error
      setMaterias(materiasData || [])
    } catch (err: any) {
      showToast("Error al cargar materias", "error")
    } finally {
      setLoading(false)
    }
  }

  // Lógica para crear materia (vincular profesor a materia/curso)
  const handleCrearMateria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombreMateria || !cursoSeleccionado) return
    setCreando(true)

    try {
      // Primero creamos la materia en la tabla general de materias
      const { data: newMat, error: errMat } = await supabase
        .from('materias')
        .insert({ name: nombreMateria, description: descripcion })
        .select()
        .single()

      if (errMat) throw errMat

      // Luego la vinculamos al profesor y al curso
      const { data: { user } } = await supabase.auth.getUser()
      const { error: errVinculo } = await supabase
        .from('profesor_materia')
        .insert({
          profesor_id: user?.id,
          materia_id: newMat.id,
          course_id: cursoSeleccionado
        })

      if (errVinculo) throw errVinculo

      showToast("Materia creada con éxito", "success")
      setMostrarFormulario(false)
      fetchData() // Recargar lista
    } catch (err: any) {
      showToast("Error al crear materia", "error")
    } finally {
      setCreando(false)
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Preparando tus cátedras...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis Materias</h1>
          <p className="text-slate-500 font-medium">Gestioná tus cátedras y alumnos</p>
        </div>
        
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nueva Materia'}
        </button>
      </div>

      {/* FORMULARIO DE CREACIÓN */}
      {mostrarFormulario && (
        <form onSubmit={handleCrearMateria} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Nombre de la Materia (ej: Matemáticas)"
              className="p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-900"
              value={nombreMateria}
              onChange={(e) => setNombreMateria(e.target.value)}
              required
            />
            <select 
              className="p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-900"
              value={cursoSeleccionado}
              onChange={(e) => setCursoSeleccionado(e.target.value)}
              required
            >
              <option value="">Seleccionar Curso...</option>
              {cursos.map(c => (
                <option key={c.id} value={c.id}>{c.name} "{c.section}" - {c.shift}</option>
              ))}
            </select>
          </div>
          <textarea 
            placeholder="Descripción opcional..."
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-medium text-slate-600 resize-none"
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <button 
            disabled={creando}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {creando ? 'Creando...' : 'Confirmar Cátedra'}
          </button>
        </form>
      )}

      {/* LISTA DE MATERIAS */}
      {materias.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-300 p-16 text-center">
          <p className="text-5xl mb-6">📚</p>
          <h3 className="font-bold text-slate-900 text-xl">Aún no tenés materias</h3>
          <p className="text-slate-500 mt-2">Iniciá creando tu primera materia para gestionar asistencia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materias.map((item) => (
            <div key={item.id} className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
              
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                  📖
                </div>
                {/* BADGE DE TURNO DINÁMICO */}
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                  item.courses?.shift === 'Mañana' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  item.courses?.shift === 'Tarde' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                  'bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}>
                  {item.courses?.shift || 'Mañana'}
                </div>
              </div>

              <div className="text-left">
                <h3 className="font-bold text-xl text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {item.materias?.name}
                </h3>
                <p className="text-blue-600 font-black text-sm uppercase tracking-widest">
                  {item.courses?.name} "{item.courses?.section}"
                </p>
              </div>
              
              {item.materias?.description && (
                <p className="text-slate-500 text-sm line-clamp-2 italic mt-4 text-left">
                  "{item.materias.description}"
                </p>
              )}

              <div className="mt-8 flex flex-col gap-2">
                <Link 
                  href={`/dashboard/admin/cursos/${item.courses?.id}`}
                  className="w-full bg-slate-950 text-white py-3.5 rounded-2xl text-xs font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  👥 Ver Alumnos
                </Link>
                <button className="w-full bg-slate-50 text-slate-400 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                  📣 Enviar Aviso
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
