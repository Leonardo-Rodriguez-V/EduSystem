const pool = require('../config/db');

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
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error('Error al crear anotación:', e);
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

module.exports = { obtenerPorAlumno, obtenerPorCurso, crearAnotacion, eliminarAnotacion };
