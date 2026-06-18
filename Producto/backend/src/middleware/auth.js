

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

// Adjunta colegio_id al request. Superadmin no tiene restricción de tenant.
const verificarTenant = (req, res, next) => {
  if (!req.usuario) return res.status(401).json({ error: 'No autenticado' });
  req.colegio_id = req.usuario.rol === 'superadmin' ? null : (req.usuario.colegio_id || null);
  req.esSuperadmin = req.usuario.rol === 'superadmin';
  next();
};

// Verifica que el colegio tenga plan Premium (profesional o enterprise)
// Uso: verificarPlan en rutas de AURA, reportes, analytics avanzados
const verificarPlan = (req, res, next) => {
  if (!req.usuario) return res.status(401).json({ error: 'No autenticado' });
  const plan = req.usuario.plan || 'basico';
  const esPremium = plan === 'profesional' || plan === 'enterprise';
  const esSuperadmin = req.usuario.rol === 'superadmin';
  if (!esPremium && !esSuperadmin) {
    return res.status(403).json({ error: 'plan_requerido', mensaje: 'Esta funcionalidad requiere Plan Premium.' });
  }
  next();
};

module.exports = { verificarToken, verificarRol, verificarTenant, verificarPlan };
