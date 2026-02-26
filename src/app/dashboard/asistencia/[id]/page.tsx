import { createClient } from '@/app/utils/supabase/server'
import AttendanceForm from './AttendanceForm'

export default async function TomarAsistenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const hoy = new Date().toISOString().split('T')[0]

  // 1. Info del curso e INSTITUCIÓN (Agregamos la relación con 'schools')
  const { data: course } = await supabase
    .from('courses')
    .select('*, schools(name)')
    .eq('id', id)
    .single()

  const schoolName = (course?.schools as any)?.name || "KodaEd"
  const courseName = `${course?.name} "${course?.section}"`

  // 2. Alumnos
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, dni')
    .eq('course_id', id)
    .order('full_name')

  // 3. Asistencia ya tomada hoy
  const studentIds = students?.map(s => s.id) || []
  const { data: asistenciaExistente } = await supabase
    .from('attendance')
    .select('student_id, status')
    .in('student_id', studentIds)
    .eq('date', hoy)

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <nav className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">
             Asistencia Diaria
          </nav>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
            {courseName}
          </h1>
          <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-widest">{schoolName}</p>
        </div>
        
        {asistenciaExistente && asistenciaExistente.length > 0 && (
          <div className="bg-amber-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-amber-200 animate-in zoom-in">
            ⚠️ Editando lista de hoy
          </div>
        )}
      </header>

      <AttendanceForm 
        students={students || []} 
        courseId={id} 
        courseName={courseName}
        schoolName={schoolName} // Pasamos el nombre real de la escuela
        initialAttendance={asistenciaExistente || []} 
      />
    </div>
  )
}