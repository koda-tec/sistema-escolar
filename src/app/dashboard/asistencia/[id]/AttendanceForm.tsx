'use client'
import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function AttendanceForm({ students, courseId, courseName, schoolName, initialAttendance }: any) {
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

    const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id, date' })

    if (!error) {
      await fetch('/api/asistencia/notificar', { method: 'POST', body: JSON.stringify({ courseId }) })
      toast.success("Sincronización exitosa")
      router.push('/dashboard/asistencia')
      router.refresh()
    } else {
      toast.error("Error al sincronizar")
    }
    setLoading(false)
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    const hoy = new Date().toLocaleDateString('es-AR')
    
    // Título Principal
    doc.setFontSize(22)
    doc.setTextColor(15, 23, 42) // Slate 900
    doc.text(`KodaEd - Reporte de Asistencia`, 14, 20)
    
    // Subtítulos
    doc.setFontSize(11)
    doc.setTextColor(100, 116, 139) // Slate 500
    doc.text(`INSTITUCIÓN: ${schoolName.toUpperCase()}`, 14, 30)
    doc.text(`CURSO: ${courseName.toUpperCase()}`, 14, 36)
    doc.text(`FECHA: ${hoy}`, 14, 42)

    const tableRows = students.map((s: any) => [
      s.full_name,
      s.dni,
      attendance[s.id].toUpperCase()
    ])

    autoTable(doc, {
      startY: 48,
      head: [['Estudiante', 'DNI', 'Estado de Asistencia']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], fontSize: 10, fontStyle: 'bold' }, // Blue 600
      styles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    })

    // Pie de página sutil
    doc.setFontSize(8)
    doc.text("Documento generado automáticamente por KodaEd Digital Management", 14, doc.internal.pageSize.height - 10)

    doc.save(`Asistencia_${courseName}_${hoy}.pdf`)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {students.map((s: any) => (
            <div key={s.id} className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col text-left">
                <span className="text-lg font-bold text-slate-900 notranslate">{s.full_name}</span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">DNI: {s.dni}</span>
              </div>

              <div className="flex items-center gap-2">
                {['presente', 'ausente', 'justificado'].map((status) => (
                  <button
                    key={status}
                    translate="no"
                    onClick={() => handleStatus(s.id, status)}
                    className={`flex-1 md:flex-none w-10 h-10 md:w-12 md:h-12 rounded-xl font-black text-xs transition-all border ${
                      attendance[s.id] === status 
                        ? (status === 'presente' ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-100 scale-110' : 
                           status === 'ausente' ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-100 scale-110' : 
                           'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-100 scale-110')
                        : 'bg-white text-slate-300 border-slate-100 hover:border-slate-300'
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

      {/* FOOTER DE BOTONES PREMIUM */}
      <div className="flex flex-col md:flex-row gap-4 pb-20">
        <button 
          onClick={downloadPDF}
          className="flex-1 group bg-white border-2 border-slate-200 text-slate-600 py-5 rounded-2rem font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
        >
          <span className="text-xl group-hover:rotate-12 transition-transform">📄</span>
          Generar Planilla PDF
        </button>
        
        <button
          onClick={save}
          disabled={loading}
          className="flex-2 bg-slate-950 text-white py-5 rounded-2rem font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
             <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
          ) : (
            <>
              <span className="text-xl">🚀</span>
              Finalizar y Notificar
            </>
          )}
        </button>
      </div>
    </div>
  )
}