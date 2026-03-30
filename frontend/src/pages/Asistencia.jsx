import { useEffect, useState } from 'react';
import apiFetch from '../utils/api';

function Asistencia() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  const [curso, setCurso] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [asistencia, setAsistencia] = useState({}); // { id_alumno: 'presente' | 'ausente' | 'tardanza' }
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // 1. Cargar el curso del profesor
  useEffect(() => {
    const cargarCurso = async () => {
      setCargando(true);
      try {
        const res = await apiFetch('/cursos');
        const cursos = await res.json();

        // El profesor ve el curso donde es profesor jefe
        // El director ve todos, tomamos el primero por ahora
        const miCurso = cursos.find(c => c.id_profesor_jefe === usuario.id) || cursos[0];

        if (!miCurso) {
          setMensaje({ texto: 'No hay cursos registrados en el sistema.', tipo: 'error' });
          setCargando(false);
          return;
        }
        setCurso(miCurso);
      } catch {
        setMensaje({ texto: 'Error al cargar el curso.', tipo: 'error' });
        setCargando(false);
      }
    };
    cargarCurso();
  }, []);

  // 2. Cargar alumnos y asistencia existente cuando cambia el curso o la fecha
  useEffect(() => {
    if (!curso) return;
    const cargarAlumnos = async () => {
      setCargando(true);
      try {
        const res = await apiFetch(`/asistencia?id_curso=${curso.id}&fecha=${fecha}`);
        const datos = await res.json();

        if (!Array.isArray(datos)) {
          setMensaje({ texto: datos.error || 'Error al cargar alumnos.', tipo: 'error' });
          setAlumnos([]);
          return;
        }

        setAlumnos(datos);

        // Pre-cargar estados ya guardados (si existen)
        const estadosPrevios = {};
        datos.forEach(a => {
          if (a.estado) estadosPrevios[a.id] = a.estado;
        });
        setAsistencia(estadosPrevios);
      } catch {
        setMensaje({ texto: 'Error al cargar los alumnos.', tipo: 'error' });
      } finally {
        setCargando(false);
      }
    };
    cargarAlumnos();
  }, [curso, fecha]);

  const marcar = (id_alumno, estado) => {
    setAsistencia(prev => ({ ...prev, [id_alumno]: estado }));
    setMensaje({ texto: '', tipo: '' });
  };

  const marcarTodos = (estado) => {
    const todos = {};
    alumnos.forEach(a => { todos[a.id] = estado; });
    setAsistencia(todos);
  };

  const guardar = async () => {
    const sinMarcar = alumnos.filter(a => !asistencia[a.id]);
    if (sinMarcar.length > 0) {
      setMensaje({ texto: `Faltan ${sinMarcar.length} alumno(s) por marcar.`, tipo: 'error' });
      return;
    }

    setGuardando(true);
    try {
      const registros = alumnos.map(a => ({
        id_alumno: a.id,
        estado: asistencia[a.id],
        observacion: null,
      }));

      const res = await apiFetch('/asistencia/guardar', {
        method: 'POST',
        body: JSON.stringify({ id_curso: curso.id, fecha, registros }),
      });

      if (res.ok) {
        setMensaje({ texto: 'Asistencia guardada correctamente.', tipo: 'exito' });
      } else {
        const err = await res.json();
        setMensaje({ texto: err.error || 'Error al guardar.', tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión.', tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const presentes  = alumnos.filter(a => asistencia[a.id] === 'presente').length;
  const ausentes   = alumnos.filter(a => asistencia[a.id] === 'ausente').length;
  const tardanzas  = alumnos.filter(a => asistencia[a.id] === 'tardanza').length;

  const estadoBtn = (id_alumno, estado) => {
    const activo = asistencia[id_alumno] === estado;
    const estilos = {
      presente: activo ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
      ausente:  activo ? 'bg-rose-500 text-white'    : 'bg-rose-50 text-rose-700 hover:bg-rose-100',
      tardanza: activo ? 'bg-amber-400 text-white'   : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    };
    return `px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activo ? 'border-transparent' : 'border-slate-200'} ${estilos[estado]}`;
  };

  return (
    <div className="p-6 md:p-8 font-sans">
      {/* Encabezado */}
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800">Pasar Lista</h1>
        <p className="text-slate-500 mt-1">
          {curso ? <span className="font-semibold text-blue-600">{curso.nombre}</span> : 'Cargando curso...'}
        </p>
      </header>

      {/* Selector de fecha */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm font-bold text-slate-600">Fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div className="ml-auto flex gap-2 flex-wrap">
          <button onClick={() => marcarTodos('presente')} className="px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-slate-200 transition-all">
            Todos Presentes
          </button>
          <button onClick={() => marcarTodos('ausente')} className="px-3 py-2 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-slate-200 transition-all">
            Todos Ausentes
          </button>
        </div>
      </div>

      {/* Resumen */}
      {alumnos.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-emerald-600">{presentes}</p>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Presentes</p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-rose-600">{ausentes}</p>
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wide">Ausentes</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-amber-600">{tardanzas}</p>
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Tardanzas</p>
          </div>
        </div>
      )}

      {/* Mensaje */}
      {mensaje.texto && (
        <div className={`mb-4 p-4 rounded-xl text-sm font-medium border ${
          mensaje.tipo === 'exito'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Lista de alumnos */}
      {cargando ? (
        <p className="text-slate-400 animate-pulse text-center py-10">Cargando alumnos...</p>
      ) : alumnos.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400">No hay alumnos en este curso.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Alumno</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">RUT</th>
                <th className="text-center px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alumnos.map((alumno, i) => (
                <tr key={alumno.id} className={`transition-colors ${asistencia[alumno.id] ? '' : 'bg-slate-50'}`}>
                  <td className="px-5 py-3 text-slate-400 font-medium">{i + 1}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{alumno.nombre_completo}</td>
                  <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{alumno.rut}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => marcar(alumno.id, 'presente')} className={estadoBtn(alumno.id, 'presente')}>Presente</button>
                      <button onClick={() => marcar(alumno.id, 'tardanza')} className={estadoBtn(alumno.id, 'tardanza')}>Tardanza</button>
                      <button onClick={() => marcar(alumno.id, 'ausente')}  className={estadoBtn(alumno.id, 'ausente')}>Ausente</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Botón guardar */}
      {alumnos.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={guardar}
            disabled={guardando}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            {guardando ? 'Guardando...' : 'Guardar Asistencia'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Asistencia;
