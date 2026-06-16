const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const obtenerUsuarios = async (req, res) => {
  const esSuperadmin = req.usuario.rol === 'superadmin';
  const colegio_id = req.usuario.colegio_id;
  try {
    const filtro = esSuperadmin ? '' : 'WHERE u.colegio_id = $1';
    const valores = esSuperadmin ? [] : [colegio_id];
    const respuesta = await pool.query(`
      SELECT
        u.id, u.nombre_completo, u.correo, u.rol, u.especialidad, u.colegio_id,
        c.nombre AS curso_jefatura,
        (SELECT STRING_AGG(DISTINCT a.nombre, ', ' ORDER BY a.nombre)
         FROM curso_asignatura_profesor cap
         JOIN asignaturas a ON cap.id_asignatura = a.id
         WHERE cap.id_profesor = u.id) AS asignaturas_que_imparte,
        (SELECT COUNT(*) FROM apoderado_alumno aa WHERE aa.id_apoderado = u.id) AS total_hijos
      FROM usuarios u
      LEFT JOIN cursos c ON c.id_profesor_jefe = u.id
      ${filtro}
      ORDER BY
        CASE u.rol WHEN 'director' THEN 1 WHEN 'profesor' THEN 2 ELSE 3 END,
        u.nombre_completo
    `, valores);
    res.json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ error: 'Error del servidor al obtener usuarios' });
  }
};

const crearUsuario = async (req, res) => {
  const { nombre_completo, correo, rol, contraseña } = req.body;
  const colegio_id = req.usuario.rol === 'superadmin' ? (req.body.colegio_id || null) : req.usuario.colegio_id;

  if (!contraseña || contraseña.length < 8 || !/\d/.test(contraseña)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres y un número' });
  }

  try {
    const hash = await bcrypt.hash(contraseña, 10);
    const respuesta = await pool.query(
      'INSERT INTO usuarios (nombre_completo, correo, rol, contraseña, colegio_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre_completo, correo, rol, hash, colegio_id]
    );
    const { contraseña: _, ...datosUsuario } = respuesta.rows[0];
    res.status(201).json(datosUsuario);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado en el sistema.' });
    }
    console.error('Error detallado al crear el usuario:', error);
    res.status(500).json({ error: 'Error del servidor al crear usuario', detail: error.message });
  }
};

const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, correo, rol, contraseña } = req.body;
  try {
    let consulta, valores;
    if (contraseña) {
      if (contraseña.length < 8 || !/\d/.test(contraseña)) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres y un número' });
      }
      const hash = await bcrypt.hash(contraseña, 10);
      consulta = 'UPDATE usuarios SET nombre_completo=$1, correo=$2, rol=$3, contraseña=$4 WHERE id=$5 RETURNING id, nombre_completo, correo, rol';
      valores = [nombre_completo, correo, rol, hash, id];
    } else {
      consulta = 'UPDATE usuarios SET nombre_completo=$1, correo=$2, rol=$3 WHERE id=$4 RETURNING id, nombre_completo, correo, rol';
      valores = [nombre_completo, correo, rol, id];
    }
    const respuesta = await pool.query(consulta, valores);
    if (respuesta.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error del servidor', detail: error.message });
  }
};

const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const respuesta = await pool.query('DELETE FROM usuarios WHERE id=$1 RETURNING id', [id]);
    if (respuesta.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// POST /api/usuarios/crear-cuentas-alumnos
// Crea cuentas de login para todos los alumnos de la institución que aún no tengan una.
const crearCuentasAlumnos = async (req, res) => {
  const colegio_id = req.usuario.colegio_id;
  if (!colegio_id) return res.status(400).json({ error: 'No se encontró la institución del director' });

  const normalizar = (str) =>
    str.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .join('.');

  try {
    const alumnosRes = await pool.query(
      `SELECT a.id, a.nombre_completo, a.rut
       FROM alumnos a
       WHERE a.colegio_id = $1
       ORDER BY a.nombre_completo`,
      [colegio_id]
    );
    const alumnos = alumnosRes.rows;

    // Obtener los nombres de usuarios alumno ya existentes en esta institución
    const existentesRes = await pool.query(
      `SELECT LOWER(nombre_completo) AS nombre FROM usuarios
       WHERE colegio_id = $1 AND rol = 'alumno'`,
      [colegio_id]
    );
    const nombresExistentes = new Set(existentesRes.rows.map(r => r.nombre));

    const PASSWORD_DEFAULT = 'Alumno2026';
    const hash = await bcrypt.hash(PASSWORD_DEFAULT, 10);

    let creados = 0;
    let omitidos = 0;
    const correosUsados = new Set();

    // Pre-cargar correos ya usados en la BD
    const correosRes = await pool.query('SELECT correo FROM usuarios WHERE colegio_id = $1', [colegio_id]);
    correosRes.rows.forEach(r => correosUsados.add(r.correo));

    for (const al of alumnos) {
      if (nombresExistentes.has(al.nombre_completo.toLowerCase())) {
        omitidos++;
        continue;
      }

      // Generar correo único
      let base = normalizar(al.nombre_completo);
      let correo = `${base}@edusync.cl`;
      let sufijo = 2;
      while (correosUsados.has(correo)) {
        correo = `${base}${sufijo}@edusync.cl`;
        sufijo++;
      }
      correosUsados.add(correo);

      await pool.query(
        `INSERT INTO usuarios (nombre_completo, correo, rol, contraseña, colegio_id)
         VALUES ($1, $2, 'alumno', $3, $4)`,
        [al.nombre_completo, correo, hash, colegio_id]
      );
      creados++;
    }

    res.json({
      mensaje: `Proceso completado. ${creados} cuentas creadas, ${omitidos} ya existían.`,
      creados,
      omitidos,
      total: alumnos.length,
      password_default: PASSWORD_DEFAULT,
    });
  } catch (error) {
    console.error('Error al crear cuentas de alumnos:', error);
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
};

module.exports = { obtenerUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario, crearCuentasAlumnos };
