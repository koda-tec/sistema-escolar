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

    // Construir query base
    let query = supabase
      .from('attendance')
      .select(`
        id,
        status,
        date,
        course:courses(name),
        student:profiles!student_id(full_name, email)
      `)
      .gte('date', `${anio}-01-01`)
      .lte('date', `${anio}-12-31`)

    // Filtrar por curso si se especifica
    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data: attendance, error } = await query

    if (error) {
      console.error('Error obteniendo asistencia:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calcular estadísticas
    const totalRegistros = attendance?.length || 0
    const presentes = attendance?.filter((a: any) => a.status === 'presente').length || 0
    const ausentes = attendance?.filter((a: any) => a.status === 'ausente').length || 0
    const tardanzas = attendance?.filter((a: any) => a.status === 'tardanza').length || 0
    const justificados = attendance?.filter((a: any) => a.status === 'justificado').length || 0

    // Calcular porcentajes
    const porcentajeAsistencia = totalRegistros > 0 
      ? Math.round((presentes / totalRegistros) * 100) 
      : 0
    const porcentajeAusentismo = totalRegistros > 0 
      ? Math.round((ausentes / totalRegistros) * 100) 
      : 0

    // Agrupar por mes
    const porMes: Record<string, { presentes: number; ausentes: number; total: number }> = {}
    
    attendance?.forEach((registro: any) => {
      const mesKey = registro.date.substring(0, 7)
      if (!porMes[mesKey]) {
        porMes[mesKey] = { presentes: 0, ausentes: 0, total: 0 }
      }
      porMes[mesKey].total++
      if (registro.status === 'presente') porMes[mesKey].presentes++
      if (registro.status === 'ausente') porMes[mesKey].ausentes++
    })

    // Top 5 de alumnos con más ausencias
    const ausenciasPorAlumno: Record<string, number> = {}
    attendance?.forEach((registro: any) => {
      if (registro.status === 'ausente') {
        const key = registro.student?.full_name || 'Desconocido'
        ausenciasPorAlumno[key] = (ausenciasPorAlumno[key] || 0) + 1
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
      porMes,
      topAusentes
    })

  } catch (error: any) {
    console.error('Error general:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}