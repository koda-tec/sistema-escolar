'use client'
import { useEffect, useState } from 'react'

export default function InstallPWA() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está instalada
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches 
                                 || (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    // 2. Detectar si es iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 3. Capturar evento para Android/Chrome
    const handler = (e: any) => {
      e.preventDefault();
      if (!isRunningStandalone) setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // En iOS mostramos el mensaje manualmente
    if (ios && !isRunningStandalone) {
      setIsVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isVisible || isStandalone) return null;

  return (
    <div className="relative overflow-hidden bg-linear-to-br from-blue-600 to-indigo-700 p-6 md:p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20 border border-white/10 mb-10 animate-in slide-in-from-top-4 duration-700">
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-white/20">
            {isIOS ? '' : '📱'}
          </div>
          <div>
            <h3 className="font-black text-2xl uppercase tracking-tighter leading-none mb-2">
              {isIOS ? 'Instalá KodaEd' : 'Descargá la App'}
            </h3>
            <p className="text-blue-100 text-sm font-medium max-w-280px">
              {isIOS 
                ? 'Agregala a tu pantalla de inicio para recibir notificaciones.' 
                : 'Accedé más rápido y sin usar el navegador.'}
            </p>
          </div>
        </div>

        {isIOS ? (
          /* Instrucciones iOS Refinadas */
          <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 opacity-80 text-center">Pasos para instalar</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-950/40 px-4 py-3 rounded-2xl border border-white/10 text-xs font-bold whitespace-nowrap">
                <span>1. Tocá</span>
                {/* Icono de compartir nativo de iOS en SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block stroke-white">
                  <path d="M12 15V3M12 3L8 7M12 3L16 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 11V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="bg-slate-950/40 px-4 py-3 rounded-2xl border border-white/10 text-xs font-bold whitespace-nowrap">
                2. 'Agregar al inicio'
              </div>
            </div>
          </div>
        ) : (
          <button className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
            Instalar ahora
          </button>
        )}
      </div>
    </div>
  )
}