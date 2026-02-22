import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
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

    // Construir query base para comunicados
    let query = supabase
      .from('comunicados')
      .select('id, titulo, created_at')
      .eq('school_id', profile.school_id)

    if (anio) {
      query = query.gte('created_at', `${anio}-01-01`)
        .lte('created_at', `${anio}-12-31`)
    }

    const { data: comunicados, error } = await query

    if (error) {
      console.error('Error obteniendo comunicados:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Total de comunicados
    const total = comunicados?.length || 0

    // Contar leídos y no leídos
    const comunicadoIds = comunicados?.map((c: any) => c.id) || []
    
    const { data: lecturas, error: lecturasError } = await supabase
      .from('comunicado_reads')
      .select('comunicado_id, confirmado, read_at')
      .in('comunicado_id', comunicadoIds)

    if (lecturasError) {
      console.error('Error obteniendo lecturas:', lecturasError)
    }

    // Calcular métricas
    const leidos = lecturas?.filter((l: any) => l.read_at !== null).length || 0
    const noLeidos = total - leidos
    const confirmados = lecturas?.filter((l: any) => l.confirmado === true).length || 0
    const pendientesConfirmacion = leidos - confirmados

    // Tasa de lectura
    const tasaLectura = total > 0 ? Math.round((leidos / total) * 100) : 0

    // Agrupar por mes
    const porMes: Record<string, { total: number; leidos: number }> = {}
    
    comunicados?.forEach((comunicado: any) => {
      const mesKey = comunicado.created_at.substring(0, 7)
      if (!porMes[mesKey]) {
        porMes[mesKey] = { total: 0, leidos: 0 }
      }
      porMes[mesKey].total++
    })

    lecturas?.forEach((lectura: any) => {
      if (lectura.read_at) {
        const comunicado = comunicados?.find((c: any) => c.id === lectura.comunicado_id)
        if (comunicado) {
          const mesKey = comunicado.created_at.substring(0, 7)
          if (porMes[mesKey]) {
            porMes[mesKey].leidos++
          }
        }
      }
    })

    // Comunicados recientes (últimos 5)
    const recientes = comunicados
      ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((c: any) => ({
        id: c.id,
        titulo: c.titulo,
        fecha: c.created_at,
        leidos: lecturas?.filter((l: any) => l.comunicado_id === c.id && l.read_at).length || 0
      }))

    return NextResponse.json({
      resumen: {
        total,
        leidos,
        noLeidos,
        confirmados,
        pendientesConfirmacion,
        tasaLectura
      },
      porMes,
      recientes
    })

  } catch (error: any) {
    console.error('Error general:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}