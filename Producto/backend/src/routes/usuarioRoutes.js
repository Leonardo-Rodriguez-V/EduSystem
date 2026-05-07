const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken, verificarRol, verificarTenant } = require('../middleware/auth');

// Todas las rutas de usuarios requieren autenticación + tenant
router.use(verificarToken, verificarTenant);

// Solo director y superadmin pueden gestionar usuarios de su colegio
router.get('/',     verificarRol('director', 'superadmin'), usuarioController.obtenerUsuarios);
router.post('/',    verificarRol('director', 'superadmin'), usuarioController.crearUsuario);
router.put('/:id',  verificarRol('director', 'superadmin'), usuarioController.actualizarUsuario);
router.delete('/:id', verificarRol('director', 'superadmin'), usuarioController.eliminarUsuario);

module.exports = router;
