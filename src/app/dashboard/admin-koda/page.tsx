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

  async function deleteSchool(schoolId: string) {
    if (!confirm('¿Seguro que querés eliminar esta escuela? Esta acción es irreversible.')) return

    // LLAMADA A LA API
    try {
      const res = await fetch(`/api/schools/delete?id=${schoolId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      toast.success('Escuela eliminada correctamente')
      fetchSchools()
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
          <div key={s.id} className={`bg-white p-6 rounded-3xl border shadow-sm relative transition-opacity ${!s.active ? 'opacity-60 bg-gray-50' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800">{s.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {s.id}</p>
                <p className="text-xs font-bold mt-2 text-slate-500 uppercase">{s.active ? '🟢 Activa' : '🔴 Inhabilitada'}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => toggleActive(s.id, s.active)}
                className={`flex-1 py-2 rounded-lg text-white font-bold text-sm transition-colors ${
                  s.active ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'}`
              }
              >
                {s.active ? 'Inhabilitar' : 'Habilitar'}
              </button>

              <button 
                onClick={() => deleteSchool(s.id)}
                className="flex-1 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-bold text-sm border border-red-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}