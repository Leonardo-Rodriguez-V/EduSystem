const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horarioController');

// GET /api/horarios/curso/:id_curso
router.get('/curso/:id_curso', horarioController.obtenerHorarioPorCurso);

module.exports = router;
