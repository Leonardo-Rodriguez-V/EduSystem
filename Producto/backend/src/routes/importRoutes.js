const express = require('express');
const router = express.Router({ mergeParams: true });
const { verificarToken, verificarRol } = require('../middleware/auth');
const { importarDatos, descargarPlantilla } = require('../controllers/importController');

router.get('/plantilla',  verificarToken, verificarRol('superadmin'), descargarPlantilla);
router.post('/importar',  verificarToken, verificarRol('superadmin'), importarDatos);

module.exports = router;
