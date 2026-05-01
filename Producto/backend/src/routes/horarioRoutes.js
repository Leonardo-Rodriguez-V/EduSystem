const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horarioController');
const { verificarToken } = require('../middleware/auth');

// GET /api/horarios/exportar?id_curso=X — debe ir antes de /curso/:id_curso
router.get('/exportar',          verificarToken, horarioController.exportarHorarioWord);
router.get('/curso/:id_curso',   verificarToken, horarioController.obtenerHorarioPorCurso);

module.exports = router;
