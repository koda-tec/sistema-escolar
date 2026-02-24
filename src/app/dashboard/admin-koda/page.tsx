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
    const { data, error } = await supabase.from('schools').select('*')
    if (error) {
      toast.error('Error cargando escuelas: ' + error.message)
      return
    }
    setSchools(data || [])
  }

  async function createSchool(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.from('schools').insert({ name, slug, active: true })
    
    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      toast.success('Escuela creada correctamente')
      setName('')
      setSlug('')
      fetchSchools()
    }
    setLoading(false)
  }

  async function toggleActive(schoolId: string, currentState: boolean) {
    const { error } = await supabase
      .from('schools')
      .update({ active: !currentState })
      .eq('id', schoolId)

    if (error) {
      toast.error('Error al actualizar estado: ' + error.message)
    } else {
      toast.success(`Escuela ${!currentState ? 'habilitada' : 'inhabilitada'}`)
      fetchSchools()
    }
  }

  async function deleteSchool(schoolId: string) {
    if (!confirm('¿Seguro que querés eliminar esta escuela? Esta acción es irreversible.')) return

    const { error } = await supabase.from('schools').delete().eq('id', schoolId)

    if (error) {
      toast.error('Error al eliminar la escuela: ' + error.message)
    } else {
      toast.success('Escuela eliminada correctamente')
      fetchSchools()
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-800 tracking-tight">Panel de Control Koda</h1>
      
      <form onSubmit={createSchool} className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 space-y-4">
        <h2 className="font-bold text-blue-600 uppercase text-xs tracking-widest">Registrar Nueva Escuela</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la Institución" className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" required />
          <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug-de-la-escuela" className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" required />
        </div>
        <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
          {loading ? 'Creando...' : 'Activar Institución'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {schools.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
            <h3 className="font-bold text-slate-800">{s.name} {s.active ? '' : '(Inhabilitada)'}</h3>
            <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {s.id}</p>

            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => toggleActive(s.id, s.active)}
                className={`px-4 py-2 rounded-lg text-white font-bold ${
                  s.active ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {s.active ? 'Inhabilitar' : 'Habilitar'}
              </button>

              <button 
                onClick={() => deleteSchool(s.id)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
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