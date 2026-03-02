'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'
import toast from 'react-hot-toast'

// Utilidad para convertir la llave VAPID (formato requerido por el navegador)
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
  const [isSubscribed, setIsSubscribed] = useState(true) // Iniciamos en true para evitar pestañeo
  const [hasChecked, setHasChecked] = useState(false) 
  
  const supabase = createClient()

  useEffect(() => {
    const checkStatus = async () => {
      // Verificar si el navegador soporta Notificaciones Push
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (supported) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // Verificar si ya existe en nuestra base de datos
            const { data } = await supabase
              .from('push_subscriptions')
              .select('id')
              .eq('profile_id', user.id)
              .maybeSingle()
            
            setIsSubscribed(!!data)
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
      // 1. Pedir permiso al usuario
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert("El permiso fue denegado. Habilitalo haciendo clic en el icono del candado en la barra de direcciones.");
        setLoading(false);
        return;
      }

      // 2. Obtener o RE-REGISTRAR el Service Worker (Solución al error 'No active Service Worker')
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log("SW no encontrado, registrando...");
        registration = await navigator.serviceWorker.register('/sw.js');
      }

      // Esperar a que el Service Worker esté realmente activo
      // Usamos .ready que devuelve una promesa cuando el SW está listo para controlar la página
      const activeReg = await navigator.serviceWorker.ready;

      if (!activeReg.pushManager) {
        throw new Error("Tu navegador no soporta el gestor de notificaciones Push.");
      }

      // 3. Obtener llave VAPID y Suscribir
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Falta la configuración técnica (VAPID Key)");

      const subscription = await activeReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // 4. Guardar en Supabase vinculando al usuario logueado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Debes estar logueado para activar alertas.");

      const { error: dbError } = await supabase.from('push_subscriptions').upsert({
        profile_id: user.id,
        subscription_json: JSON.parse(JSON.stringify(subscription))
      });

      if (dbError) throw dbError;

      setIsSubscribed(true);
      toast.success("🔔 ¡Notificaciones activadas!");

    } catch (error: any) {
      console.error("Error en Push:", error);
      alert("⚠️ No se pudo activar: " + (error.message || "Error desconocido"));
    } finally {
      setLoading(false)
    }
  }

  // Si no terminó de chequear o ya está suscrito, no mostramos nada
  if (!hasChecked || !isSupported || isSubscribed) return null

  return (
    <div className="relative overflow-hidden bg-linear-to-br from-blue-600 to-indigo-700 p-6 md:p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20 border border-white/10 mb-10 animate-in slide-in-from-top-4 duration-700">
      {/* Decoración visual de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-3xl shadow-inner border border-white/20">
            🔔
          </div>
          <div>
            <h3 className="font-black text-2xl uppercase tracking-tighter leading-none mb-2">
              Alertas Críticas
            </h3>
            <p className="text-blue-100 text-sm font-medium max-w-300px leading-snug">
              Recibí avisos de inasistencia y notas de la escuela en tiempo real en tu celular.
            </p>
          </div>
        </div>

        <button 
          onClick={subscribe}
          disabled={loading}
          className="w-full md:w-auto bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Sincronizando...' : 'Habilitar Notificaciones'}
        </button>
      </div>
    </div>
  )
}