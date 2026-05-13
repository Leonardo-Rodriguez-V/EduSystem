const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { obtenerColegios, crearColegio, actualizarColegio, eliminarColegio } = require('../controllers/colegioController');

router.get('/',      verificarToken, verificarRol('superadmin'), obtenerColegios);
router.post('/',     verificarToken, verificarRol('superadmin'), crearColegio);
router.put('/:id',   verificarToken, verificarRol('superadmin'), actualizarColegio);
router.delete('/:id', verificarToken, verificarRol('superadmin'), eliminarColegio);

module.exports = router;
