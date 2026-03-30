const pool = require('../config/db');

// GET /api/notas?id_alumno=1
const obtenerNotasPorAlumno = async (req, res) => {
  const { id_alumno } = req.query;
  if (!id_alumno) {
    return res.status(400).json({ error: 'Se requiere id_alumno' });
  }
  try {
    const respuesta = await pool.query(
      `SELECT n.*, al.nombre_completo AS nombre_alumno
       FROM notas n
       JOIN alumnos al ON n.id_alumno = al.id
       WHERE n.id_alumno = $1
       ORDER BY n.fecha DESC`,
      [id_alumno]
    );
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener notas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/notas/curso/:id_curso
// Todas las notas de los alumnos de un curso
const obtenerNotasPorCurso = async (req, res) => {
  const { id_curso } = req.params;
  try {
    const respuesta = await pool.query(
      `SELECT n.*, al.nombre_completo AS nombre_alumno, al.rut
       FROM notas n
       JOIN alumnos al ON n.id_alumno = al.id
       WHERE al.id_curso = $1
       ORDER BY al.nombre_completo ASC, n.fecha DESC`,
      [id_curso]
    );
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener notas del curso:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// POST /api/notas
const crearNota = async (req, res) => {
  const { id_alumno, descripcion, calificacion, fecha } = req.body;
  if (!id_alumno || !descripcion || calificacion === undefined) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const respuesta = await pool.query(
      `INSERT INTO notas (id_alumno, descripcion, calificacion, fecha)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id_alumno, descripcion, calificacion, fecha || new Date()]
    );
    res.status(201).json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al crear nota:', error);
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
};

// PUT /api/notas/:id
const actualizarNota = async (req, res) => {
  const { id } = req.params;
  const { descripcion, calificacion, fecha } = req.body;
  try {
    const respuesta = await pool.query(
      `UPDATE notas
       SET descripcion = $1, calificacion = $2, fecha = $3
       WHERE id = $4
       RETURNING *`,
      [descripcion, calificacion, fecha, id]
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

module.exports = {
  obtenerNotasPorAlumno,
  obtenerNotasPorCurso,
  crearNota,
  actualizarNota,
  eliminarNota,
};
