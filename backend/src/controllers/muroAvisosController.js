const pool = require('../config/db');

// Mapea columnas con acentos al formato que usa el frontend
function mapAviso(row) {
  return {
    id:        row['identificación'] ?? row.id,
    id_curso:  row.id_curso,
    titulo:    row['título']          ?? row.titulo,
    mensaje:   row.mensaje,
    creado_en: row['fecha_publicación'] ?? row.creado_en,
  };
}

// GET /api/avisos?id_curso=1
const obtenerAvisos = async (req, res) => {
  const { id_curso } = req.query;
  try {
    let consulta = 'SELECT * FROM muro_avisos';
    const valores = [];
    if (id_curso) {
      consulta += ' WHERE id_curso = $1';
      valores.push(id_curso);
    }
    consulta += ' ORDER BY 1 DESC';       // ORDER BY primera columna (id)
    const result = await pool.query(consulta, valores);
    res.status(200).json(result.rows.map(mapAviso));
  } catch (error) {
    console.error('Error al obtener avisos:', error);
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
};

// POST /api/avisos
const crearAviso = async (req, res) => {
  const { id_curso, titulo, contenido } = req.body;
  if (!titulo || !contenido) {
    return res.status(400).json({ error: 'Título y contenido son obligatorios' });
  }
  try {
    // Obtenemos los nombres reales de las columnas primero
    const cols = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='muro_avisos' ORDER BY ordinal_position"
    );
    const nombres = cols.rows.map(r => r.column_name);
    // nombres: ['identificación','id_curso','título','mensaje','fecha_publicación']
    const colTitulo  = nombres.find(n => n.includes('tulo') || n.includes('titulo')) || 'título';
    const colMensaje = nombres.find(n => n.includes('mensaje')) || 'mensaje';

    const respuesta = await pool.query(
      `INSERT INTO muro_avisos (id_curso, "${colTitulo}", "${colMensaje}") VALUES ($1, $2, $3) RETURNING *`,
      [id_curso || null, titulo, contenido]
    );
    res.status(201).json(mapAviso(respuesta.rows[0]));
  } catch (error) {
    console.error('Error al crear aviso:', error);
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
};

// DELETE /api/avisos/:id
const eliminarAviso = async (req, res) => {
  const { id } = req.params;
  try {
    // Obtenemos nombre real de la PK
    const cols = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='muro_avisos' ORDER BY ordinal_position LIMIT 1"
    );
    const pk = cols.rows[0]?.column_name || 'identificación';
    const respuesta = await pool.query(
      `DELETE FROM muro_avisos WHERE "${pk}" = $1 RETURNING "${pk}"`, [id]
    );
    if (respuesta.rows.length === 0) return res.status(404).json({ error: 'Aviso no encontrado' });
    res.status(200).json({ mensaje: 'Aviso eliminado' });
  } catch (error) {
    console.error('Error al eliminar aviso:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { obtenerAvisos, crearAviso, eliminarAviso };
