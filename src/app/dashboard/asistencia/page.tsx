import { createClient } from '@/app/utils/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AsistenciaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. Obtenemos el perfil para saber el ROL y la ESCUELA
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, school_id')
    .eq('id', user?.id)
    .maybeSingle()

  if (!profile) return <div className="p-10 text-slate-500">Perfil no encontrado.</div>

  const userRole = profile.role?.toLowerCase().trim()
  let courses: any[] = []

  // 2. LÓGICA DE FILTRADO POR ROL
  if (userRole === 'preceptor') {
    // Si es preceptor, buscamos solo los cursos asignados en 'preceptor_courses'
    const { data: assignedCourses, error } = await supabase
      .from('courses')
      .select('*, preceptor_courses!inner(preceptor_id)')
      .eq('preceptor_courses.preceptor_id', profile.id)
    
    if (!error) courses = assignedCourses
  } else {
    // Si es Directivo, Admin o Docente, ve todos los cursos de la escuela
    const { data: allSchoolCourses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('name', { ascending: true })
    
    if (!error) courses = allSchoolCourses
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">
          Control de Asistencia
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {userRole === 'preceptor' 
            ? 'Cursos asignados bajo tu gestión.' 
            : 'Resumen general de cursos de la institución.'}
        </p>
      </header>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => (
          <div 
            key={c.id} 
            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/10 transition-all group relative overflow-hidden flex flex-col justify-between"
          >
            {/* Decoración sutil */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 opacity-0 group-hover:opacity-100 rounded-bl-full transition-opacity"></div>
            
            <div className="flex flex-col gap-4 text-left">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-blue-600 transition-colors duration-500">
                <span className="group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0">📝</span>
              </div>
              
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-none mb-1">
                  {c.name}
                </h3>
                <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em]">
                  División "{c.section}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-50 flex flex-col gap-3">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {c.shift || 'Turno Mañana'}
                    </span>
                </div>

                {/* BOTÓN 1: PASAR LISTA */}
                <Link 
                    href={`/dashboard/asistencia/${c.id}`}
                    className="w-full bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest hover:bg-blue-600 transition-all"
                >
                  PASAR LISTA
                </Link>

                {/* BOTÓN 2: NUEVO DETALLE */}
                <Link 
                    href={`/dashboard/admin/cursos/${c.id}`} 
                    className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 text-center transition-colors"
                  >
                    👁️ Ver Alumnos y Profesores
                  </Link>
              </div>
            </div>
          </div>
        ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center space-y-4">
          <div className="text-6xl grayscale opacity-50">📁</div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">Sin cursos asignados</h2>
          <p className="text-slate-500 max-w-sm mx-auto font-medium">
            {userRole === 'preceptor' 
              ? 'Aún no tienes cursos bajo tu cargo. Contacta a la dirección para que te asignen tus divisiones.'
              : 'No hay cursos registrados en esta escuela.'}
          </p>
          {userRole === 'directivo' && (
            <Link href="/dashboard/admin/cursos" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all">
              Crear primer curso
            </Link>
          )}
        </div>
      )}
    </div>
  )
}