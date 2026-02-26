'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

// Función auxiliar para convertir la llave VAPID (Corrige el error de la consola)
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotif() {
  const [isSupported, setIsSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      // Comprobar si ya tiene permiso
      if (Notification.permission === 'granted') setIsSubscribed(true)
    }
  }, [])

  const subscribe = async () => {
    setLoading(true)
    try {
      // 1. Pedir permiso
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error("Permiso denegado. Habilitalo en la configuración del sitio.")
        setLoading(false)
        return
      }

      // 2. Registrar/Esperar Service Worker
      const registration = await navigator.serviceWorker.ready
      
      // 3. Suscribir al servidor de Push
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) throw new Error("Falta la VAPID Public Key en el entorno")

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      })

      // 4. Guardar en Supabase
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('push_subscriptions').upsert({
        profile_id: user?.id,
        subscription_json: JSON.parse(JSON.stringify(subscription))
      })

      if (error) throw error

      setIsSubscribed(true)
      toast.success("¡Alertas activadas con éxito!")
    } catch (error: any) {
      console.error("PUSH ERROR:", error)
      toast.error("Error al configurar alertas")
    } finally {
      setLoading(false)
    }
  }

  if (!isSupported || isSubscribed) return null

  return (
    <div className="bg-linear-to-r from-blue-600 to-blue-700 p-6 rounded-[2.5rem] text-white shadow-xl shadow-blue-200 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 animate-in slide-in-from-top-4 duration-1000">
      <div className="flex items-center gap-4 text-left">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
          🔔
        </div>
        <div>
          <h3 className="font-black text-lg uppercase tracking-tighter leading-none mb-1">Activar Alertas Críticas</h3>
          <p className="text-blue-100 text-xs font-medium italic">Recibí inasistencias y notas en tiempo real.</p>
        </div>
      </div>
      <button 
        onClick={subscribe}
        disabled={loading}
        className="w-full md:w-auto bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? 'Configurando...' : 'Habilitar Notificaciones'}
      </button>
    </div>
  )
}