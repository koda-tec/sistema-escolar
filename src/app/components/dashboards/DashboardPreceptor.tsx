export default function DashboardPreceptor({ profile }: { profile: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-8 rounded-2rem border border-slate-100">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Tareas de Hoy</h3>
        <ul className="space-y-4">
          <li className="flex items-center gap-3 text-sm font-medium">
             <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
             Pasar lista a 4to Año "A"
          </li>
          <li className="flex items-center gap-3 text-sm font-medium text-slate-400">
             <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">○</span>
             Cargar libretas pendientes
          </li>
        </ul>
      </div>
      
      <div className="bg-linear-to-br from-slate-800 to-slate-950 p-8 rounded-2rem text-white">
         <h3 className="font-black text-xl mb-2">Acceso Rápido</h3>
         <p className="text-slate-400 text-sm mb-6">Gestioná tus alumnos vinculados.</p>
         <button className="bg-blue-600 px-6 py-3 rounded-xl font-bold text-sm">Ir a Gestión de Alumnos</button>
      </div>
    </div>
  );
}