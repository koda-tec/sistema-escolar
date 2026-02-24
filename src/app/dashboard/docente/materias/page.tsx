'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useToast } from '@/app/components/Toast' // Importamos tu Toast
import Link from 'next/link'

export default function MisMaterias() {
  const [materias, setMaterias] = useState<any[]>([])
  const [cursos, setCursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  
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
      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

      if (!profile?.school_id) {
        setLoading(false)
        return
      }

      const { data: cursosData } = await supabase
        .from('courses')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name')
      
      setCursos(cursosData || [])

      const { data: materiasData, error } = await supabase
        .from('profesor_materia')
        .select(`
          id,
          materias (id, name, description),
          courses (id, name, section)
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

  async function handleCrearMateria(e: React.FormEvent) {
    e.preventDefault()
    setCreando(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

      if (!profile?.school_id) {
        showToast('No se encontró la escuela asociada', 'error')
        setCreando(false)
        return
      }

      // 1. Crear la materia base
      const { data: materiaData, error: materiaError } = await supabase
        .from('materias')
        .insert({
          school_id: profile.school_id,
          name: nombreMateria,
          description: descripcion
        })
        .select()
        .single()

      if (materiaError) throw materiaError

      // 2. Vincular materia con el profesor y el curso seleccionado
      const { error: vinculoError } = await supabase.from('profesor_materia').insert({
        profesor_id: user?.id,
        materia_id: materiaData.id,
        curso_id: cursoSeleccionado
      })

      if (vinculoError) throw vinculoError

      showToast('Materia creada y vinculada con éxito', 'success')
      setNombreMateria('')
      setDescripcion('')
      setCursoSeleccionado('')
      setMostrarFormulario(false)
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setCreando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis Materias</h1>
          <p className="text-slate-500 font-medium">Gestioná tus cátedras y alumnos</p>
        </div>
        
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className={`px-6 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
            mostrarFormulario 
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-none' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
          }`}
        >
          {mostrarFormulario ? '✕ Cancelar' : '➕ Nueva Materia'}
        </button>
      </div>

      {mostrarFormulario && (
        <form onSubmit={handleCrearMateria} className="bg-white p-6 md:p-8 rounded-2rem shadow-sm border border-slate-100 space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-bold text-slate-900 text-lg">Configurar Nueva Materia</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[11px] font-bold text-slate-900 uppercase ml-1 tracking-wider">Nombre de la Materia</label>
              <input 
                type="text"
                value={nombreMateria}
                onChange={e => setNombreMateria(e.target.value)}
                className="w-full mt-1 p-4 bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none text-slate-900 font-medium"
                placeholder="Ej: Análisis Matemático I"
                required
              />
            </div>
            
            <div>
              <label className="text-[11px] font-bold text-slate-900 uppercase ml-1 tracking-wider">Curso Asignado</label>
              <select 
                value={cursoSeleccionado}
                onChange={e => setCursoSeleccionado(e.target.value)}
                className="w-full mt-1 p-4 bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none text-slate-900 font-medium"
                required
              >
                <option value="">Seleccionar curso...</option>
                {cursos.map(c => (
                  <option key={c.id} value={c.id}>{c.name} "{c.section}"</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-900 uppercase ml-1 tracking-wider">Descripción o Programa</label>
            <textarea 
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className="w-full mt-1 p-4 bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none text-slate-900 font-medium"
              placeholder="Objetivos de la materia..."
              rows={3}
            />
          </div>

          <button 
            type="submit"
            disabled={creando}
            className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl disabled:opacity-50 active:scale-95"
          >
            {creando ? 'Procesando...' : '✓ Guardar Materia'}
          </button>
        </form>
      )}

      {materias.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-300 p-16 text-center">
          <p className="text-5xl mb-6">📚</p>
          <h3 className="font-bold text-slate-900 text-xl">Aún no tenés materias</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">Comenzá creando tu primera materia para gestionar la asistencia y comunicados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materias.map((item) => (
            <div key={item.id} className="bg-white p-7 rounded-2rem border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  📖
                </div>
                <div className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                  {item.courses?.name} "{item.courses?.section}"
                </div>
              </div>

              <h3 className="font-bold text-xl text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                {item.materias?.name}
              </h3>
              
              {item.materias?.description && (
                <p className="text-slate-500 text-sm line-clamp-2 italic mb-4">
                  "{item.materias.description}"
                </p>
              )}

              <div className="mt-6 flex flex-col gap-2">
                <button className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center justify-center gap-2">
                  👥 Ver Alumnos
                </button>
                <Link 
                  href={`/dashboard/docente/materias/${item.courses.id}`} 
                  className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-sm font-bold hover:bg-black text-center"
                  >
                  Ver Alumnos
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}