const express = require('express');
const router = express.Router();
const { exportarNotasPDF, exportarAsistenciaPDF } = require('../controllers/reporteController');
const { verificarToken, verificarPlan } = require('../middleware/auth');

router.get('/notas/:id_alumno',      verificarToken, verificarPlan, exportarNotasPDF);
router.get('/asistencia/:id_alumno', verificarToken, verificarPlan, exportarAsistenciaPDF);

module.exports = router;
