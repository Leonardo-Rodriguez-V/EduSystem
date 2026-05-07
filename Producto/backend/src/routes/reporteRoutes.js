const express = require('express');
const router = express.Router();
const { exportarNotasPDF, exportarAsistenciaPDF } = require('../controllers/reporteController');
const { verificarToken } = require('../middleware/auth');

router.get('/notas/:id_alumno', verificarToken, exportarNotasPDF);
router.get('/asistencia/:id_alumno', verificarToken, exportarAsistenciaPDF);

module.exports = router;
