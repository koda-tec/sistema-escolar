'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

// Utilidad de conversión (Mantenela igual)
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
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('push_subscriptions').select('id').eq('profile_id', user.id).maybeSingle()
          if (data) setIsSubscribed(true)
        }
      }
    }
    checkStatus()
  }, [supabase])

  const subscribe = async () => {
    setLoading(true)
    try {
      // 1. Pedir permiso
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert("Permiso denegado. Ve a Ajustes > Safari (o Chrome) > Notificaciones y habilitalas para este sitio.")
        setLoading(false)
        return
      }

      // 2. FORZAR REGISTRO (Solución para iPhone)
      // En lugar de solo esperar .ready, intentamos registrarlo explícitamente
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log("No se encontró registro, re-registrando...");
        registration = await navigator.serviceWorker.register('/sw.js');
      }

      // 3. SUSCRIBIR (Con reintentos)
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) throw new Error("Falta VAPID Key");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      })

      // 4. GUARDAR EN DB
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('push_subscriptions').upsert({
        profile_id: user?.id,
        subscription_json: JSON.parse(JSON.stringify(subscription))
      })

      if (error) throw error

      setIsSubscribed(true)
      toast.success("Notificaciones activadas")
    } catch (error: any) {
      console.error("Error Push:", error)
      alert("Error en iPhone: " + error.message + ". Intenta cerrar y volver a abrir la App instalada.");
    } finally {
      setLoading(false)
    }
  }

  if (!isSupported || isSubscribed) return null

  return (
    <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-6 rounded-[2.5rem] text-white shadow-xl mb-8 animate-in slide-in-from-top-4 duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-left">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/20">🔔</div>
          <div className="text-left">
            <h3 className="font-black text-lg uppercase tracking-tighter leading-none mb-1">Alertas Críticas</h3>
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