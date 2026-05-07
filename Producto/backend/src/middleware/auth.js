const jwt = require('jsonwebtoken');

// Verifica que el request tenga un JWT válido
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, nombre_completo, correo, rol }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

// Verifica que el usuario tenga uno de los roles permitidos
// Uso: verificarRol('director', 'profesor')
const verificarRol = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    next();
  };
};

// Verifica el tenant del usuario (colegio_id)
// El superadmin omite esta verificación (acceso total)
// Todos los demás roles DEBEN tener colegio_id en el JWT
const verificarTenant = (req, res, next) => {
  const { rol, colegio_id } = req.usuario;

  // Superadmin tiene acceso global
  if (rol === 'superadmin') return next();

  // Cualquier otro rol debe pertenecer a un colegio
  if (!colegio_id) {
    return res.status(403).json({
      error: 'Acceso denegado: usuario sin colegio asignado',
    });
  }

  // Inyectar colegio_id en el request para usarlo en los controllers
  req.colegio_id = colegio_id;
  next();
};

module.exports = { verificarToken, verificarRol, verificarTenant };
