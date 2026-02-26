'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function PushNotif() {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
    }
  }, [])

  const subscribe = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error("Permiso denegado")
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' }
      })

      toast.success("🔔 Notificaciones activadas")
    } catch (error) {
      console.error(error)
      toast.error("Error al activar notificaciones")
    }
  }

  if (!isSupported) return null

  return (
    <button 
      onClick={subscribe}
      className="text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2"
    >
      <span>🔔</span> Activar Alertas en el Celular
    </button>
  )
}