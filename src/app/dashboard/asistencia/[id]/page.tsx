import { createClient } from '@/app/utils/supabase/server'
import AttendanceForm from './AttendanceForm'

export default async function TomarAsistenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const hoy = new Date().toISOString().split('T')[0]

  // 1. Info del curso
  const { data: course } = await supabase.from('courses').select('*').eq('id', id).single()

  // 2. Alumnos
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, dni')
    .eq('course_id', id)
    .order('full_name')

  // 3. NUEVO: Buscar asistencia ya tomada hoy para este curso
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
          <h1 className="text-2xl font-black text-slate-900 uppercase italic">
            {course?.name} "{course?.section}"
          </h1>
          <p className="text-slate-500 font-medium">Fecha: {new Date().toLocaleDateString('es-AR')}</p>
        </div>
        {asistenciaExistente && asistenciaExistente.length > 0 && (
          <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-2xl text-xs font-black uppercase">
            ⚠️ Editando lista de hoy
          </div>
        )}
      </header>

      {/* Pasamos 'asistenciaExistente' al formulario */}
      <AttendanceForm 
        students={students || []} 
        courseId={id} 
        courseName={`${course?.name} ${course?.section}`}
        initialAttendance={asistenciaExistente || []} 
      />
    </div>
  )
}