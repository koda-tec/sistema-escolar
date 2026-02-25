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

      // 1. Obtener los cursos de la escuela
      const { data: cursosData } = await supabase
        .from('courses')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name')
      
      setCursos(cursosData || [])

      // 2. Obtener las materias del profesor
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

  // Lógica para crear materia corregida
  const handleCrearMateria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombreMateria || !cursoSeleccionado) return
    setCreando(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Necesitamos el school_id del profesor para la nueva materia
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user?.id)
        .single()

      if (!profile?.school_id) throw new Error("No tienes una escuela asignada")

      // 1. Crear la materia en la tabla general (IMPORTANTE: incluir school_id)
      const { data: newMat, error: errMat } = await supabase
        .from('materias')
        .insert({ 
            name: nombreMateria, 
            description: descripcion,
            school_id: profile.school_id // <--- CORRECCIÓN 1
        })
        .select()
        .single()

      if (errMat) throw errMat

      // 2. Vincular al profesor y curso (CORRECCIÓN 2: usar curso_id)
      const { error: errVinculo } = await supabase
        .from('profesor_materia')
        .insert({
          profesor_id: user?.id,
          materia_id: newMat.id,
          curso_id: cursoSeleccionado // <--- Cambiado de course_id a curso_id
        })

      if (errVinculo) throw errVinculo

      showToast("Materia creada y vinculada con éxito", "success")
      setNombreMateria('')
      setDescripcion('')
      setCursoSeleccionado('')
      setMostrarFormulario(false)
      fetchData() 
      
    } catch (err: any) {
      console.error("Error detallado:", err)
      showToast(err.message || "Error al crear materia", "error")
    } finally {
      setCreando(false)
    }
  }

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Sincronizando tus cátedras...</p>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Mis Materias</h1>
          <p className="text-slate-500 font-medium">Gestioná tus clases y el seguimiento de alumnos.</p>
        </div>
        
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-lg ${
            mostrarFormulario ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white shadow-blue-100'
          }`}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nueva Materia'}
        </button>
      </div>

      {mostrarFormulario && (
        <form onSubmit={handleCrearMateria} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-500 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre de la Cátedra</label>
                <input 
                placeholder="Ej: Física Cuántica"
                className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 border-none"
                value={nombreMateria}
                onChange={(e) => setNombreMateria(e.target.value)}
                required
                />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Asignar a Curso</label>
                <select 
                className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 border-none"
                value={cursoSeleccionado}
                onChange={(e) => setCursoSeleccionado(e.target.value)}
                required
                >
                <option value="">Seleccionar...</option>
                {cursos.map(c => (
                    <option key={c.id} value={c.id}>{c.name} "{c.section}" - {c.shift}</option>
                ))}
                </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Descripción breve (Opcional)</label>
            <textarea 
                placeholder="Escriba los objetivos o temas principales..."
                className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-medium text-slate-600 resize-none border-none"
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <button 
            disabled={creando}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 active:scale-95"
          >
            {creando ? 'Procesando...' : 'Confirmar y Guardar'}
          </button>
        </form>
      )}

      {/* LISTA DE MATERIAS */}
      {materias.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-300 p-20 text-center">
          <p className="text-6xl mb-6">📚</p>
          <h3 className="font-bold text-slate-900 text-xl uppercase tracking-tighter">Tu panel de cátedras está vacío</h3>
          <p className="text-slate-400 mt-2 max-w-xs mx-auto">Agregá tu primera materia para comenzar a gestionar el aula.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materias.map((item) => (
            <div key={item.id} className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden text-left">
              
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-inner">
                  📖
                </div>
                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                  item.courses?.shift === 'Mañana' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  item.courses?.shift === 'Tarde' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                  'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  {item.courses?.shift || 'Mañana'}
                </div>
              </div>

              <div className="text-left space-y-1">
                <h3 className="font-black text-xl text-slate-900 group-hover:text-blue-600 transition-colors notranslate">
                  {item.materias?.name}
                </h3>
                <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em]">
                  {item.courses?.name} "{item.courses?.section}"
                </p>
              </div>
              
              {item.materias?.description && (
                <p className="text-slate-400 text-sm line-clamp-2 italic mt-4 text-left font-medium">
                  "{item.materias.description}"
                </p>
              )}

              <div className="mt-8 flex flex-col gap-2">
                <Link 
                  href={`/dashboard/admin/cursos/${item.courses?.id}`}
                  className="w-full bg-slate-950 text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  👥 Ver Alumnos
                </Link>
                <Link 
                  href="/dashboard/comunicados/nuevo"
                  className="w-full bg-slate-50 text-slate-400 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                >
                  📣 Enviar Aviso
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}