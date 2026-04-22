const pool = require('../config/db');

// GET /api/notas?id_alumno=1&id_asignatura=2
const obtenerNotasPorAlumno = async (req, res) => {
  const { id_alumno, id_asignatura } = req.query;
  if (!id_alumno) {
    return res.status(400).json({ error: 'Se requiere id_alumno' });
  }
  try {
    let consulta = `
      SELECT n.*, al.nombre_completo AS nombre_alumno, asig.nombre AS nombre_asignatura
      FROM notas n
      JOIN alumnos al ON n.id_alumno = al.id
      LEFT JOIN asignaturas asig ON n.id_asignatura = asig.id
      WHERE n.id_alumno = $1
    `;
    const valores = [id_alumno];

    if (id_asignatura) {
      consulta += ` AND n.id_asignatura = $2`;
      valores.push(id_asignatura);
    }

    consulta += ` ORDER BY n.fecha DESC`;

    const respuesta = await pool.query(consulta, valores);
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener notas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/notas/curso/:id_curso?id_asignatura=2
const obtenerNotasPorCurso = async (req, res) => {
  const { id_curso } = req.params;
  const { id_asignatura } = req.query;
  try {
    let consulta = `
      SELECT n.*, al.nombre_completo AS nombre_alumno, al.rut, asig.nombre AS nombre_asignatura
      FROM notas n
      JOIN alumnos al ON n.id_alumno = al.id
      LEFT JOIN asignaturas asig ON n.id_asignatura = asig.id
      WHERE al.id_curso = $1
    `;
    const valores = [id_curso];

    if (id_asignatura) {
      consulta += ` AND n.id_asignatura = $2`;
      valores.push(id_asignatura);
    }

    consulta += ` ORDER BY al.nombre_completo ASC, n.fecha DESC`;

    const respuesta = await pool.query(consulta, valores);
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener notas del curso:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// POST /api/notas
const crearNota = async (req, res) => {
  const { id_alumno, descripcion, calificacion, fecha, id_asignatura } = req.body;
  if (!id_alumno || !descripcion || calificacion === undefined) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const respuesta = await pool.query(
      `INSERT INTO notas (id_alumno, descripcion, calificacion, fecha, id_asignatura)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id_alumno, descripcion, calificacion, fecha || new Date(), id_asignatura]
    );

    const nuevaNota = respuesta.rows[0];

    // Emitir evento Real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('new_grade', {
        mensaje: `Nueva nota subida: ${nuevaNota.descripcion}`,
        calificacion: nuevaNota.calificacion,
        id_alumno: nuevaNota.id_alumno
      });
    }

    res.status(201).json(nuevaNota);
  } catch (error) {
    console.error('Error al crear nota:', error);
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
};

// PUT /api/notas/:id
const actualizarNota = async (req, res) => {
  const { id } = req.params;
  const { descripcion, calificacion, fecha, id_asignatura } = req.body;
  try {
    const respuesta = await pool.query(
      `UPDATE notas
       SET descripcion = $1, calificacion = $2, fecha = $3, id_asignatura = $4
       WHERE id = $5
       RETURNING *`,
      [descripcion, calificacion, fecha, id_asignatura, id]
    );
    if (respuesta.rows.length === 0) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    res.status(200).json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al actualizar nota:', error);
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
};

// DELETE /api/notas/:id
const eliminarNota = async (req, res) => {
  const { id } = req.params;
  try {
    const respuesta = await pool.query(
      'DELETE FROM notas WHERE id = $1 RETURNING id', [id]
    );
    if (respuesta.rows.length === 0) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    res.status(200).json({ mensaje: 'Nota eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar nota:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/notas/config/asignaturas?id_profesor=...&id_curso=...
const obtenerAsignaturasPorProfesorYCurso = async (req, res) => {
  const { id_profesor, id_curso } = req.query;
  try {
    const respuesta = await pool.query(
      `SELECT a.* 
       FROM asignaturas a
       JOIN curso_asignatura_profesor cap ON a.id = cap.id_asignatura
       WHERE cap.id_profesor = $1 AND cap.id_curso = $2
       ORDER BY a.nombre ASC`,
      [id_profesor, id_curso]
    );
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener asignaturas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/notas/asignaturas-curso/:id_curso
// Devuelve todas las asignaturas que se enseñan en un curso (para mostrarlas aunque no haya notas)
const obtenerAsignaturasPorCurso = async (req, res) => {
  const { id_curso } = req.params;
  try {
    const respuesta = await pool.query(
      `SELECT DISTINCT a.id, a.nombre
       FROM asignaturas a
       JOIN curso_asignatura_profesor cap ON a.id = cap.id_asignatura
       WHERE cap.id_curso = $1
       ORDER BY a.nombre ASC`,
      [id_curso]
    );
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener asignaturas del curso:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/notas/promedio-cursos
const obtenerPromedioPorCurso = async (req, res) => {
  try {
    const respuesta = await pool.query(`
      SELECT
        c.id,
        c.nombre,
        ROUND(AVG(n.calificacion)::numeric, 1) AS promedio,
        COUNT(n.id)::int AS total_notas,
        COUNT(DISTINCT al.id)::int AS total_alumnos,
        COUNT(CASE WHEN n.calificacion >= 4.0 THEN 1 END)::int AS aprobados,
        COUNT(CASE WHEN n.calificacion < 4.0  THEN 1 END)::int AS reprobados
      FROM cursos c
      LEFT JOIN alumnos al ON al.id_curso = c.id
      LEFT JOIN notas n ON n.id_alumno = al.id
      GROUP BY c.id, c.nombre
      ORDER BY c.nombre
    `);
    res.json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener promedio por curso:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/notas/analitica/riesgo?limite=4.0
const obtenerAlumnosEnRiesgoAcademico = async (req, res) => {
  const limite = req.query.limite || 4.0;
  try {
    const respuesta = await pool.query(`
      SELECT 
        al.id, 
        al.nombre_completo, 
        c.nombre AS nombre_curso,
        ROUND(AVG(n.calificacion)::numeric, 1) AS promedio,
        COUNT(CASE WHEN n.calificacion < 4.0 THEN 1 END)::int AS reprobadas
      FROM alumnos al
      JOIN cursos c ON al.id_curso = c.id
      LEFT JOIN notas n ON n.id_alumno = al.id
      GROUP BY al.id, al.nombre_completo, c.nombre
      HAVING 
        COUNT(n.id) > 2 AND 
        AVG(n.calificacion) < $1
      ORDER BY promedio ASC
      LIMIT 10
    `, [limite]);
    res.json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener alumnos en riesgo académico:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/notas/analitica/top
const obtenerMejoresPromedios = async (req, res) => {
  try {
    const respuesta = await pool.query(`
      SELECT 
        al.id, 
        al.nombre_completo, 
        c.nombre AS nombre_curso,
        ROUND(AVG(n.calificacion)::numeric, 1) AS promedio
      FROM alumnos al
      JOIN cursos c ON al.id_curso = c.id
      LEFT JOIN notas n ON n.id_alumno = al.id
      GROUP BY al.id, al.nombre_completo, c.nombre
      HAVING COUNT(n.id) > 2
      ORDER BY promedio DESC
      LIMIT 10
    `);
    res.json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener mejores promedios:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = {
  obtenerNotasPorAlumno,
  obtenerNotasPorCurso,
  crearNota,
  actualizarNota,
  eliminarNota,
  obtenerAsignaturasPorProfesorYCurso,
  obtenerAsignaturasPorCurso,
  obtenerPromedioPorCurso,
  obtenerAlumnosEnRiesgoAcademico,
  obtenerMejoresPromedios,
};

