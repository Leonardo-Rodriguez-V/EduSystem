const pool = require('../config/db');
const { alertaAsistencia } = require('../services/emailService');

// GET /api/asistencia?id_curso=1&fecha=2026-03-20
// Alumnos del curso con su estado de asistencia para esa fecha
const obtenerAsistenciaPorCursoYFecha = async (req, res) => {
  const { id_curso, fecha } = req.query;
  if (!id_curso || !fecha) {
    return res.status(400).json({ error: 'Se requieren id_curso y fecha' });
  }
  try {
    const respuesta = await pool.query(
      `SELECT
         al.id,
         al.nombre_completo,
         al.rut,
         asi.estado,
         asi.id AS id_asistencia,
         asi.justificacion
       FROM alumnos al
       LEFT JOIN asistencia asi
         ON asi.id_alumno = al.id
         AND asi.fecha = $2
       WHERE al.id_curso = $1
       ORDER BY al.nombre_completo ASC`,
      [id_curso, fecha]
    );
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener asistencia:', error);
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
};

// GET /api/asistencia/alumno/:id_alumno
const obtenerAsistenciaPorAlumno = async (req, res) => {
  const { id_alumno } = req.params;
  try {
    const respuesta = await pool.query(
      `SELECT * FROM asistencia
       WHERE id_alumno = $1
       ORDER BY fecha DESC`,
      [id_alumno]
    );
    res.status(200).json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener asistencia del alumno:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// POST /api/asistencia/guardar
// Body: { fecha, registros: [{ id_alumno, estado }] }
const guardarAsistencia = async (req, res) => {
  const { fecha, registros } = req.body;
  if (!fecha || !Array.isArray(registros) || registros.length === 0) {
    return res.status(400).json({ error: 'Se requieren fecha y registros' });
  }
  const ids = registros.map(r => r.id_alumno);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Borrar registros existentes para esa fecha y esos alumnos
    await client.query(
      `DELETE FROM asistencia WHERE fecha = $1 AND id_alumno = ANY($2::int[])`,
      [fecha, ids]
    );
    // Insertar todos de nuevo
    for (const reg of registros) {
      await client.query(
        `INSERT INTO asistencia (id_alumno, fecha, estado) VALUES ($1, $2, $3)`,
        [reg.id_alumno, fecha, reg.estado]
      );
    }
    await client.query('COMMIT');

    // Emitir evento Real-time
    const io = req.app.get('io');
    if (io) {
      const presentes = registros.filter(r => r.estado === 'presente').length;
      io.emit('attendance_report', {
        mensaje: `Resumen de asistencia guardado para el ${fecha}`,
        presentes,
        totales: registros.length
      });
    }

    res.status(200).json({ mensaje: 'Asistencia guardada correctamente' });

    // Email a apoderados con asistencia < 85% — solo Plan Premium (fire-and-forget)
    const esPremiumAsist = ['profesional', 'enterprise'].includes(req.usuario?.plan);
    if (!esPremiumAsist) return;
    pool.query(`
      SELECT al.id, al.nombre_completo AS nombre_alumno,
             u.correo, u.nombre_completo AS nombre_apoderado,
             ROUND(100.0 * SUM(CASE WHEN asi.estado = 'presente' THEN 1 ELSE 0 END)
               / NULLIF(COUNT(asi.id), 0), 1) AS porcentaje
      FROM alumnos al
      JOIN apoderado_alumno aa ON aa.id_alumno = al.id
      JOIN usuarios u ON u.id = aa.id_apoderado
      JOIN asistencia asi ON asi.id_alumno = al.id
      WHERE al.id = ANY($1::int[])
      GROUP BY al.id, al.nombre_completo, u.correo, u.nombre_completo
      HAVING COUNT(asi.id) >= 5
        AND ROUND(100.0 * SUM(CASE WHEN asi.estado = 'presente' THEN 1 ELSE 0 END)
          / NULLIF(COUNT(asi.id), 0), 1) < 85
    `, [ids])
      .then(({ rows }) => {
        rows.forEach(r => alertaAsistencia(r.correo, r.nombre_apoderado, r.nombre_alumno, r.porcentaje));
      })
      .catch(err => console.error('[EMAIL] Error asistencia:', err.message));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar asistencia:', error);
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  } finally {
    client.release();
  }
};

// GET /api/asistencia/resumen?id_curso=1
const obtenerResumenPorCurso = async (req, res) => {
  const { id_curso } = req.query;
  if (!id_curso) return res.status(400).json({ error: 'Se requiere id_curso' });
  try {
    const respuesta = await pool.query(
      `SELECT
         COUNT(CASE WHEN asi.estado = 'presente' THEN 1 END) AS presentes,
         COUNT(CASE WHEN asi.estado = 'ausente'  THEN 1 END) AS ausentes,
         COUNT(CASE WHEN asi.estado = 'tardanza' THEN 1 END) AS tardanzas,
         COUNT(asi.id) AS total_registros
       FROM alumnos al
       LEFT JOIN asistencia asi ON asi.id_alumno = al.id
       WHERE al.id_curso = $1`,
      [id_curso]
    );
    res.status(200).json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/asistencia/resumen-cursos?mes=3&anio=2026
const obtenerResumenPorTodosLosCursos = async (req, res) => {
  const { mes, anio } = req.query;
  const colegio_id = req.usuario?.colegio_id;
  try {
    const valores = colegio_id ? [colegio_id] : [];
    const filtroColegio = colegio_id ? `WHERE c.colegio_id = $1` : '';
    let filtroFecha = '';
    const base = colegio_id ? 2 : 1;
    if (mes && anio) {
      filtroFecha = `AND EXTRACT(MONTH FROM asi.fecha) = $${base} AND EXTRACT(YEAR FROM asi.fecha) = $${base + 1}`;
      valores.push(parseInt(mes), parseInt(anio));
    } else if (anio) {
      filtroFecha = `AND EXTRACT(YEAR FROM asi.fecha) = $${base}`;
      valores.push(parseInt(anio));
    }

    const respuesta = await pool.query(`
      SELECT
        c.id,
        c.nombre,
        COUNT(CASE WHEN asi.estado = 'presente' THEN 1 END)::int AS presentes,
        COUNT(CASE WHEN asi.estado = 'ausente'  THEN 1 END)::int AS ausentes,
        COUNT(CASE WHEN asi.estado = 'tardanza' THEN 1 END)::int AS tardanzas,
        COUNT(asi.id)::int AS total
      FROM cursos c
      LEFT JOIN alumnos al ON al.id_curso = c.id
      LEFT JOIN asistencia asi ON asi.id_alumno = al.id ${filtroFecha}
      ${filtroColegio}
      GROUP BY c.id, c.nombre
      ORDER BY c.nombre
    `, valores);
    const rows = respuesta.rows.map(r => ({
      ...r,
      porcentaje: r.total > 0 ? Math.round((r.presentes / r.total) * 1000) / 10 : 0,
    }));
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener resumen por cursos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/asistencia/global
const obtenerAsistenciaGlobal = async (req, res) => {
  const colegio_id = req.usuario?.colegio_id;
  try {
    const filtroColegio = colegio_id
      ? `JOIN alumnos al ON al.id = asi.id_alumno JOIN cursos c ON c.id = al.id_curso WHERE c.colegio_id = $1`
      : '';
    const respuesta = await pool.query(`
      SELECT
        COUNT(CASE WHEN asi.estado = 'presente' THEN 1 END)::int AS presentes,
        COUNT(CASE WHEN asi.estado = 'ausente'  THEN 1 END)::int AS ausentes,
        COUNT(CASE WHEN asi.estado = 'tardanza' THEN 1 END)::int AS tardanzas,
        COUNT(asi.id)::int AS total
      FROM asistencia asi
      ${filtroColegio}
    `, colegio_id ? [colegio_id] : []);
    const { presentes, total } = respuesta.rows[0];
    const porcentaje = total > 0 ? Math.round((presentes / total) * 1000) / 10 : 0;
    res.json({ ...respuesta.rows[0], porcentaje });
  } catch (error) {
    console.error('Error al obtener asistencia global:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// PUT /api/asistencia/:id/justificar
const justificarAsistencia = async (req, res) => {
  const { id } = req.params;
  const { justificacion } = req.body;
  try {
    const respuesta = await pool.query(
      `UPDATE asistencia SET justificacion = $1 WHERE id = $2 RETURNING *`,
      [justificacion || null, id]
    );
    if (respuesta.rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
    res.status(200).json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al justificar asistencia:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/asistencia/analitica/riesgo?limite=75
const obtenerAlumnosEnRiesgoAsistencia = async (req, res) => {
  const limite = req.query.limite || 75;
  const colegio_id = req.usuario?.colegio_id;
  try {
    const filtroColegio = colegio_id ? `AND al.colegio_id = $2` : '';
    const respuesta = await pool.query(`
      SELECT
        al.id,
        al.nombre_completo,
        c.nombre AS nombre_curso,
        COUNT(CASE WHEN asi.estado = 'presente' THEN 1 END)::int AS presentes,
        COUNT(asi.id)::int AS total_clases,
        CASE
          WHEN COUNT(asi.id) > 0 THEN ROUND((COUNT(CASE WHEN asi.estado = 'presente' THEN 1 END)::float / COUNT(asi.id)) * 100)
          ELSE 100
        END AS porcentaje
      FROM alumnos al
      JOIN cursos c ON al.id_curso = c.id
      LEFT JOIN asistencia asi ON asi.id_alumno = al.id
      WHERE 1=1 ${filtroColegio}
      GROUP BY al.id, al.nombre_completo, c.nombre
      HAVING
        COUNT(asi.id) > 5 AND
        (COUNT(CASE WHEN asi.estado = 'presente' THEN 1 END)::float / COUNT(asi.id)) * 100 < $1
      ORDER BY porcentaje ASC
      LIMIT 10
    `, colegio_id ? [limite, colegio_id] : [limite]);
    res.json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener alumnos en riesgo de asistencia:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/asistencia/analitica/top
const obtenerMejoresAsistencias = async (req, res) => {
  const colegio_id = req.usuario?.colegio_id;
  try {
    const filtroColegio = colegio_id ? `WHERE al.colegio_id = $1` : '';
    const respuesta = await pool.query(`
      SELECT
        al.id,
        al.nombre_completo,
        c.nombre AS nombre_curso,
        CASE
          WHEN COUNT(asi.id) > 0 THEN ROUND((COUNT(CASE WHEN asi.estado = 'presente' THEN 1 END)::float / COUNT(asi.id)) * 100)
          ELSE 0
        END AS porcentaje
      FROM alumnos al
      JOIN cursos c ON al.id_curso = c.id
      LEFT JOIN asistencia asi ON asi.id_alumno = al.id
      ${filtroColegio}
      GROUP BY al.id, al.nombre_completo, c.nombre
      HAVING COUNT(asi.id) > 5
      ORDER BY porcentaje DESC
      LIMIT 10
    `, colegio_id ? [colegio_id] : []);
    res.json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener mejores asistencias:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// GET /api/asistencia/resumen-alumnos/:id_curso
const obtenerResumenPorAlumnosDeCurso = async (req, res) => {
  const { id_curso } = req.params;
  try {
    const respuesta = await pool.query(`
      SELECT
        al.id,
        al.nombre_completo,
        COUNT(CASE WHEN asi.estado = 'presente' THEN 1 END)::int AS presentes,
        COUNT(CASE WHEN asi.estado = 'ausente'  THEN 1 END)::int AS ausentes,
        COUNT(CASE WHEN asi.estado = 'tardanza' THEN 1 END)::int AS tardanzas,
        COUNT(asi.id)::int AS total
      FROM alumnos al
      LEFT JOIN asistencia asi ON asi.id_alumno = al.id
      WHERE al.id_curso = $1
      GROUP BY al.id, al.nombre_completo
      ORDER BY al.nombre_completo ASC
    `, [id_curso]);
    res.json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener resumen por alumnos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = {
  obtenerAsistenciaPorCursoYFecha,
  obtenerAsistenciaPorAlumno,
  guardarAsistencia,
  justificarAsistencia,
  obtenerResumenPorCurso,
  obtenerAsistenciaGlobal,
  obtenerResumenPorTodosLosCursos,
  obtenerAlumnosEnRiesgoAsistencia,
  obtenerMejoresAsistencias,
  obtenerResumenPorAlumnosDeCurso,
};
