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
  const [isSubscribed, setIsSubscribed] = useState(true) 
  const [hasChecked, setHasChecked] = useState(false) 
  const supabase = createClient()

  useEffect(() => {
    const checkStatus = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (supported) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data } = await supabase
              .from('push_subscriptions')
              .select('id')
              .eq('profile_id', user.id)
              .maybeSingle()
            if (data) setIsSubscribed(true)
            else setIsSubscribed(false)
          }
        } catch (error) {
          console.error("Error comprobando suscripción:", error);
        }
      }
      setHasChecked(true)
    }
    checkStatus()
  }, [supabase])

  const subscribe = async () => {
    setLoading(true)
    try {
      // 1. Pedir permiso
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert("Permiso denegado. Habilitá las notificaciones en la configuración del sitio.")
        setLoading(false)
        return
      }

      // 2. SOLUCIÓN AL ERROR: Esperar activación real del Service Worker
      let registration = await navigator.serviceWorker.ready;
      
      // Si el worker está listo pero no activo, esperamos un momento
      if (!registration.active) {
        alert("El sistema se está sincronizando, por favor intentá de nuevo en 2 segundos.");
        setLoading(false);
        return;
      }

      // 3. Suscribir
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) throw new Error("Falta VAPID Key");

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
      toast.success("Notificaciones activadas")
    } catch (error: any) {
      console.error("Error Push:", error)
      alert("⚠️ Error: " + error.message);
    } finally {
      setLoading(false)
    }
  }

  if (!hasChecked || !isSupported || isSubscribed) return null

  return (
    <div className="relative overflow-hidden bg-linear-to-br from-blue-600 to-indigo-700 p-6 md:p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20 border border-white/10 mb-10 animate-in slide-in-from-top-4 duration-700">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-3xl shadow-inner border border-white/20 text-white">🔔</div>
          <div className="text-left">
            <h3 className="font-black text-2xl uppercase tracking-tighter leading-none mb-2 text-white">Alertas Críticas</h3>
            <p className="text-blue-100 text-sm font-medium max-w-300px leading-snug">Recibí inasistencias y notas en tiempo real.</p>
          </div>
        </div>
        <button onClick={subscribe} disabled={loading} className="w-full md:w-auto bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
          {loading ? 'Sincronizando...' : 'Activar Notificaciones'}
        </button>
      </div>
    </div>
  )
}