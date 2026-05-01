const express = require('express');
const router = express.Router();
const cursoController = require('../controllers/cursoController');
const { verificarToken, verificarRol } = require('../middleware/auth');

router.get('/',  verificarToken, cursoController.obtenerCursos);
router.post('/', verificarToken, verificarRol('director'), cursoController.crearCurso);

module.exports = router;
