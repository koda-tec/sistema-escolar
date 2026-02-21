import { createClient } from '@/app/utils/supabase/server'
import AttendanceForm from './AttendanceForm'

export default async function TomarAsistenciaPage({ 
  params 
}: { 
  params: Promise<{ id: string }> // Cambiado a Promise
}) {
  const supabase = await createClient()
  
  // En Next.js 15/16 es obligatorio esperar a los params
  const { id } = await params; 
  // 1. Info del curso
  const { data: course } = await supabase.from('courses').select('*').eq('id', id).single()

  // 2. Lista de alumnos
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('course_id', id)
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lista: {course?.name} "{course?.section}"
          </h1>
          <p className="text-slate-600 font-medium">Fecha: {new Date().toLocaleDateString('es-AR')}</p>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl text-sm font-bold w-fit">
          {students?.length || 0} Alumnos inscritos
        </div>
      </header>

      <AttendanceForm students={students || []} courseId={id} />
    </div>
  )
}