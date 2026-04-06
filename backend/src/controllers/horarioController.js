const pool = require('../config/db');

// GET /api/horarios/curso/:id_curso
const obtenerHorarioPorCurso = async (req, res) => {
  const { id_curso } = req.params;
  try {
    const respuesta = await pool.query(
      `SELECT h.id, h.id_curso, h.dia_semana, h.hora_inicio, h.hora_fin,
              TO_CHAR(h.hora_inicio, 'HH24:MI') AS bloque_inicio,
              TO_CHAR(h.hora_fin,   'HH24:MI') AS bloque_fin,
              a.nombre AS nombre_asignatura,
              u.nombre_completo AS nombre_profesor
       FROM horario h
       JOIN asignaturas a ON h.id_asignatura = a.id
       LEFT JOIN usuarios u ON h.id_profesor = u.id
       WHERE h.id_curso = $1
       ORDER BY h.dia_semana, h.hora_inicio`,
      [id_curso]
    );
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener horario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = {
  obtenerHorarioPorCurso
};
