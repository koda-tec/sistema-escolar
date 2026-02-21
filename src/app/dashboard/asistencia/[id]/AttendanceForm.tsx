'use client'
import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast'

export default function AttendanceForm({ students, courseId }: { students: any[], courseId: string }) {
  const [attendance, setAttendance] = useState<Record<string, string>>(
    Object.fromEntries(students.map(s => [s.id, 'presente']))
  )
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { showToast } = useToast()

  const handleStatus = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const save = async () => {
    setLoading(true)
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: studentId,
      status,
      date: new Date().toISOString().split('T')[0],
    }))

    const { error } = await supabase.from('attendance').insert(records)

    if (error) {
      showToast('Error al guardar: ' + error.message, 'error')
    } else {
      showToast('¡Asistencia guardada con éxito!', 'success')
      router.push('/dashboard/asistencia')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
      <div className="divide-y divide-slate-100">
        {students.map((s) => (
          <div key={s.id} className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900">{s.full_name}</span>
              <span className="text-xs text-slate-500 font-medium tracking-tight">DNI: {s.dni}</span>
            </div>

           <div className="flex items-center gap-2">
            <button
                translate="no"
                onClick={() => handleStatus(s.id, 'presente')}
                className={`flex-1 md:flex-none w-10 h-10 md:w-12 md:h-12 rounded-xl font-black text-sm transition-all ${
                attendance[s.id] === 'presente' 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-200 scale-110' 
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
            >
                P
            </button>
            <button
                translate="no"
                onClick={() => handleStatus(s.id, 'ausente')}
                className={`flex-1 md:flex-none w-10 h-10 md:w-12 md:h-12 rounded-xl font-black text-sm transition-all ${
                attendance[s.id] === 'ausente' 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-110' 
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
            >
                A
            </button>
            <button
                translate="no"
                onClick={() => handleStatus(s.id, 'justificado')}
                className={`flex-1 md:flex-none w-10 h-10 md:w-12 md:h-12 rounded-xl font-black text-sm transition-all ${
                attendance[s.id] === 'justificado' 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 scale-110' 
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
            >
                J
            </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-slate-50 border-t border-slate-200">
        <button
          onClick={save}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Finalizar y Notificar Familias'}
        </button>
      </div>
    </div>
  )
}