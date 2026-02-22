'use client'
import { useEffect, useState } from 'react'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está instalada
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches 
                                 || (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    // 2. Detectar si es iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 3. Capturar evento para Android/Chrome
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isRunningStandalone) setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // En iOS, como no hay evento, mostramos el mensaje si no es standalone
    if (ios && !isRunningStandalone) {
      setIsVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsVisible(false);
    setDeferredPrompt(null);
  };

  // Si ya está instalada o no debe ser visible, no renderizamos nada
  if (!isVisible || isStandalone) return null;

  return (
    <div className="bg-blue-600 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 border border-blue-400 mb-8 animate-in slide-in-from-top-4 duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
            {isIOS ? '🍎' : '📱'}
          </div>
          <div>
            <h3 className="font-black text-xl uppercase tracking-tighter leading-none mb-1">
              {isIOS ? 'Instalá KodaEd en tu iPhone' : 'Descargá la App Oficial'}
            </h3>
            <p className="text-blue-100 text-sm font-medium">
              {isIOS 
                ? 'Accedé al instante sin usar el navegador.' 
                : 'Mejorá tu experiencia y recibí notificaciones.'}
            </p>
          </div>
        </div>

        {isIOS ? (
          /* Instrucciones específicas para iPhone */
          <div className="flex flex-col items-center md:items-end gap-2 bg-slate-950/20 p-4 rounded-3xl border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Pasos para instalar:</p>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">1. Tocá <img src="https://www.svgrepo.com/show/503080/share-ios.svg" className="w-4 h-4 invert" alt="share" /></span>
              <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">2. 'Agregar al inicio'</span>
            </div>
          </div>
        ) : (
          /* Botón nativo para Android/PC */
          <button 
            onClick={handleInstallClick}
            className="w-full md:w-auto bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            Instalar ahora
          </button>
        )}
      </div>
    </div>
  )
}