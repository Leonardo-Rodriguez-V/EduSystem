const pool = require('../config/db');

// GET /api/alumnos  — opcionalmente filtrar por curso: ?id_curso=1
const obtenerAlumnos = async (req, res) => {
  const { id_curso } = req.query;
  try {
    let consulta = `
      SELECT a.*, c.nombre AS nombre_curso
      FROM alumnos a
      LEFT JOIN cursos c ON a.id_curso = c.id
    `;
    const valores = [];
    if (id_curso) {
      consulta += ' WHERE a.id_curso = $1';
      valores.push(id_curso);
    }
    consulta += ' ORDER BY a.nombre_completo ASC';
    const respuesta = await pool.query(consulta, valores);
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    res.status(500).json({ error: 'Error del servidor al obtener alumnos' });
  }
};

// GET /api/alumnos/:id
const obtenerAlumnoPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const respuesta = await pool.query(
      `SELECT a.*, c.nombre AS nombre_curso
       FROM alumnos a
       LEFT JOIN cursos c ON a.id_curso = c.id
       WHERE a.id = $1`,
      [id]
    );
    if (respuesta.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    res.status(200).json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al obtener alumno:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// POST /api/alumnos
const crearAlumno = async (req, res) => {
  const { nombre_completo, rut, fecha_nacimiento, id_curso } = req.body;
  try {
    const respuesta = await pool.query(
      'INSERT INTO alumnos (nombre_completo, rut, fecha_nacimiento, id_curso) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre_completo, rut, fecha_nacimiento, id_curso]
    );
    res.status(201).json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al crear alumno:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El RUT ya está registrado' });
    }
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
};

// PUT /api/alumnos/:id
const actualizarAlumno = async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, rut, fecha_nacimiento, id_curso } = req.body;
  try {
    const respuesta = await pool.query(
      `UPDATE alumnos
       SET nombre_completo = $1, rut = $2, fecha_nacimiento = $3, id_curso = $4
       WHERE id = $5
       RETURNING *`,
      [nombre_completo, rut, fecha_nacimiento, id_curso, id]
    );
    if (respuesta.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    res.status(200).json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al actualizar alumno:', error);
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
};

// DELETE /api/alumnos/:id
const eliminarAlumno = async (req, res) => {
  const { id } = req.params;
  try {
    const respuesta = await pool.query('DELETE FROM alumnos WHERE id = $1 RETURNING id', [id]);
    if (respuesta.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    res.status(200).json({ mensaje: 'Alumno eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar alumno:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { obtenerAlumnos, obtenerAlumnoPorId, crearAlumno, actualizarAlumno, eliminarAlumno };
