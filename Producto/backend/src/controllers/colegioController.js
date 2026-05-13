const pool = require('../config/db');

const obtenerColegios = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        COUNT(DISTINCT u.id) FILTER (WHERE u.rol != 'superadmin') AS total_usuarios
      FROM colegios c
      LEFT JOIN usuarios u ON u.colegio_id = c.id
      GROUP BY c.id
      ORDER BY c.creado_en DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('[COLEGIOS] Error al obtener:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const crearColegio = async (req, res) => {
  const { nombre, rut, direccion, telefono, email, plan } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO colegios (nombre, rut, direccion, telefono, email, plan)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, rut || null, direccion || null, telefono || null, email || null, plan || 'basico']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El RUT ya está registrado' });
    console.error('[COLEGIOS] Error al crear:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const actualizarColegio = async (req, res) => {
  const { id } = req.params;
  const { nombre, rut, direccion, telefono, email, plan, activo } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE colegios SET
        nombre = COALESCE($1, nombre),
        rut = COALESCE($2, rut),
        direccion = COALESCE($3, direccion),
        telefono = COALESCE($4, telefono),
        email = COALESCE($5, email),
        plan = COALESCE($6, plan),
        activo = COALESCE($7, activo)
       WHERE id = $8 RETURNING *`,
      [nombre, rut, direccion, telefono, email, plan, activo, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Colegio no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[COLEGIOS] Error al actualizar:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const eliminarColegio = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'UPDATE colegios SET activo = false WHERE id = $1 RETURNING id', [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Colegio no encontrado' });
    res.json({ mensaje: 'Colegio desactivado correctamente' });
  } catch (err) {
    console.error('[COLEGIOS] Error al eliminar:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { obtenerColegios, crearColegio, actualizarColegio, eliminarColegio };
