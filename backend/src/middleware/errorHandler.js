/**
 * Middleware de manejo de errores global para EduSync.
 * Proporciona respuestas consistentes y previene la exposición de detalles internos en producción.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  if (err.stack) {
    console.debug(err.stack);
  }

  const statusCode = err.status || err.statusCode || 500;
  
  res.status(statusCode).json({
    exito: false,
    mensaje: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};

module.exports = errorHandler;
