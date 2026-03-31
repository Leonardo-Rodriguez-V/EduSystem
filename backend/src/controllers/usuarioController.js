const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const obtenerUsuarios = async (req, res) => {
  try {
    const respuesta = await pool.query('SELECT * FROM usuarios');
    res.json(respuesta.rows);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ error: 'Error del servidor al obtener usuarios' });
  }
};

const crearUsuario = async (req, res) => {
  const { nombre_completo, correo, rol, contraseña } = req.body;

  if (!contraseña || contraseña.length < 8 || !/\d/.test(contraseña)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres y un número' });
  }

  try {
    const hash = await bcrypt.hash(contraseña, 10);
    const consulta = 'INSERT INTO usuarios (nombre_completo, correo, rol, contraseña) VALUES ($1, $2, $3, $4) RETURNING *';
    const respuesta = await pool.query(consulta, [nombre_completo, correo, rol, hash]);
    const { contraseña: _, ...datosUsuario } = respuesta.rows[0];
    res.status(201).json(datosUsuario);
  } catch (error) {
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

module.exports = {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
};
