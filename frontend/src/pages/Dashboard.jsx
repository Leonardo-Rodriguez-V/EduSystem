function Dashboard() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">Panel Principal</h1>
      <p className="text-slate-600">Bienvenido al sistema EduSync. Aquí podrás ver un resumen de tus actividades.</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-800">Cursos</h2>
          <p className="text-4xl font-bold text-blue-600 mt-2">12</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100">
          <h2 className="text-xl font-semibold text-emerald-800">Tareas Pendientes</h2>
          <p className="text-4xl font-bold text-emerald-600 mt-2">5</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
          <h2 className="text-xl font-semibold text-amber-800">Próximos Eventos</h2>
          <p className="text-4xl font-bold text-amber-600 mt-2">2</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
