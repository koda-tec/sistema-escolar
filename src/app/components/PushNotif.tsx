'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

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
    const checkStatus = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true)
        
        // 1. Verificamos si ya existe la suscripción en la BASE DE DATOS
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('profile_id', user.id)
            .maybeSingle()
          
          // Si el registro existe en Supabase, ocultamos el botón
          if (data) setIsSubscribed(true)
        }
      }
    }
    checkStatus()
  }, [supabase])

  const subscribe = async () => {
    setLoading(true)
    try {
      // 2. Pedir permiso
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert("Debes permitir las notificaciones en los ajustes de tu iPhone.")
        setLoading(false)
        return
      }

      // 3. Obtener el Service Worker (Con timeout para que no cuelgue en iPhone)
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout SW")), 5000))
      ]) as ServiceWorkerRegistration;

      // 4. Suscribir
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey!)
      })

      // 5. Guardar en Supabase (Convertimos a objeto plano para evitar errores de JSON)
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('push_subscriptions').upsert({
        profile_id: user?.id,
        subscription_json: JSON.parse(JSON.stringify(subscription))
      })

      if (error) throw error

      setIsSubscribed(true)
      toast.success("Notificaciones activadas")
    } catch (error: any) {
      console.error(error)
      // Mostramos el error en un alert porque en iPhone no ves la consola
      alert("Error técnico: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isSupported || isSubscribed) return null

  return (
    <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-6 rounded-[2.5rem] text-white shadow-xl mb-8 animate-in slide-in-from-top-4 duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-left">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/20">🔔</div>
          <div className="text-left">
            <h3 className="font-black text-lg uppercase tracking-tighter leading-none mb-1">Alertas en tiempo real</h3>
            <p className="text-blue-100 text-xs font-medium italic">Vibración inmediata para inasistencias.</p>
          </div>
        </div>
        <button 
          onClick={subscribe}
          disabled={loading}
          className="w-full md:w-auto bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Sincronizando...' : 'Habilitar Notificaciones'}
        </button>
      </div>
    </div>
  )
}