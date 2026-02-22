'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { toast } from 'sonner'

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true)
  const [anio, setAnio] = useState(new Date().getFullYear().toString())
  const [asistencia, setAsistencia] = useState<any>(null)
  const [comunicados, setComunicados] = useState<any>(null)
  const [cursos, setCursos] = useState<any[]>([])
  const [selectedCurso, setSelectedCurso] = useState('')

  const supabase = createClient()

  // Cargar cursos
  useEffect(() => {
    const fetchCursos = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('Error cargando cursos:', error)
      } else {
        setCursos(data || [])
      }
    }
    fetchCursos()
  }, [])

  // Cargar estadísticas
  useEffect(() => {
    const fetchEstadisticas = async () => {
      setLoading(true)
      
      try {
        // Asistencia
        const asistenciaParams = new URLSearchParams({ anio })
        if (selectedCurso) {
          asistenciaParams.append('courseId', selectedCurso)
        }
        const asistenciaRes = await fetch(`/api/estadisticas/asistencia?${asistenciaParams}`)
        const asistenciaData = await asistenciaRes.json()
        setAsistencia(asistenciaData)

        // Comunicados
        const comunicadosRes = await fetch(`/api/estadisticas/comunicados?anio=${anio}`)
        const comunicadosData = await comunicadosRes.json()
        setComunicados(comunicadosData)

      } catch (error) {
        console.error('Error cargando estadísticas:', error)
        toast.error('Error al cargar estadísticas')
      }

      setLoading(false)
    }

    fetchEstadisticas()
  }, [anio, selectedCurso])}