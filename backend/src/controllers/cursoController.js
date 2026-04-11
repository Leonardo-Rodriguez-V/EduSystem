const pool = require('../config/db');

// Obtener todos los cursos
const obtenerCursos = async (req, res) => {
  const { id_profesor } = req.query;
  try {
    let consulta = '';
    let valores = [];

    if (id_profesor) {
      consulta = `
        SELECT * FROM (
          SELECT c.* FROM cursos c WHERE c.id_profesor_jefe = $1
          UNION
          SELECT c.* FROM cursos c
          JOIN curso_asignatura_profesor cap ON c.id = cap.id_curso
          WHERE cap.id_profesor = $1
        ) sub
        ORDER BY
          CASE nombre
            WHEN 'Pre-Kínder (NT1)' THEN 1
            WHEN 'Kínder (NT2)'     THEN 2
            WHEN '1° Básico'        THEN 3
            WHEN '2° Básico'        THEN 4
            WHEN '3° Básico'        THEN 5
            WHEN '4° Básico'        THEN 6
            WHEN '5° Básico'        THEN 7
            WHEN '6° Básico'        THEN 8
            WHEN '7° Básico'        THEN 9
            WHEN '8° Básico'        THEN 10
            WHEN '1° Medio'         THEN 11
            WHEN '2° Medio'         THEN 12
            WHEN '3° Medio'         THEN 13
            WHEN '4° Medio'         THEN 14
            ELSE 15
          END
      `;
      valores = [id_profesor];
    } else {
      consulta = `
        SELECT * FROM cursos
        ORDER BY
          CASE nombre
            WHEN 'Pre-Kínder (NT1)' THEN 1
            WHEN 'Kínder (NT2)'     THEN 2
            WHEN '1° Básico'        THEN 3
            WHEN '2° Básico'        THEN 4
            WHEN '3° Básico'        THEN 5
            WHEN '4° Básico'        THEN 6
            WHEN '5° Básico'        THEN 7
            WHEN '6° Básico'        THEN 8
            WHEN '7° Básico'        THEN 9
            WHEN '8° Básico'        THEN 10
            WHEN '1° Medio'         THEN 11
            WHEN '2° Medio'         THEN 12
            WHEN '3° Medio'         THEN 13
            WHEN '4° Medio'         THEN 14
            ELSE 15
          END
      `;
    }

    const respuesta = await pool.query(consulta, valores);
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
