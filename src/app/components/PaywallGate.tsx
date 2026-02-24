'use client'
import BotonPagoMP from "./dashboards/BotonPagoMP"

export default function PaywallGate() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-5xl mb-8 shadow-inner">
        🔒
      </div>
      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">
        Contenido Exclusivo
      </h2>
      <p className="text-slate-500 max-w-md mx-auto mb-10 font-medium leading-relaxed">
        Para acceder al legajo digital, historial de asistencia y comunicados oficiales, debés activar el ciclo lectivo actual.
      </p>
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl w-full max-w-sm">
        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-2">Suscripción Anual</p>
        <p className="text-4xl font-black text-slate-900 mb-8">$30.000</p>
        <BotonPagoMP />
        <p className="text-[10px] text-slate-400 mt-6 leading-tight uppercase font-bold tracking-tighter">
          Activación inmediata tras el pago
        </p>
      </div>
    </div>
  )
}