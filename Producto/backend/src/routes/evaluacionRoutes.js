const express = require('express');
const router = express.Router();
const evaluacionController = require('../controllers/evaluacionController');

// GET /api/evaluaciones/curso/:id_curso
router.get('/curso/:id_curso', evaluacionController.obtenerEvaluacionesPorCurso);

// POST /api/evaluaciones
router.post('/', evaluacionController.crearEvaluacion);

module.exports = router;
