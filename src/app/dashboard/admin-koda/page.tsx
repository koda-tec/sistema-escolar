'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

export default function SuperAdminPage() {
  const [schools, setSchools] = useState<any[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  useEffect(() => { fetchSchools() }, [])

  async function fetchSchools() {
    const { data, error } = await supabase.from('schools').select('*').order('name')
    if (error) {
      toast.error('Error cargando escuelas')
    } else {
      setSchools(data || [])
    }
  }

  async function createSchool(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.from('schools').insert({ name, slug, active: true })
    
    if (error) {
      toast.error('Error al crear: ' + error.message)
    } else {
      toast.success('Escuela creada correctamente')
      setName('')
      setSlug('')
      fetchSchools()
    }
    setLoading(false)
  }

  async function toggleActive(schoolId: string, currentState: boolean) {
    // LLAMADA A LA API
    try {
      const res = await fetch('/api/schools/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: schoolId, active: !currentState })
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)

      toast.success(`Escuela ${!currentState ? 'habilitada' : 'inhabilitada'}`)
      fetchSchools() // Refrescar lista
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-800 tracking-tight">Panel de Control Koda</h1>
      
      <form onSubmit={createSchool} className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 space-y-4">
        <h2 className="font-bold text-blue-600 uppercase text-xs tracking-widest">Registrar Nueva Escuela</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Nombre de la Institución" 
            className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" 
            required 
          />
          <input 
            value={slug} 
            onChange={e => setSlug(e.target.value)} 
            placeholder="slug-de-la-escuela" 
            className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" 
            required 
          />
        </div>
        <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
          {loading ? 'Creando...' : 'Activar Institución'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {schools.map(s => (
          <div key={s.id} className={`bg-white p-6 rounded-3xl border shadow-sm relative transition-all duration-300 ${
            !s.active ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-blue-100 hover:shadow-lg hover:scale-[1.02]'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{s.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {s.id}</p>
                <p className="text-xs font-bold mt-2 uppercase flex items-center gap-2">
                  {s.active ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Activa
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span> Inhabilitada
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button 
                onClick={() => toggleActive(s.id, s.active)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  s.active 
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                }`}
              >
                {s.active ? '🚫 Inhabilitar Acceso' : '✅ Habilitar Acceso'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}