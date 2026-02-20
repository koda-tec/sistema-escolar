import { createClient } from '@/app/utils/supabase/server'
import Link from 'next/link'

export default async function AsistenciaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).maybeSingle()

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('school_id', profile?.school_id)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Control de Asistencia</h1>
        <p className="text-slate-600">Seleccione un curso para pasar lista hoy.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses?.map((c) => (
          <Link 
            key={c.id} 
            href={`/dashboard/asistencia/${c.id}`}
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {c.name}
                </h3>
                <p className="text-blue-600 font-black text-lg">División "{c.section}"</p>
              </div>
              <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">📝</span>
            </div>
          </Link>
        ))}
        {courses?.length === 0 && (
          <p className="text-slate-500 italic">No hay cursos creados. Ve a Gestión Cursos primero.</p>
        )}
      </div>
    </div>
  )
}