const express = require('express');
const router = express.Router();
const cursoController = require('../controllers/cursoController');

// Rutas para /api/cursos
router.get('/', cursoController.obtenerCursos);
router.post('/', cursoController.crearCurso);

module.exports = router;
