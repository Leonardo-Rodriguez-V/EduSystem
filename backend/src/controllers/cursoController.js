const pool = require('../config/db');

// Obtener todos los cursos
const obtenerCursos = async (req, res) => {
  try {
    const respuesta = await pool.query('SELECT * FROM cursos ORDER BY creado_en DESC');
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    res.status(500).json({ error: 'Error del servidor al obtener cursos' });
  }
};

// Crear un nuevo curso
const crearCurso = async (req, res) => {
  const { nombre, anio, id_profesor_jefe } = req.body;
  try {
    const consulta = 'INSERT INTO cursos (nombre, anio, id_profesor_jefe) VALUES ($1, $2, $3) RETURNING *';
    const valores = [nombre, anio, id_profesor_jefe];
    const respuesta = await pool.query(consulta, valores);
    res.status(201).json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al crear curso:', error);
    res.status(500).json({ error: 'Error del servidor al crear curso', detalle: error.message });
  }
};

module.exports = {
  obtenerCursos,
  crearCurso,
};
