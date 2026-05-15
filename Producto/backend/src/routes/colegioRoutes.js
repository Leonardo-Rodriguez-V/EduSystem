const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { obtenerColegios, obtenerColegioDetalle, crearColegio, actualizarColegio, eliminarColegio, reenviarBienvenida } = require('../controllers/colegioController');

router.get('/',      verificarToken, verificarRol('superadmin'), obtenerColegios);
router.get('/:id',   verificarToken, verificarRol('superadmin'), obtenerColegioDetalle);
router.post('/',     verificarToken, verificarRol('superadmin'), crearColegio);
router.put('/:id',   verificarToken, verificarRol('superadmin'), actualizarColegio);
router.delete('/:id', verificarToken, verificarRol('superadmin'), eliminarColegio);
router.post('/:id/reenviar-bienvenida', verificarToken, verificarRol('superadmin'), reenviarBienvenida);

module.exports = router;
