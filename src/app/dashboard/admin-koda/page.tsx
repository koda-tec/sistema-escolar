'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/utils/supabase/client'

export default function SuperAdminPage() {
  const [schools, setSchools] = useState<any[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchSchools() }, [])

  async function fetchSchools() {
    const { data } = await supabase.from('schools').select('*')
    setSchools(data || [])
  }

  async function createSchool(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('schools').insert({ name, slug })
    setName(''); setSlug(''); fetchSchools()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-800 tracking-tight">Panel de Control Koda</h1>
      
      <form onSubmit={createSchool} className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 space-y-4">
        <h2 className="font-bold text-blue-600 uppercase text-xs tracking-widest">Registrar Nueva Escuela</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la Institución" className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
          <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug-de-la-escuela" className="p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
        <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
          Activar Institución
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {schools.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800">{s.name}</h3>
            <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {s.id}</p>
          </div>
        ))}
      </div>
    </div>
  )
}