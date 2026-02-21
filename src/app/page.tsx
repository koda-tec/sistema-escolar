import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          {/* LOGO KodaEd */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">
              K
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">
              Koda<span className="text-blue-600">Ed</span>
            </span>
          </div>

          {/* LINKS DE ACCESO */}
          <div className="flex items-center gap-6">
            <Link href="/login" className="hidden md:block text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-blue-600 transition-all shadow-xl active:scale-95">
              Probar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            SaaS Educativo de Próxima Generación
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-8 text-slate-900">
            La gestión escolar, <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
              redefinida.
            </span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            KodaEd centraliza la comunicación, asistencia y calificaciones de tu institución en una plataforma ágil, segura y 100% móvil.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all">
              Empezar ahora
            </Link>
            <Link href="#funcionalidades" className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
              Ver Video Demo
            </Link>
          </div>
        </div>
      </header>

      {/* SECCIÓN FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-24 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Módulos Core</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Todo lo que tu escuela necesita</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Asistencia Inteligente", 
                desc: "Toma de lista en segundos desde el celular del preceptor. Notificación instantánea a los padres ante ausencias.",
                icon: "📊",
                color: "blue"
              },
              { 
                title: "Comunicados Oficiales", 
                desc: "Circulares con confirmación de lectura obligatoria. Trazabilidad completa: quién leyó, cuándo y quién confirmó.",
                icon: "🔔",
                color: "indigo"
              },
              { 
                title: "Legajo Digital", 
                desc: "Calificaciones, libretas en PDF y seguimiento conductual disponible para las familias en tiempo real.",
                icon: "📂",
                color: "cyan"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="text-5xl mb-8">{feature.icon}</div>
                <h4 className="text-xl font-bold mb-4 text-slate-900">{feature.title}</h4>
                <p className="text-slate-500 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN SaaS / PWA */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto bg-slate-900 rounded-[3rem] p-8 md:p-20 relative shadow-3xl">
          {/* Decoración abstracta */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
          
          <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                Instalable como una App. <br />
                <span className="text-blue-400">Sin bajar nada.</span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 font-medium leading-relaxed">
                KodaEd utiliza tecnología PWA. Los padres y docentes pueden instalarla en su pantalla de inicio directamente desde el navegador, ocupando menos de 1MB y con soporte para notificaciones push.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-white/80 font-bold text-sm">
                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">✓ iOS & Android</span>
                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">✓ Offline Ready</span>
                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">✓ Push Alerts</span>
              </div>
            </div>
            
            <div className="flex-1 flex justify-center">
              <div className="w-64 h-500px bg-slate-800 rounded-[3rem] border-8px border-slate-700 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 w-full h-6 bg-slate-700"></div>
                <div className="p-4 pt-10">
                   <div className="w-full h-4 bg-slate-700 rounded-full mb-4"></div>
                   <div className="w-2/3 h-4 bg-slate-700 rounded-full mb-8"></div>
                   <div className="space-y-4">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="w-full h-16 bg-slate-700/50 rounded-2xl animate-pulse"></div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 bg-white border-t border-slate-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">K</div>
              <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">KodaEd</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Software Factory de soluciones educativas.</p>
          </div>
          
          <div className="flex gap-8 text-sm font-bold text-slate-500">
            <Link href="/login" className="hover:text-blue-600 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-blue-600 transition-colors">Registro</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Soporte</Link>
          </div>

          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            © 2026 Koda Software — Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}