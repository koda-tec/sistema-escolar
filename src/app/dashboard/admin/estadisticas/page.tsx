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
  }, [anio, selectedCurso])

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Estadísticas</h1>
          <p className="text-slate-500 mt-2">Panel de control institucional</p>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Año</label>
              <select
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {[2023, 2024, 2025, 2026].map((a) => (
                  <option key={a} value={a.toString()}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Curso</label>
              <select
                value={selectedCurso}
                onChange={(e) => setSelectedCurso(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todos los cursos</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>{curso.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas de Asistencia */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">📊 Asistencia</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Porcentaje de Asistencia */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">% Asistencia</p>
              <p className="text-3xl font-bold text-green-600">
                {asistencia?.resumen?.porcentajeAsistencia || 0}%
              </p>
            </div>
            {/* Porcentaje de Ausentismo */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">% Ausentismo</p>
              <p className="text-3xl font-bold text-red-600">
                {asistencia?.resumen?.porcentajeAusentismo || 0}%
              </p>
            </div>
            {/* Total Presentes */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">Presentes</p>
              <p className="text-3xl font-bold text-green-600">
                {asistencia?.resumen?.presentes || 0}
              </p>
            </div>
            {/* Total Ausentes */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">Ausentes</p>
              <p className="text-3xl font-bold text-red-600">
                {asistencia?.resumen?.ausentes || 0}
              </p>
            </div>
          </div>

          {/* Más métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">Tardanzas</p>
              <p className="text-2xl font-bold text-yellow-600">
                {asistencia?.resumen?.tardanzas || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">Justificados</p>
              <p className="text-2xl font-bold text-blue-600">
                {asistencia?.resumen?.justificados || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">Total Registros</p>
              <p className="text-2xl font-bold text-slate-600">
                {asistencia?.resumen?.totalRegistros || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">Alumnos sin asistencia</p>
              <p className="text-2xl font-bold text-slate-600">
                {asistencia?.topAusentes?.length || 0}
              </p>
            </div>
          </div>

          {/* Top 5 Ausentes */}
          {asistencia?.topAusentes && asistencia.topAusentes.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border mt-4">
              <h3 className="font-bold text-slate-900 mb-4">👨‍🎓 Top 5 Alumnos con más ausencias</h3>
              <div className="space-y-2">
                {asistencia.topAusentes.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                    <span className="font-medium text-slate-900">{item.nombre}</span>
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {item.cantidad} ausencias
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Estadísticas de Comunicados */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">📬 Comunicados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Comunicados */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">Total Enviados</p>
              <p className="text-3xl font-bold text-blue-600">
                {comunicados?.resumen?.total || 0}
              </p>
            </div>
            {/* Tasa de Lectura */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">Tasa de Lectura</p>
              <p className="text-3xl font-bold text-green-600">
                {comunicados?.resumen?.tasaLectura || 0}%
              </p>
            </div>
            {/* <!-- Leídos --> */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">Leídos</p>
              <p className="text-3xl font-bold text-green-600">
                {comunicados?.resumen?.leidos || 0}
              </p>
            </div>
            {/* <!-- No Leídos --> */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">No Leídos</p>
              <p className="text-3xl font-bold text-red-600">
                {comunicados?.resumen?.noLeidos || 0}
              </p>
            </div>
          </div>

          {/* <!-- Más métricas de comunicados --> */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">Confirmados</p>
              <p className="text-2xl font-bold text-green-600">
                {comunicados?.resumen?.confirmados || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">Pendientes de Confirmar</p>
              <p className="text-2xl font-bold text-yellow-600">
                {comunicados?.resumen?.pendientesConfirmacion || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border">
              <p className="text-sm text-slate-500 mb-1">Últimos 30 días</p>
              <p className="text-2xl font-bold text-blue-600">
                {comunicados?.recientes?.length || 0}
              </p>
            </div>
          </div>

          {/* <!-- Comunicados Recientes --> */}
          {comunicados?.recientes && comunicados.recientes.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border mt-4">
              <h3 className="font-bold text-slate-900 mb-4">📋 Comunicados Recientes</h3>
              <div className="space-y-2">
                {comunicados.recientes.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900">{item.titulo}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(item.fecha).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {item.leidos} leído(s)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}