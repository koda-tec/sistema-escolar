'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

export default function GestionPagos() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPagos()
  }, [])

  async function fetchPagos() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user?.id).single()

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', profile?.school_id)
      .eq('role', 'padre')
      .order('subscription_active', { ascending: false })
    
    setUsuarios(data || [])
    setLoading(false)
  }

  const toggleAccesoManual = async (id: string, estadoActual: boolean) => {
    if (!confirm("¿Cambiar estado de pago manualmente?")) return
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_active: !estadoActual })
      .eq('id', id)
    
    if (!error) {
      toast.success("Estado de cuenta actualizado");
      fetchPagos();
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-400">AUDITANDO CAJA...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-left">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Monitor de Suscripciones</h1>
        <p className="text-slate-500 font-medium italic">Control de recaudación y activaciones manuales.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-2rem border border-slate-200 shadow-sm text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recaudación Est.</p>
            <p className="text-4xl font-black text-slate-900">${(usuarios.filter(u => u.subscription_active).length * 30000).toLocaleString()}</p>
         </div>
         <div className="bg-white p-8 rounded-2rem border border-slate-200 shadow-sm text-left">
            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Cuentas Activas</p>
            <p className="text-4xl font-black text-slate-900">{usuarios.filter(u => u.subscription_active).length}</p>
         </div>
         <div className="bg-white p-8 rounded-2rem border border-slate-200 shadow-sm text-left">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Pendientes</p>
            <p className="text-4xl font-black text-slate-900">{usuarios.filter(u => !u.subscription_active).length}</p>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden text-left">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase">
            <tr>
              <th className="p-6">Padre / Tutor</th>
              <th className="p-6">Email</th>
              <th className="p-6 text-center">Estado</th>
              <th className="p-6 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map(u => (
              <tr key={u.id} className="text-sm hover:bg-slate-50 transition-all">
                <td className="p-6 font-bold text-slate-800">{u.full_name}</td>
                <td className="p-6 text-slate-500">{u.email}</td>
                <td className="p-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.subscription_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.subscription_active ? 'Activo' : 'Pendiente'}
                  </span>
                </td>
                <td className="p-6 text-center">
                  <button 
                    onClick={() => toggleAccesoManual(u.id, u.subscription_active)}
                    className="text-[10px] font-black text-blue-600 hover:underline uppercase"
                  >
                    {u.subscription_active ? 'Desactivar' : 'Activar Manual'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}