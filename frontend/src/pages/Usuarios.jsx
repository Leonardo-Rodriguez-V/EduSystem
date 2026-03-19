import { useEffect, useState } from 'react';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/usuarios')
      .then((respuesta) => respuesta.json())
      .then((datos) => setUsuarios(datos))
      .catch((error) => console.error('Error de conexión:', error));
  }, []);

  return (
    <div className="p-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Lista de Usuarios</h1>
        <p className="text-slate-500">Gestión de usuarios registrados en el sistema.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {usuarios.map((usuario) => (
          <div key={usuario.id} className="bg-white p-6 rounded-xl shadow border-t-4 border-blue-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              {usuario.nombre_completo}
            </h2>
            <p className="text-slate-600 mb-4">{usuario.correo}</p>
            
            <span className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold uppercase">
              Rol: {usuario.rol}
            </span>
          </div>
        ))}
        
        {usuarios.length === 0 && (
          <div className="col-span-full text-center p-10 bg-white rounded-xl shadow text-slate-500">
            Buscando usuarios en la base de datos...
          </div>
        )}
      </div>
    </div>
  );
}

export default Usuarios;
