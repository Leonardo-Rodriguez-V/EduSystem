const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function ensurePlanExpira() {
  await pool.query(`ALTER TABLE colegios ADD COLUMN IF NOT EXISTS plan_expira DATE`).catch(() => {});
}
ensurePlanExpira();

const obtenerColegios = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM usuarios u
         WHERE u.colegio_id = c.id AND u.rol != 'superadmin') AS total_usuarios,
        (SELECT COUNT(*) FROM alumnos a
         WHERE a.colegio_id = c.id) AS total_alumnos,
        (SELECT COUNT(*) FROM cursos cur
         WHERE cur.colegio_id = c.id) AS total_cursos,
        (SELECT u2.nombre_completo FROM usuarios u2
         WHERE u2.colegio_id = c.id AND u2.rol = 'director' LIMIT 1) AS nombre_director,
        (SELECT u2.correo FROM usuarios u2
         WHERE u2.colegio_id = c.id AND u2.rol = 'director' LIMIT 1) AS correo_director
      FROM colegios c
      ORDER BY c.creado_en DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('[COLEGIOS] Error al obtener:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const obtenerColegioDetalle = async (req, res) => {
  const { id } = req.params;
  try {
    const [colegioR, usuariosR, cursosR] = await Promise.all([
      pool.query('SELECT * FROM colegios WHERE id = $1', [id]),
      pool.query(`SELECT id, nombre_completo, correo, rol
                  FROM usuarios WHERE colegio_id = $1 AND rol != 'superadmin'
                  ORDER BY rol, nombre_completo`, [id]),
      pool.query(`SELECT c.id, c.nombre, c.anio, COUNT(a.id) AS total_alumnos
                  FROM cursos c LEFT JOIN alumnos a ON a.id_curso = c.id
                  WHERE c.colegio_id = $1 GROUP BY c.id ORDER BY c.nombre`, [id]),
    ]);
    if (colegioR.rows.length === 0) return res.status(404).json({ error: 'Colegio no encontrado' });
    res.json({ colegio: colegioR.rows[0], usuarios: usuariosR.rows, cursos: cursosR.rows });
  } catch (err) {
    console.error('[COLEGIOS] Error al obtener detalle:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const crearColegio = async (req, res) => {
  const { nombre, rut, direccion, telefono, email, plan, plan_expira, director } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [colegio] } = await client.query(
      `INSERT INTO colegios (nombre, rut, direccion, telefono, email, plan, plan_expira)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nombre, rut || null, direccion || null, telefono || null, email || null, plan || 'basico', plan_expira || null]
    );
    if (director?.nombre && director?.correo && director?.contraseña) {
      const hash = await bcrypt.hash(director.contraseña, 10);
      await client.query(
        `INSERT INTO usuarios (nombre_completo, correo, rol, contraseña, colegio_id)
         VALUES ($1,$2,'director',$3,$4)`,
        [director.nombre, director.correo, hash, colegio.id]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(colegio);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'El RUT o correo ya está registrado' });
    console.error('[COLEGIOS] Error al crear:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    client.release();
  }
};

const actualizarColegio = async (req, res) => {
  const { id } = req.params;
  const { nombre, rut, direccion, telefono, email, plan, plan_expira, activo, director } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE colegios SET
        nombre      = COALESCE($1, nombre),
        rut         = COALESCE($2, rut),
        direccion   = COALESCE($3, direccion),
        telefono    = COALESCE($4, telefono),
        email       = COALESCE($5, email),
        plan        = COALESCE($6, plan),
        plan_expira = COALESCE($7, plan_expira),
        activo      = COALESCE($8, activo)
       WHERE id = $9 RETURNING *`,
      [nombre, rut, direccion, telefono, email, plan, plan_expira, activo, id]
    );
    if (rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Colegio no encontrado' }); }
    if (director?.nombre || director?.correo) {
      const existe = await client.query(`SELECT id FROM usuarios WHERE colegio_id = $1 AND rol = 'director' LIMIT 1`, [id]);
      if (existe.rows.length > 0) {
        // Director ya existe: actualizar datos y opcionalmente la contraseña
        if (director.contraseña) {
          const hash = await bcrypt.hash(director.contraseña, 10);
          await client.query(
            `UPDATE usuarios SET
              nombre_completo = COALESCE(NULLIF($1,''), nombre_completo),
              correo          = COALESCE(NULLIF($2,''), correo),
              contraseña      = $3
             WHERE colegio_id = $4 AND rol = 'director'`,
            [director.nombre || null, director.correo || null, hash, id]
          );
        } else {
          await client.query(
            `UPDATE usuarios SET
              nombre_completo = COALESCE(NULLIF($1,''), nombre_completo),
              correo          = COALESCE(NULLIF($2,''), correo)
             WHERE colegio_id = $3 AND rol = 'director'`,
            [director.nombre || null, director.correo || null, id]
          );
        }
      } else if (director.nombre && director.correo && director.contraseña) {
        // No existe director: crear uno nuevo
        const hash = await bcrypt.hash(director.contraseña, 10);
        await client.query(
          `INSERT INTO usuarios (nombre_completo, correo, rol, contraseña, colegio_id)
           VALUES ($1, $2, 'director', $3, $4)`,
          [director.nombre, director.correo, hash, id]
        );
      }
    }
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[COLEGIOS] Error al actualizar:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    client.release();
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

module.exports = { obtenerColegios, obtenerColegioDetalle, crearColegio, actualizarColegio, eliminarColegio };
