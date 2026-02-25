'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function PromocionAlumnos() {
  const [cursos, setCursos] = useState<any[]>([])
  const [sourceCourse, setSourceCourse] = useState('')
  const [targetCourse, setTargetCourse] = useState('')
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

   useEffect(() => {
    const fetchCursos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return // Seguridad: si no hay usuario, frenamos

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()
      
      // Si profile existe, buscamos los cursos. Si no, data será []
      if (profile?.school_id) {
        const { data } = await supabase
          .from('courses')
          .select('*')
          .eq('school_id', profile.school_id)
          .order('name')
        
        setCursos(data || [])
      }
    }
    fetchCursos()
  }, [supabase]) 

  // Al elegir curso origen, cargamos los alumnos
  useEffect(() => {
    if (sourceCourse) {
      const fetchAlumnos = async () => {
        const { data } = await supabase.from('students').select('id, full_name').eq('course_id', sourceCourse).order('full_name')
        setAlumnos(data || [])
        setSelectedIds(data?.map(a => a.id) || []) // Todos tildados por defecto
      }
      fetchAlumnos()
    }
  }, [sourceCourse])

  const toggleAlumno = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const ejecutarPromocion = async () => {
    if (!targetCourse) return toast.error("Seleccioná el curso de destino")
    if (selectedIds.length === 0) return toast.error("No hay alumnos seleccionados")
    if (sourceCourse === targetCourse) return toast.error("El curso de origen y destino no pueden ser el mismo")

    setLoading(true)
    const { error } = await supabase
      .from('students')
      .update({ course_id: targetCourse })
      .in('id', selectedIds)

    if (error) toast.error("Error: " + error.message)
    else {
      toast.success(`¡Éxito! ${selectedIds.length} alumnos promovidos.`);
      router.push('/dashboard/admin/alumnos')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 text-left">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Promoción de Ciclo</h1>
        <p className="text-slate-500 font-medium italic">Pasá alumnos de un año a otro de forma masiva.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2rem border border-slate-200 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">1. Curso Origen (Ciclo anterior)</label>
          <select value={sourceCourse} onChange={e => setSourceCourse(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-none text-slate-900">
            <option value="">Seleccionar curso...</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.name} "{c.section}" - {c.shift}</option>)}
          </select>
        </div>

        <div className="bg-white p-6 rounded-2rem border border-slate-200 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-green-600 uppercase tracking-widest">2. Curso Destino (Ciclo nuevo)</label>
          <select value={targetCourse} onChange={e => setTargetCourse(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-none text-slate-900">
            <option value="">Seleccionar curso...</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.name} "{c.section}" - {c.shift}</option>)}
          </select>
        </div>
      </div>

      {alumnos.length > 0 && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Confirmar Alumnos a promover</h3>
            <span className="text-blue-600 font-black text-xs">{selectedIds.length} seleccionados</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-6 max-h-400px overflow-y-auto custom-scrollbar">
            {alumnos.map(a => (
              <div key={a.id} onClick={() => toggleAlumno(a.id)} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${selectedIds.includes(a.id) ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white opacity-50'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedIds.includes(a.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                  {selectedIds.includes(a.id) && <span className="text-white text-[10px]">✓</span>}
                </div>
                <span className="font-bold text-slate-900 text-sm notranslate">{a.full_name}</span>
              </div>
            ))}
          </div>
          <div className="p-8 border-t border-slate-100 bg-slate-50">
            <button onClick={ejecutarPromocion} disabled={loading} className="w-full bg-slate-950 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95">
              {loading ? 'Procesando...' : `Confirmar Pase de Año a ${selectedIds.length} alumnos`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}