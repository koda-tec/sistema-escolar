'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useToast } from '@/app/components/Toast'
import Link from 'next/link'

export default function MisMaterias() {
  // Estados de datos
  const [materias, setMaterias] = useState<any[]>([])
  const [cursos, setCursos] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  
  // Estados de UI
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [creando, setCreando] = useState(false)

  // Formulario
  const [nombreMateria, setNombreMateria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [cursoSeleccionado, setCursoSeleccionado] = useState('')
  
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Obtener perfil del docente
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, school_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profileData?.school_id) {
        setLoading(false)
        return
      }
      setProfile(profileData)

      // 2. Obtener los cursos de la escuela para el selector
      const { data: cursosData } = await supabase
        .from('courses')
        .select('*')
        .eq('school_id', profileData.school_id)
        .order('name')
      
      setCursos(cursosData || [])

      // 3. Obtener las materias vinculadas al profesor
      const { data: materiasData, error } = await supabase
        .from('profesor_materia')
        .select(`
          id,
          materias (id, name, description),
          courses (id, name, section, shift)
        `)
        .eq('profesor_id', user.id)
      
      if (error) throw error
      setMaterias(materiasData || [])

    } catch (err: any) {
      console.error(err)
      showToast("Error al sincronizar materias", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleCrearMateria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombreMateria || !cursoSeleccionado) return
    setCreando(true)

    try {
      // A. Crear la materia en la tabla 'materias' vinculada a la escuela
      const { data: newMat, error: errMat } = await supabase
        .from('materias')
        .insert({ 
          name: nombreMateria, 
          description: descripcion,
          school_id: profile.school_id 
        })
        .select()
        .single()

      if (errMat) throw errMat

      // B. Crear el vínculo en 'profesor_materia'
      const { error: errVinculo } = await supabase
        .from('profesor_materia')
        .insert({
          profesor_id: profile.id,
          materia_id: newMat.id,
          curso_id: cursoSeleccionado
        })

      if (errVinculo) throw errVinculo

      showToast("Materia creada y vinculada", "success")
      setNombreMateria('')
      setDescripcion('')
      setCursoSeleccionado('')
      setMostrarFormulario(false)
      fetchData() // Recargar lista

    } catch (err: any) {
      console.error(err)
      showToast(err.message || "Error al crear materia", "error")
    } finally {
      setCreando(false)
    }
  }

  const handleEliminarMateria = async (id: string) => {
    if (!confirm("¿Deseas quitar esta materia de tu lista? El registro de la materia en la escuela se mantendrá, pero ya no estarás vinculado a ella en este curso.")) return

    try {
      const { error } = await supabase
        .from('profesor_materia')
        .delete()
        .eq('id', id)

      if (error) throw error

      showToast("Materia desvinculada", "success")
      setMaterias(prev => prev.filter(m => m.id !== id))
    } catch (err: any) {
      showToast("No se pudo eliminar el vínculo", "error")
    }
  }

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sincronizando Cátedras</p>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Mis Materias</h1>
          <p className="text-slate-500 font-medium">Gestioná tus clases y accedé a la nómina de alumnos.</p>
        </div>
        
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
            mostrarFormulario ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white shadow-blue-100'
          }`}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nueva Materia'}
        </button>
      </div>

      {/* FORMULARIO DE ALTA */}
      {mostrarFormulario && (
        <form onSubmit={handleCrearMateria} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-500 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre de la Materia</label>
              <input 
                placeholder="Ej: Historia Argentina"
                className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 border-none transition-all"
                value={nombreMateria}
                onChange={(e) => setNombreMateria(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Asignar a Curso</label>
              <select 
                className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 border-none transition-all"
                value={cursoSeleccionado}
                onChange={(e) => setCursoSeleccionado(e.target.value)}
                required
              >
                <option value="">Seleccionar curso...</option>
                {cursos.map(c => (
                  <option key={c.id} value={c.id}>{c.name} "{c.section}" - Turno {c.shift}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Descripción o Programa (Opcional)</label>
            <textarea 
              placeholder="Contenidos mínimos o breve introducción..."
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-medium text-slate-600 resize-none border-none"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <button 
            disabled={creando}
            className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 active:scale-95"
          >
            {creando ? 'Registrando...' : '✓ Confirmar Cátedra'}
          </button>
        </form>
      )}

      {/* GRILLA DE TARJETAS */}
      {materias.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-300 p-20 text-center">
          <p className="text-6xl mb-6 opacity-30">📚</p>
          <h3 className="font-bold text-slate-900 text-xl tracking-tighter uppercase">No tenés materias asignadas</h3>
          <p className="text-slate-400 mt-2 max-w-xs mx-auto">Agregá tu primera materia para comenzar a gestionar el curso.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materias.map((item) => (
            <div key={item.id} className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden text-left">
              
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-inner">
                  📖
                </div>
                <div className="flex items-center gap-2">
                   {/* BADGE DE TURNO */}
                  <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter border ${
                    item.courses?.shift === 'Mañana' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    item.courses?.shift === 'Tarde' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    'bg-indigo-50 text-indigo-600 border-indigo-100'
                  }`}>
                    {item.courses?.shift || 'Mañana'}
                  </div>
                  
                  {/* BOTÓN ELIMINAR */}
                  <button 
                    onClick={() => handleEliminarMateria(item.id)}
                    className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-slate-100"
                    title="Eliminar materia"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="text-left space-y-1">
                <h3 className="font-black text-xl text-slate-900 group-hover:text-blue-600 transition-colors notranslate leading-tight">
                  {item.materias?.name}
                </h3>
                <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em]">
                  {item.courses?.name} "{item.courses?.section}"
                </p>
              </div>
              
              <div className="mt-8 flex flex-col gap-2">
                <Link 
                  href={`/dashboard/admin/cursos/${item.courses?.id}`}
                  className="w-full bg-slate-950 text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                  👥 Ver Alumnos
                </Link>
                <Link 
                  href="/dashboard/comunicados/nuevo"
                  className="w-full bg-slate-50 text-slate-400 py-3 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2 font-bold"
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