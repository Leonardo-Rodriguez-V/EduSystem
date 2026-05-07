const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { emailRecuperacionContrasena } = require('../services/emailService');

const login = async (req, res) => {
  const { correo, contraseña } = req.body;
  try {
    const respuesta = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    if (respuesta.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    const usuario = respuesta.rows[0];
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!contraseñaValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    const token = jwt.sign(
      { id: usuario.id, nombre_completo: usuario.nombre_completo, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    const { contraseña: _, ...datosUsuario } = usuario;
    res.status(200).json({ mensaje: 'Login exitoso', token, usuario: datosUsuario });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Asegurar que la tabla tenga las columnas necesarias
async function ensureResetColumns() {
  try {
    await pool.query(`
      ALTER TABLE usuarios
        ADD COLUMN IF NOT EXISTS reset_token TEXT,
        ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ
    `);
  } catch (err) {
    console.error('[AUTH] Error al agregar columnas reset:', err.message);
  }
}
ensureResetColumns();

const forgotPassword = async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ error: 'Se requiere el correo' });
  try {
    const { rows } = await pool.query('SELECT id, nombre_completo FROM usuarios WHERE correo = $1', [correo]);
    // Responder siempre OK para no revelar si el correo existe
    if (rows.length === 0) {
      return res.status(200).json({ mensaje: 'Si el correo existe, recibirás un enlace de recuperación.' });
    }
    const usuario = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await pool.query(
      'UPDATE usuarios SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [token, expiry, usuario.id]
    );
    await emailRecuperacionContrasena(correo, usuario.nombre_completo, token);
    res.status(200).json({ mensaje: 'Si el correo existe, recibirás un enlace de recuperación.' });
  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const resetPassword = async (req, res) => {
  const { token, nuevaContraseña } = req.body;
  if (!token || !nuevaContraseña) {
    return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios' });
  }
  if (nuevaContraseña.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id FROM usuarios WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }
    const hash = await bcrypt.hash(nuevaContraseña, 10);
    await pool.query(
      'UPDATE usuarios SET contraseña = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hash, rows[0].id]
    );
    res.status(200).json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { login, forgotPassword, resetPassword };
