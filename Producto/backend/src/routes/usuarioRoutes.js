const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken, verificarRol } = require('../middleware/auth');

router.get('/',    verificarToken, verificarRol('director'), usuarioController.obtenerUsuarios);
router.post('/',   verificarToken, verificarRol('director'), usuarioController.crearUsuario);
router.put('/:id', verificarToken, verificarRol('director'), usuarioController.actualizarUsuario);
router.delete('/:id', verificarToken, verificarRol('director'), usuarioController.eliminarUsuario);

module.exports = router;
