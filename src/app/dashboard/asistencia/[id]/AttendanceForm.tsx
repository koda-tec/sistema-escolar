'use client'
import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function AttendanceForm({ students, courseId, courseName, initialAttendance }: any) {
  // Estado inicial: Si hay data previa de hoy, la usa. Si no, todo 'presente'.
  const [attendance, setAttendance] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    students.forEach((s: any) => {
      const exist = initialAttendance.find((a: any) => a.student_id === s.id)
      map[s.id] = exist ? exist.status : 'presente'
    })
    return map
  })
  
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleStatus = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const save = async () => {
    setLoading(true)
    const hoy = new Date().toISOString().split('T')[0]
    
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: studentId,
      status,
      date: hoy
    }))

    // UPSERT: Si el (student_id, date) ya existe, actualiza el 'status'
    const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_id, date' })

    if (!error) {
      // Disparamos notificaciones (solo a los ausentes de este curso)
      await fetch('/api/asistencia/notificar', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }) 
      })
      
      toast.success("Asistencia sincronizada y familias notificadas")
      router.push('/dashboard/asistencia')
      router.refresh()
    } else {
      toast.error("Error al guardar: " + error.message)
    }
    setLoading(false)
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    const hoy = new Date().toLocaleDateString('es-AR')
    
    doc.setFontSize(20)
    doc.text(`KodaEd - Reporte de Asistencia`, 14, 20)
    doc.setFontSize(10)
    doc.text(`Institución: ${courseName.split(' ')[0]}`, 14, 28)
    doc.text(`Curso: ${courseName} | Fecha: ${hoy}`, 14, 34)

    const tableRows = students.map((s: any) => [
      s.full_name,
      s.dni,
      attendance[s.id].toUpperCase()
    ])

    autoTable(doc, {
      startY: 40,
      head: [['Estudiante', 'DNI', 'Estado']],
      body: tableRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] }, // Slate 900
      alternateRowStyles: { fillColor: [248, 250, 252] }
    })

    doc.save(`Asistencia_${courseName.replace(/ /g, '_')}_${hoy}.pdf`)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {students.map((s: any) => (
            <div key={s.id} className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col text-left">
                <span className="text-lg font-bold text-slate-900 notranslate">{s.full_name}</span>
                <span className="text-xs text-slate-500 font-medium tracking-tight uppercase">DNI: {s.dni}</span>
              </div>

              <div className="flex items-center gap-2">
                {['presente', 'ausente', 'justificado'].map((status) => (
                  <button
                    key={status}
                    translate="no"
                    onClick={() => handleStatus(s.id, status)}
                    className={`flex-1 md:flex-none w-10 h-10 md:w-12 md:h-12 rounded-xl font-black text-xs transition-all ${
                      attendance[s.id] === status 
                        ? (status === 'presente' ? 'bg-green-500 text-white shadow-lg' : 
                           status === 'ausente' ? 'bg-red-500 text-white shadow-lg' : 
                           'bg-amber-500 text-white shadow-lg')
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 pb-10">
        <button 
          onClick={downloadPDF}
          className="flex-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <span>📄</span> Descargar PDF
        </button>
        <button
          onClick={save}
          disabled={loading}
          className="flex-S2 bg-blue-600 text-white py-4 rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Confirmar y Notificar'}
        </button>
      </div>
    </div>
  )
}