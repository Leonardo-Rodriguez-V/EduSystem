const pool = require('../config/db');

// GET /api/evaluaciones/curso/:id_curso
const obtenerEvaluacionesPorCurso = async (req, res) => {
  const { id_curso } = req.params;
  try {
    const respuesta = await pool.query(
      `SELECT e.*, a.nombre as nombre_asignatura, p.nombre_completo as nombre_profesor
       FROM evaluaciones e
       JOIN asignaturas a ON e.id_asignatura = a.id
       JOIN usuarios p ON e.id_profesor = p.id
       WHERE e.id_curso = $1
       ORDER BY e.fecha ASC`,
      [id_curso]
    );
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener evaluaciones:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// POST /api/evaluaciones
const crearEvaluacion = async (req, res) => {
  const { id_curso, id_asignatura, id_profesor, titulo, descripcion, fecha } = req.body;
  try {
    const respuesta = await pool.query(
      `INSERT INTO evaluaciones (id_curso, id_asignatura, id_profesor, titulo, descripcion, fecha)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id_curso, id_asignatura, id_profesor, titulo, descripcion, fecha]
    );
    res.status(201).json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al crear evaluación:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/evaluaciones/pendientes?id_profesor=X
// Evaluaciones cuya fecha ya pasó, creadas por el profesor
const obtenerEvaluacionesPendientes = async (req, res) => {
  const { id_profesor } = req.query;
  if (!id_profesor) return res.status(400).json({ error: 'Se requiere id_profesor' });
  try {
    const respuesta = await pool.query(
      `SELECT COUNT(id)::int AS total
       FROM evaluaciones
       WHERE id_profesor = $1 AND fecha <= CURRENT_DATE`,
      [id_profesor]
    );
    res.json({ total: respuesta.rows[0].total });
  } catch (error) {
    console.error('Error al obtener evaluaciones pendientes:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = {
  obtenerEvaluacionesPorCurso,
  crearEvaluacion,
  obtenerEvaluacionesPendientes,
};
