'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useToast } from '@/app/components/Toast' // Tu componente de alertas
import Link from 'next/link'

export default function MisHijosPage() {
  const [hijos, setHijos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const fetchHijos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        const { data, error } = await supabase
          .from('students')
          .select(`
            id,
            full_name,
            dni,
            courses (name, section),
            schools (name)
          `)
          .eq('parent_id', user?.id)

        if (error) throw error
        setHijos(data || [])
      } catch (err: any) {
        showToast('No se pudieron cargar los datos de tus hijos', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchHijos()
  }, [supabase, showToast])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis Hijos</h1>
        <p className="text-slate-600">Seguimiento académico y de asistencia.</p>
      </header>

      {hijos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hijos.map((hijo) => (
            <div key={hijo.id} className="bg-white rounded-2rem border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all group">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
                    🎓
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white px-3 py-1 rounded-full">
                    Alumno Regular
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {hijo.full_name}
                </h3>
                <p className="text-sm text-slate-500 font-medium mb-4">{hijo.schools?.name}</p>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Curso</p>
                    <p className="text-sm font-bold text-slate-800">{hijo.courses?.name} "{hijo.courses?.section}"</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">DNI</p>
                    <p className="text-sm font-bold text-slate-800">{hijo.dni}</p>
                  </div>
                </div>

                <Link 
                  href={`/dashboard/hijos/${hijo.id}`}
                  className="mt-6 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all"
                >
                  Ver Asistencia y Notas 📊
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2rem border border-dashed border-slate-300 text-center">
          <div className="text-5xl mb-4 text-slate-300">🏠</div>
          <h2 className="text-xl font-bold text-slate-800">No tienes hijos vinculados</h2>
          <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
            Para ver la información académica, la escuela debe vincular tu correo con el legajo del alumno.
          </p>
        </div>
      )}
    </div>
  )
}