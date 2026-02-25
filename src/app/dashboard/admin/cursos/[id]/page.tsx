import { createClient } from '@/app/utils/supabase/server'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DetalleCursoPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // 1. Info del curso
  const { data: curso } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (!curso) return notFound()

  // 2. Alumnos del curso
  const { data: alumnos } = await supabase
    .from('students')
    .select(`
      id, 
      full_name, 
      dni, 
      profiles:parent_id(full_name, email)
    `)
    .eq('course_id', id)
    .order('full_name')

  // 3. Materias y Profesores vinculados a este curso
  const { data: materias } = await supabase
    .from('profesor_materia')
    .select(`
      id,
      materias(name),
      profiles:profesor_id(full_name, email)
    `)
    .eq('curso_id', id)

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      <header>
        <h1 className="text-3xl font-black text-slate-900 uppercase italic">
          {curso.name} "{curso.section}"
        </h1>
        <p className="text-blue-600 font-bold tracking-widest text-xs uppercase">
          Turno {curso.shift} • Gestión de Aula
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LISTA DE ALUMNOS (2/3 de la pantalla) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-black text-slate-400 uppercase text-[10px] tracking-widest ml-4">Nómina de Estudiantes ({alumnos?.length})</h2>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden text-left">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase">
                <tr>
                  <th className="p-6">Estudiante</th>
                  <th className="p-6">Tutor Vinculado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alumnos?.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6">
                      <p className="font-bold text-slate-900 notranslate">{a.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">DNI: {a.dni}</p>
                    </td>
                    <td className="p-6 text-sm">
                      <p className="text-slate-700 font-semibold">{(a.profiles as any)?.full_name || 'Sin vincular'}</p>
                      <p className="text-[10px] text-blue-500 font-medium italic">{(a.profiles as any)?.email}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MATERIAS Y DOCENTES (1/3 de la pantalla) */}
        <div className="space-y-4 text-left">
          <h2 className="font-black text-slate-400 uppercase text-[10px] tracking-widest ml-4">Cuerpo Docente</h2>
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl">
            {materias && materias.length > 0 ? materias.map((m: any) => (
              <div key={m.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                <p className="text-blue-400 font-black text-xs uppercase tracking-tighter mb-1">{m.materias?.name}</p>
                <p className="font-bold text-slate-100">{m.profiles?.full_name}</p>
                <p className="text-[10px] text-slate-500 italic">{m.profiles?.email}</p>
              </div>
            )) : (
              <p className="text-slate-500 text-sm italic">No hay materias asignadas a este curso.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}