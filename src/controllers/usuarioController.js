const pool = require('../config/db');

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
  console.log('Intentando crear usuario con datos:', { nombre_completo, correo, rol });
  try {
    const consulta = 'INSERT INTO usuarios (nombre_completo, correo, rol, contraseña) VALUES ($1, $2, $3, $4) RETURNING *';
    const valores = [nombre_completo, correo, rol, contraseña];
    const respuesta = await pool.query(consulta, valores);
    res.status(201).json(respuesta.rows[0]);
  } catch (error) {
    console.error('Error detallado al crear el usuario:', error);
    res.status(500).json({ error: 'Error del servidor al crear usuario', detail: error.message });
  }
};

module.exports = {
  obtenerUsuarios,
  crearUsuario
};
