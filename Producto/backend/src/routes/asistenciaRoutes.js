const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');

// PUT /api/asistencia/:id/justificar
router.put('/:id/justificar', asistenciaController.justificarAsistencia);

// GET /api/asistencia?id_curso=1&fecha=2026-03-20
router.get('/', asistenciaController.obtenerAsistenciaPorCursoYFecha);

// GET /api/asistencia/global
router.get('/global', asistenciaController.obtenerAsistenciaGlobal);

// GET /api/asistencia/resumen-cursos
router.get('/resumen-cursos', asistenciaController.obtenerResumenPorTodosLosCursos);

// GET /api/asistencia/analitica/riesgo
router.get('/analitica/riesgo', asistenciaController.obtenerAlumnosEnRiesgoAsistencia);

// GET /api/asistencia/analitica/top
router.get('/analitica/top', asistenciaController.obtenerMejoresAsistencias);

// GET /api/asistencia/resumen?id_curso=1
router.get('/resumen', asistenciaController.obtenerResumenPorCurso);

// GET /api/asistencia/alumno/:id_alumno?mes=3&anio=2026
router.get('/alumno/:id_alumno', asistenciaController.obtenerAsistenciaPorAlumno);

// POST /api/asistencia/guardar
router.post('/guardar', asistenciaController.guardarAsistencia);

module.exports = router;
