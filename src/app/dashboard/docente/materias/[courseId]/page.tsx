'use client'
import { useEffect, useState, use } from 'react'
import { createClient } from '@/app/utils/supabase/client'

export default function DetalleCursoDocente({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [curso, setCurso] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchAlumnos = async () => {
      const { data: cursoData } = await supabase.from('courses').select('*').eq('id', courseId).single()
      setCurso(cursoData)

      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('course_id', courseId)
        .order('full_name')
      setAlumnos(data || [])
    }
    fetchAlumnos()
  }, [courseId])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900 uppercase italic">
         Alumnos: {curso?.name} "{curso?.section}"
      </h1>
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b">
            <tr>
              <th className="p-6">Nombre del Estudiante</th>
              <th className="p-6">DNI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alumnos.map(a => (
              <tr key={a.id} className="text-sm">
                <td className="p-6 font-bold text-slate-800">{a.full_name}</td>
                <td className="p-6 text-slate-500">{a.dni}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}