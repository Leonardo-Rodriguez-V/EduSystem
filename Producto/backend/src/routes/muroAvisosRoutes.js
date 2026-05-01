const express = require('express');
const router = express.Router();
const { obtenerAvisos, crearAviso, actualizarAviso, eliminarAviso } = require('../controllers/muroAvisosController');
const { verificarToken, verificarRol } = require('../middleware/auth');

router.get('/',    verificarToken, obtenerAvisos);
router.post('/',   verificarToken, verificarRol('director', 'profesor'), crearAviso);
router.put('/:id', verificarToken, verificarRol('director', 'profesor'), actualizarAviso);
router.delete('/:id', verificarToken, verificarRol('director', 'profesor'), eliminarAviso);

module.exports = router;
