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

module.exports = {
  obtenerUsuarios,
  crearUsuario
};
