import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const anio = searchParams.get('anio')

    // Obtener el usuario y su school_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single()

    if (!profile?.school_id) {
      return NextResponse.json({ error: 'No tiene escuela asignada' }, { status: 400 })
    }

    // Query simple - solo campos que existen
    let query = supabase
      .from('attendance')
      .select('id, status, date, student_id')

    // Filtrar por año
    if (anio) {
      query = query.gte('date', `${anio}-01-01`)
        .lte('date', `${anio}-12-31`)
    }

    const { data: attendanceData, error } = await query

    if (error) {
      console.error('Error obteniendo attendance:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Si hay un courseId, necesitamos filtrar por los estudiantes de ese curso
    let attendance = attendanceData || []
    
    if (courseId) {
      // Obtener los estudiantes del curso desde la tabla students
      const { data: studentsInCourse } = await supabase
        .from('students')
        .select('id')
        .eq('course_id', courseId)

      const studentIdsInCourse = studentsInCourse?.map(s => s.id) || []
      
      // Filtrar attendance solo para estudiantes del curso
      attendance = attendance.filter((a: any) => 
        studentIdsInCourse.includes(a.student_id)
      )
    }

    // Obtener nombres de estudiantes
    const allStudentIds = [...new Set(attendance.map((a: any) => a.student_id).filter(Boolean))]
    const { data: studentsData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', allStudentIds)

    const studentMap: Record<string, string> = {}
    studentsData?.forEach((s: any) => {
      studentMap[s.id] = s.full_name
    })

    // Calcular estadísticas
    const totalRegistros = attendance.length
    const presentes = attendance.filter((a: any) => a.status === 'presente').length
    const ausentes = attendance.filter((a: any) => a.status === 'ausente').length
    const tardanzas = attendance.filter((a: any) => a.status === 'tardanza').length
    const justificados = attendance.filter((a: any) => a.status === 'justificado').length

    // Calcular porcentajes
    const porcentajeAsistencia = totalRegistros > 0 
      ? Math.round((presentes / totalRegistros) * 100) 
      : 0
    const porcentajeAusentismo = totalRegistros > 0 
      ? Math.round((ausentes / totalRegistros) * 100) 
      : 0

    // Top 5 de alumnos con más ausencias
    const ausenciasPorAlumno: Record<string, number> = {}
    attendance.forEach((registro: any) => {
      if (registro.status === 'ausente') {
        const nombre = studentMap[registro.student_id] || 'Desconocido'
        ausenciasPorAlumno[nombre] = (ausenciasPorAlumno[nombre] || 0) + 1
      }
    })

    const topAusentes = Object.entries(ausenciasPorAlumno)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, cantidad]: [string, number]) => ({ nombre, cantidad }))

    return NextResponse.json({
      resumen: {
        totalRegistros,
        presentes,
        ausentes,
        tardanzas,
        justificados,
        porcentajeAsistencia,
        porcentajeAusentismo
      },
      topAusentes
    })

  } catch (error: any) {
    console.error('Error general:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}