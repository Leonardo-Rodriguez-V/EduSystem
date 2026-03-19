import { useEffect, useState } from 'react';

function Dashboard() {
  const [cursos, setCursos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  // Obtener datos del usuario desde localStorage
  const usuario = JSON.parse(localStorage.getItem('usuario')) || { nombre_completo: 'Usuario', rol: 'Invitado' };

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const respuesta = await fetch('http://localhost:3000/api/cursos');
        if (!respuesta.ok) throw new Error('Error al conectar con el servidor');
        const datos = await respuesta.json();
        setCursos(datos);
      } catch (err) {
        console.error('Error:', err);
        setError('No se pudieron cargar los cursos. Verifica la conexión con el servidor.');
      } finally {
        setCargando(false);
      }
    };

    fetchCursos();
  }, []);

  return (
    <div className="p-8 font-sans">
      {/* Encabezado de Bienvenida */}
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800">
          Bienvenido, <span className="text-blue-600">{usuario.nombre_completo}</span>
        </h1>
        <p className="text-slate-500 text-lg mt-1 capitalize">Rol: {usuario.rol}</p>
      </header>

      {/* Grid de Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Mis Cursos registrados</p>
          <p className="text-3xl font-black text-slate-800">{cursos.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Mis Alumnos</p>
          <p className="text-3xl font-black text-slate-800">0</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Pendientes</p>
          <p className="text-3xl font-black text-slate-800">0</p>
        </div>
      </div>

      {/* Sección de Cursos */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-700">Cursos Registrados</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all">
            + Nuevo Curso
          </button>
        </div>

        {error && (
          <div className="bg-rose-100 text-rose-700 p-4 rounded-xl border border-rose-200 mb-6">
            {error}
          </div>
        )}

        {cargando ? (
          <p className="text-slate-400 animate-pulse">Cargando cursos...</p>
        ) : cursos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cursos.map((curso) => (
              <div key={curso.id} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden hover:shadow-xl transition-all group">
                <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 p-6 flex flex-col justify-end">
                  <h3 className="text-white text-xl font-bold leading-tight">{curso.nombre}</h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center text-slate-500 text-sm mb-4">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold mr-2">AÑO {curso.anio}</span>
                    <span>• 0 Alumnos</span>
                  </div>
                  <button className="w-full py-2 bg-slate-50 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-700 rounded-lg text-sm font-bold transition-colors">
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 text-lg">No hay cursos registrados en el sistema aún.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
