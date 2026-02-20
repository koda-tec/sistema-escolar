import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* Navbar Responsiva */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">ESRN N° 100</h1>
            </div>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-md shadow-blue-200">
              Acceso Sistema
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-16 lg:py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium tracking-wider text-blue-700 uppercase bg-blue-100 rounded-full">
            Plataforma Digital Institucional
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
            La escuela, más cerca <br/><span className="text-blue-600 font-black">que nunca.</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            Gestioná asistencias, recibí comunicados y consultá libretas en tiempo real desde cualquier dispositivo.
          </p>
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-20"></div>
            <img 
              src="https://images.unsplash.com/photo-1523050853063-9158946122a2?q=80&w=1200" 
              alt="Escuela Digital" 
              className="relative w-full rounded-2xl shadow-2xl border border-white object-cover h-300px md:h-500px"
            />
          </div>
        </div>
      </header>

      {/* Grid de Secciones */}
      <section className="max-w-7xl mx-auto py-16 px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: "Autoridades", desc: "Equipo directivo y cuerpo docente comprometido con la excelencia.", icon: "👥" },
          { title: "Gestión Académica", desc: "Calendario escolar, exámenes y normativas vigentes.", icon: "📚" },
          { title: "Comunicación", desc: "Canal bidireccional directo entre familias e institución.", icon: "🔔" }
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="text-4xl mb-4">{item.icon}</div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">{item.title}</h3>
            <p className="text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      <footer className="py-12 text-center text-slate-400 border-t border-slate-200">
        <p className="text-sm">© 2024 ESRN N° 100 — Desarrollado por <span className="font-bold text-slate-600">Koda</span></p>
      </footer>
    </div>
  )
}