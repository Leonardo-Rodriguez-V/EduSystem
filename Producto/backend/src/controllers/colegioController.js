const pool = require('../config/db');

// GET /api/colegios — lista todos los colegios (solo superadmin)
const obtenerColegios = async (req, res) => {
  try {
    const respuesta = await pool.query(`
      SELECT
        c.id, c.nombre, c.rut, c.direccion, c.telefono, c.email,
        c.plan, c.activo, c.creado_en,
        COUNT(u.id) AS total_usuarios
      FROM colegios c
      LEFT JOIN usuarios u ON u.colegio_id = c.id
      GROUP BY c.id
      ORDER BY c.nombre
    `);
    res.json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener colegios:', error);
    res.status(500).json({ error: 'Error del servidor al obtener colegios' });
  }
};

// GET /api/colegios/:id — detalle de un colegio
const obtenerColegioPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const respuesta = await pool.query(
      'SELECT * FROM colegios WHERE id = $1',
      [id]
    );
    if (respuesta.rows.length === 0) {
      return res.status(404).json({ error: 'Colegio no encontrado' });
    }
    res.json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al obtener colegio:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// POST /api/colegios — crear nuevo colegio (solo superadmin)
const crearColegio = async (req, res) => {
  const { nombre, rut, direccion, telefono, email, plan } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del colegio es obligatorio' });
  }

  try {
    const respuesta = await pool.query(
      `INSERT INTO colegios (nombre, rut, direccion, telefono, email, plan)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nombre, rut ?? null, direccion ?? null, telefono ?? null, email ?? null, plan ?? 'basico']
    );
    res.status(201).json(respuesta.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El RUT ya está registrado en otro colegio' });
    }
    console.error('Error al crear colegio:', error);
    res.status(500).json({ error: 'Error del servidor al crear colegio' });
  }
};

// PUT /api/colegios/:id — actualizar colegio (solo superadmin)
const actualizarColegio = async (req, res) => {
  const { id } = req.params;
  const { nombre, rut, direccion, telefono, email, plan, activo } = req.body;

  try {
    const respuesta = await pool.query(
      `UPDATE colegios
       SET nombre=$1, rut=$2, direccion=$3, telefono=$4, email=$5, plan=$6, activo=$7
       WHERE id=$8
       RETURNING *`,
      [nombre, rut, direccion, telefono, email, plan, activo, id]
    );
    if (respuesta.rows.length === 0) {
      return res.status(404).json({ error: 'Colegio no encontrado' });
    }
    res.json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al actualizar colegio:', error);
    res.status(500).json({ error: 'Error del servidor al actualizar colegio' });
  }
};

// DELETE /api/colegios/:id — desactivar colegio (soft delete, no borra datos)
const desactivarColegio = async (req, res) => {
  const { id } = req.params;
  try {
    const respuesta = await pool.query(
      'UPDATE colegios SET activo=false WHERE id=$1 RETURNING id, nombre, activo',
      [id]
    );
    if (respuesta.rows.length === 0) {
      return res.status(404).json({ error: 'Colegio no encontrado' });
    }
    res.json({ mensaje: 'Colegio desactivado', colegio: respuesta.rows[0] });
  } catch (error) {
    console.error('Error al desactivar colegio:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = {
  obtenerColegios,
  obtenerColegioPorId,
  crearColegio,
  actualizarColegio,
  desactivarColegio,
};
