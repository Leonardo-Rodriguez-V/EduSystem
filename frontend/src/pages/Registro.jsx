import { useState } from 'react';

function Registro() {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo: '',
    contraseña: '',
    rol: 'profesor' // Valor inicial por defecto
  });
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });

    if (formData.contraseña.length < 8 || !/\d/.test(formData.contraseña)) {
      setMensaje({ texto: 'La contraseña debe tener al menos 8 caracteres y un número', tipo: 'error' });
      return;
    }

    try {
      const respuesta = await fetch('http://localhost:3000/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const datos = await respuesta.json();

      if (respuesta.status === 201) {
        setMensaje({ texto: '¡Usuario registrado con éxito! 🎉', tipo: 'exito' });
        setFormData({ nombre_completo: '', correo: '', contraseña: '', rol: 'profesor' });
      } else {
        setMensaje({ 
          texto: `Error: ${datos.detail || 'No se pudo registrar el usuario'}`, 
          tipo: 'error' 
        });
      }
    } catch (error) {
      setMensaje({ texto: 'Error de conexión con el servidor', tipo: 'error' });
    }
  };

  return (
    <div className="p-10 flex justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 w-full max-w-lg">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800">Registro de Usuario</h1>
          <p className="text-slate-500">Completa los datos para dar de alta en EduSync</p>
        </header>

        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
            mensaje.tipo === 'exito' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Ej: Ana Gomez"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="ana@edusync.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              name="contraseña"
              value={formData.contraseña}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Mínimo 8 caracteres y un número"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Rol en el Sistema</label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
            >
              <option value="director">Director</option>
              <option value="profesor">Profesor</option>
              <option value="apoderado">Apoderado</option>
            </select>
            {/* 
              NOTA PARA INTEGRANTE 1: 
              A futuro, si el rol seleccionado es 'apoderado', se debe desplegar un campo adicional
              para ingresar el ID del alumno vinculado a este apoderado.
            */}
            <p className="mt-2 text-xs text-slate-400 italic">
              * Selección de roles institucionales autorizados.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98]"
          >
            Registrar Usuario
          </button>
        </form>
      </div>
    </div>
  );
}

export default Registro;
