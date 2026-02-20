'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'

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

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

    if (!profile?.school_id) {
      setLoading(false)
      return
    }

    // Obtener los cursos de la escuela
    const { data: cursosData } = await supabase
      .from('courses')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('name')
    
    setCursos(cursosData || [])

    // Obtener las materias del profesor (con info del curso)
    const { data: materiasData } = await supabase
      .from('profesor_materia')
      .select(`
        *,
        materias(name, description),
        courses(name, section)
      `)
      .eq('profesor_id', user?.id)
    
    setMaterias(materiasData || [])
    setLoading(false)
  }

  async function handleCrearMateria(e: React.FormEvent) {
    e.preventDefault()
    setCreando(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

    // Validación para evitar error de null
    if (!profile?.school_id) {
      alert('Error: No se encontró la escuela asociada')
      setCreando(false)
      return
    }

    // 1. Crear la materia
    const { data: materiaData, error: materiaError } = await supabase
      .from('materias')
      .insert({
        school_id: profile.school_id,
        name: nombreMateria,
        description: descripcion
      })
      .select()
      .single()

    if (materiaError) {
      alert('Error al crear materia: ' + materiaError.message)
      setCreando(false)
      return
    }

    // 2. Vincular materia con el profesor y curso
    if (materiaData && cursoSeleccionado) {
      const { error: vinculoError } = await supabase.from('profesor_materia').insert({
        profesor_id: user?.id,
        materia_id: materiaData.id,
        curso_id: cursoSeleccionado
      })

      if (vinculoError) {
        alert('Error al vincular materia: ' + vinculoError.message)
      }
    }

    // Limpiar formulario
    setNombreMateria('')
    setDescripcion('')
    setCursoSeleccionado('')
    setMostrarFormulario(false)
    setCreando(false)
    
    // Recargar datos
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Materias</h1>
          <p className="text-slate-500">Gestiona las materias que dictás</p>
        </div>
        
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          {mostrarFormulario ? '✕ Cancelar' : '➕ Nueva Materia'}
        </button>
      </div>

      {/* Formulario para crear materia */}
      {mostrarFormulario && (
        <form onSubmit={handleCrearMateria} className="bg-white p-6 rounded-3xl shadow-sm border space-y-4">
          <h3 className="font-bold text-slate-900">Crear Nueva Materia</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Nombre de la Materia</label>
              <input 
                type="text"
                value={nombreMateria}
                onChange={e => setNombreMateria(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none"
                placeholder="Ej: Matemática"
                required
              />
            </div>
            
            <div>
              <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Curso</label>
              <select 
                value={cursoSeleccionado}
                onChange={e => setCursoSeleccionado(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none"
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
            <label className="text-[11px] font-bold text-slate-900 uppercase ml-1">Descripción (opcional)</label>
            <textarea 
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className="w-full mt-1 p-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl outline-none"
              placeholder="Breve descripción de la materia..."
              rows={2}
            />
          </div>

          <button 
            type="submit"
            disabled={creando}
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50"
          >
            {creando ? 'Creando...' : '✓ Crear Materia'}
          </button>
        </form>
      )}

      {/* Lista de materias */}
      {materias.length === 0 ? (
        <div className="bg-white rounded-3xl border p-10 text-center">
          <p className="text-4xl mb-4">📚</p>
          <h3 className="font-bold text-slate-900 text-lg">No tenés materias asignadas</h3>
          <p className="text-slate-500 mt-2">Hacé click en "Nueva Materia" para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materias.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-xl text-slate-900">
                    {item.materias?.name}
                  </h3>
                  <p className="text-blue-600 font-black">
                    {item.courses?.name} "{item.courses?.section}"
                  </p>
                </div>
                <span className="text-2xl">📖</span>
              </div>
              
              {item.materias?.description && (
                <p className="text-slate-500 text-sm mt-3 line-clamp-2">
                  {item.materias.description}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                <button className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                  Ver Alumnos
                </button>
                <button className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all">
                  Enviar Comunicado
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}