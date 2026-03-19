const pool = require('../config/db');

const login = async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    // 1. Buscar al usuario por correo
    const consulta = 'SELECT * FROM usuarios WHERE correo = $1';
    const respuesta = await pool.query(consulta, [correo]);

    if (respuesta.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const usuario = respuesta.rows[0];

    // 2. Verificar contraseña (comparación simple por ahora, se recomienda bcrypt a futuro)
    if (usuario.contraseña !== contraseña) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // 3. Login exitoso -> Devolver datos del usuario (sin la contraseña)
    const { contraseña: _, ...datosUsuario } = usuario;
    res.status(200).json({
      mensaje: 'Login exitoso',
      usuario: datosUsuario
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  login
};
