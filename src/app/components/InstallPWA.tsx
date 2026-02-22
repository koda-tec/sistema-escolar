'use client'
import { useEffect, useState } from 'react'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Evita que el navegador muestre su propio cartel automático
      e.preventDefault();
      // Guarda el evento para dispararlo luego
      setDeferredPrompt(e);
      // Muestra nuestro botón
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Si la app ya está instalada, el evento no se dispara
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Muestra el cartel nativo de instalación
    deferredPrompt.prompt();

    // Espera la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuario instaló KodaEd');
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-2xl shadow-blue-200 border border-blue-400 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-10 duration-700 mb-8">
      <div className="flex items-center gap-4 text-center md:text-left">
        <div className="text-4xl">📱</div>
        <div>
          <h3 className="font-black text-xl leading-none mb-1 uppercase tracking-tighter">Instalá KodaEd</h3>
          <p className="text-blue-100 text-sm font-medium">Accedé más rápido y recibí notificaciones al instante.</p>
        </div>
      </div>
      <button 
        onClick={handleInstallClick}
        className="w-full md:w-auto bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
      >
        Instalar ahora
      </button>
    </div>
  )
}