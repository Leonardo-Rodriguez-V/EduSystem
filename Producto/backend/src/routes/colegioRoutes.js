const express = require('express');
const router = express.Router();
const colegioController = require('../controllers/colegioController');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Todas las rutas de colegios requieren autenticación
router.use(verificarToken);

// Solo el superadmin puede gestionar colegios
router.get('/',      verificarRol('superadmin'), colegioController.obtenerColegios);
router.get('/:id',   verificarRol('superadmin'), colegioController.obtenerColegioPorId);
router.post('/',     verificarRol('superadmin'), colegioController.crearColegio);
router.put('/:id',   verificarRol('superadmin'), colegioController.actualizarColegio);
router.delete('/:id',verificarRol('superadmin'), colegioController.desactivarColegio);

module.exports = router;
