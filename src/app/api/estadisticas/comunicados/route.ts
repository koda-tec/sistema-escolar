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

    // Construir query base para communications (tu tabla)
    let query = supabase
      .from('communications')
      .select('id, title, created_at')
      .eq('school_id', profile.school_id)

    if (anio) {
      query = query.gte('created_at', `${anio}-01-01`)
        .lte('created_at', `${anio}-12-31`)
    }

    const { data: communications, error } = await query

    if (error) {
      console.error('Error obteniendo communications:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Total de communications
    const total = communications?.length || 0

    // Contar leídos y no leídos
    const communicationIds = communications?.map((c: any) => c.id) || []
    
    // Tu tabla es communication_reads
    const { data: reads, error: readsError } = await supabase
      .from('communication_reads')
      .select('communication_id, confirmed, read_at')
      .in('communication_id', communicationIds)

    if (readsError) {
      console.error('Error obteniendo reads:', readsError)
    }

    // Calcular métricas
    const leidos = reads?.filter((l: any) => l.read_at !== null).length || 0
    const noLeidos = total - leidos
    const confirmados = reads?.filter((l: any) => l.confirmed === true).length || 0
    const pendientesConfirmacion = leidos - confirmados

    // Tasa de lectura
    const tasaLectura = total > 0 ? Math.round((leidos / total) * 100) : 0

    // Agrupar por mes
    const porMes: Record<string, { total: number; leidos: number }> = {}
    
    communications?.forEach((comm: any) => {
      const mesKey = comm.created_at.substring(0, 7)
      if (!porMes[mesKey]) {
        porMes[mesKey] = { total: 0, leidos: 0 }
      }
      porMes[mesKey].total++
    })

    reads?.forEach((read: any) => {
      if (read.read_at) {
        const comm = communications?.find((c: any) => c.id === read.communication_id)
        if (comm) {
          const mesKey = comm.created_at.substring(0, 7)
          if (porMes[mesKey]) {
            porMes[mesKey].leidos++
          }
        }
      }
    })

    // Communications recientes (últimos 5)
    const recientes = communications
      ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((c: any) => ({
        id: c.id,
        titulo: c.title,
        fecha: c.created_at,
        leidos: reads?.filter((l: any) => l.communication_id === c.id && l.read_at).length || 0
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