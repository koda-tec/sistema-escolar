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
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('push_subscriptions').select('id').eq('profile_id', user.id).maybeSingle()
          if (data) setIsSubscribed(true); else setIsSubscribed(false);
        }
      }
      setHasChecked(true)
    }
    checkStatus()
  }, [supabase])

  const subscribe = async () => {
    setLoading(true)
    try {
      // PASO 1: Permisos
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert("Permiso denegado por el usuario.");
        setLoading(false);
        return;
      }

      // PASO 2: Obtener Registro
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        alert("No se encontró el Service Worker. ¿Instalaste la App?");
        setLoading(false);
        return;
      }

      // PASO 3: Verificar Llave VAPID
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        alert("Error: La llave pública VAPID está vacía en el navegador.");
        setLoading(false);
        return;
      }

      // PASO 4: Suscribir al Push Manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // PASO 5: Guardar en Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase.from('push_subscriptions').upsert({
        profile_id: user.id,
        subscription_json: JSON.parse(JSON.stringify(subscription))
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Notificaciones activas");
      alert("✅ ¡Sincronización exitosa!"); // <--- Si ves esto, ya está en la DB

    } catch (error: any) {
      alert("Fallo en: " + error.message);
    } finally {
      setLoading(false)
    }
  }

  if (!hasChecked || !isSupported || isSubscribed) return null

  return (
    <div className="relative overflow-hidden bg-linear-to-br from-blue-600 to-indigo-700 p-6 rounded-[2.5rem] text-white shadow-xl mb-10">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div className="text-left">
            <h3 className="font-black text-xl uppercase tracking-tighter text-white">Alertas Críticas</h3>
            <p className="text-blue-100 text-xs">Recibí inasistencias en tiempo real.</p>
          </div>
        <button onClick={subscribe} disabled={loading} className="w-full md:w-auto bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 disabled:opacity-50">
          {loading ? 'Sincronizando...' : 'Activar Notificaciones'}
        </button>
      </div>
    </div>
  )
}