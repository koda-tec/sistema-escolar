import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Navbar Simple */}
      <nav className="flex justify-between items-center p-6 border-b">
        <h1 className="text-xl font-bold text-blue-800">ESRN N° 100</h1>
        <div className="space-x-4">
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
            Acceso Sistema
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-20 px-6 text-center bg-linear-to-b from-blue-50 to-white">
        <h2 className="text-5xl font-extrabold text-gray-900 mb-4">
          Bienvenidos a la Plataforma Digital
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Comunicación directa, gestión de asistencias y libretas digitales en un solo lugar.
        </p>
        <img 
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1000" 
          alt="Escuela" 
          className="w-full max-w-4xl mx-auto rounded-2xl shadow-2xl h-64 object-cover"
        />
      </header>

      {/* Secciones Informativas */}
      <section className="py-16 grid md:grid-cols-3 gap-8 px-10">
        <div className="p-6 border rounded-xl hover:shadow-md transition">
          <h3 className="font-bold text-xl mb-2">Autoridades</h3>
          <p className="text-gray-600 italic">Director: Nombre Apellido</p>
          <p className="text-gray-600 italic">Vicedirector: Nombre Apellido</p>
        </div>
        <div className="p-6 border rounded-xl hover:shadow-md transition">
          <h3 className="font-bold text-xl mb-2">Información Académica</h3>
          <p className="text-gray-600">Calendario escolar 2024, periodos de exámenes y normativas.</p>
        </div>
        <div className="p-6 border rounded-xl hover:shadow-md transition">
          <h3 className="font-bold text-xl mb-2">Contacto</h3>
          <p className="text-gray-600">Email: institucional@escuela.edu.ar</p>
          <p className="text-gray-600">Teléfono: (123) 456-7890</p>
        </div>
      </section>

      <footer className="py-8 text-center text-gray-400 border-t">
        <p>© 2024 Desarrollado por Koda</p>
      </footer>
    </div>
  )
}