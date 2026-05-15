const pool = require('../config/db');
const { alertaAnotacionNegativa } = require('../services/emailService');

// GET /api/anotaciones?id_alumno=X
const obtenerPorAlumno = async (req, res) => {
  const { id_alumno } = req.query;
  if (!id_alumno) return res.status(400).json({ error: 'Se requiere id_alumno' });
  try {
    const r = await pool.query(
      `SELECT an.*, u.nombre_completo AS nombre_profesor, al.nombre_completo AS nombre_alumno
       FROM anotaciones an
       LEFT JOIN usuarios u  ON an.id_profesor = u.id
       LEFT JOIN alumnos  al ON an.id_alumno   = al.id
       WHERE an.id_alumno = $1
       ORDER BY an.fecha DESC, an.creado_en DESC`,
      [id_alumno]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('Error al obtener anotaciones:', e);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/anotaciones/curso/:id_curso
const obtenerPorCurso = async (req, res) => {
  const { id_curso } = req.params;
  try {
    const r = await pool.query(
      `SELECT an.*, u.nombre_completo AS nombre_profesor, al.nombre_completo AS nombre_alumno
       FROM anotaciones an
       LEFT JOIN usuarios u  ON an.id_profesor = u.id
       JOIN      alumnos  al ON an.id_alumno   = al.id
       WHERE al.id_curso = $1
       ORDER BY an.fecha DESC, an.creado_en DESC`,
      [id_curso]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('Error al obtener anotaciones por curso:', e);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// POST /api/anotaciones
const crearAnotacion = async (req, res) => {
  const { id_alumno, id_profesor, texto, tipo, fecha } = req.body;
  if (!id_alumno || !texto) return res.status(400).json({ error: 'id_alumno y texto son obligatorios' });
  try {
    const r = await pool.query(
      `INSERT INTO anotaciones (id_alumno, id_profesor, texto, tipo, fecha)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_alumno, id_profesor || null, texto, tipo || 'observacion', fecha || new Date()]
    );
    const nueva = r.rows[0];

    // Email al apoderado si anotación negativa — solo Plan Premium (fire-and-forget)
    const esPremiumAnot = ['profesional', 'enterprise'].includes(req.usuario?.plan);
    if (esPremiumAnot && nueva.tipo === 'negativa') {
      pool.query(`
        SELECT u.correo, u.nombre_completo AS nombre_apoderado,
               al.nombre_completo AS nombre_alumno,
               prof.nombre_completo AS nombre_profesor
        FROM alumnos al
        JOIN apoderado_alumno aa ON aa.id_alumno = al.id
        JOIN usuarios u ON u.id = aa.id_apoderado
        LEFT JOIN usuarios prof ON prof.id = $2
        WHERE al.id = $1
      `, [nueva.id_alumno, nueva.id_profesor])
        .then(({ rows }) => {
          rows.forEach(r => alertaAnotacionNegativa(
            r.correo, r.nombre_apoderado, r.nombre_alumno,
            nueva.texto, r.nombre_profesor || 'Profesor'
          ));
        })
        .catch(err => console.error('[EMAIL] Error anotación:', err.message));
    }

    res.status(201).json(nueva);
  } catch (e) {
    console.error('Error al crear anotación:', e);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// PUT /api/anotaciones/:id
const actualizarAnotacion = async (req, res) => {
  const { id } = req.params;
  const { texto, tipo } = req.body;
  if (!texto?.trim()) return res.status(400).json({ error: 'El texto es obligatorio' });
  try {
    const check = await pool.query('SELECT id_profesor FROM anotaciones WHERE id=$1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Anotación no encontrada' });

    const esDirector   = req.usuario.rol === 'director';
    const esAutor      = String(check.rows[0].id_profesor) === String(req.usuario.id);
    if (!esDirector && !esAutor) return res.status(403).json({ error: 'Sin permiso para editar esta anotación' });

    const r = await pool.query(
      `UPDATE anotaciones SET texto=$1, tipo=$2 WHERE id=$3
       RETURNING *`,
      [texto.trim(), tipo || 'observacion', id]
    );
    res.json(r.rows[0]);
  } catch (e) {
    console.error('Error al actualizar anotación:', e);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// DELETE /api/anotaciones/:id
const eliminarAnotacion = async (req, res) => {
  const { id } = req.params;
  try {
    const r = await pool.query('DELETE FROM anotaciones WHERE id=$1 RETURNING id', [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Anotación no encontrada' });
    res.json({ mensaje: 'Anotación eliminada' });
  } catch (e) {
    console.error('Error al eliminar anotación:', e);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { obtenerPorAlumno, obtenerPorCurso, crearAnotacion, actualizarAnotacion, eliminarAnotacion };
