'use client'

import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

interface UserCardProps {
  user: {
    id: string
    full_name: string
    email: string
    role: string
    school_id: string
  }
  schoolName: string
  onDelete?: () => void
}

export default function UserCard({ user, schoolName, onDelete }: UserCardProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const roleConfig: Record<string, { label: string; color: string; icon: string }> = {
    directivo: { label: 'Directivo', color: 'bg-purple-100 text-purple-700', icon: '👔' },
    docente: { label: 'Docente', color: 'bg-blue-100 text-blue-700', icon: '📚' },
    preceptor: { label: 'Preceptor', color: 'bg-amber-100 text-amber-700', icon: '📋' },
    padre: { label: 'Padre/Tutor', color: 'bg-green-100 text-green-700', icon: '👨‍👩‍👧' },
  }

  const currentRole = roleConfig[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-700', icon: '👤' }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(true)
    try {
      // 1. Eliminar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) throw profileError

      // 2. Eliminar usuario de Auth (opcional - depends on your logic)
      // Si prefieres NO eliminar la cuenta de Auth, comenta este bloque:
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      if (authError) {
        console.warn('No se pudo eliminar el usuario de Auth:', authError.message)
      }

      toast.success('Usuario eliminado correctamente')
      
      if (onDelete) onDelete()
      
    } catch (error: any) {
      console.error('Error eliminando usuario:', error)
      toast.error('Error al eliminar usuario: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        
        {/* Info del usuario */}
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl">
            {currentRole.icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{user.full_name}</h3>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${currentRole.color}`}>
                {currentRole.icon} {currentRole.label}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={handleDelete}
            disabled={loading}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar usuario"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Escuela */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 font-bold uppercase">Institución</p>
        <p className="text-sm font-medium text-slate-700">{schoolName}</p>
      </div>
    </div>
  )
}