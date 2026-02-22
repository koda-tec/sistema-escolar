'use client'
import { useEffect, useState } from 'react'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log("Comprobando soporte de instalación...");

    const handler = (e: any) => {
      console.log("✅ Evento beforeinstallprompt capturado!");
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
        console.log("No hay evento guardado.");
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) {
    // Si no es visible, imprimimos por qué para saber en la consola
    // console.log("El botón de instalación no se muestra porque el evento no se disparó aún.");
    return null;
  }

  return (
    <div className="bg-blue-600 p-6 rounded-2rem text-white shadow-2xl border border-blue-400 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        <div className="text-4xl">📱</div>
        <div>
          <h3 className="font-black text-xl uppercase tracking-tighter">Instalá KodaEd</h3>
          <p className="text-blue-100 text-sm">Accedé más rápido desde tu pantalla de inicio.</p>
        </div>
      </div>
      <button 
        onClick={handleInstallClick}
        className="w-full md:w-auto bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl"
      >
        Instalar ahora
      </button>
    </div>
  )
}