const pool = require('../config/db');

// GET /api/avisos?id_curso=1
const obtenerAvisos = async (req, res) => {
  const { id_curso } = req.query;
  try {
    let consulta = `
      SELECT a.*, u.nombre_completo AS nombre_autor, c.nombre AS nombre_curso
      FROM muro_avisos a
      LEFT JOIN usuarios u ON a.id_autor = u.id
      LEFT JOIN cursos  c ON a.id_curso  = c.id
    `;
    const valores = [];
    if (id_curso) {
      consulta += ' WHERE a.id_curso = $1';
      valores.push(id_curso);
    }
    consulta += ' ORDER BY a.id DESC';
    const result = await pool.query(consulta, valores);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener avisos:', error);
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
};

// POST /api/avisos
const crearAviso = async (req, res) => {
  const { id_curso, titulo, contenido, id_autor } = req.body;
  if (!titulo || !contenido) {
    return res.status(400).json({ error: 'Título y contenido son obligatorios' });
  }
  try {
    const respuesta = await pool.query(
      `INSERT INTO muro_avisos (id_curso, id_autor, titulo, mensaje)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_curso || null, id_autor || null, titulo, contenido]
    );
    res.status(201).json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error al crear aviso:', error);
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
};

// DELETE /api/avisos/:id
const eliminarAviso = async (req, res) => {
  const { id } = req.params;
  try {
    const respuesta = await pool.query(
      'DELETE FROM muro_avisos WHERE id = $1 RETURNING id', [id]
    );
    if (respuesta.rows.length === 0) return res.status(404).json({ error: 'Aviso no encontrado' });
    res.status(200).json({ mensaje: 'Aviso eliminado' });
  } catch (error) {
    console.error('Error al eliminar aviso:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { obtenerAvisos, crearAviso, eliminarAviso };
