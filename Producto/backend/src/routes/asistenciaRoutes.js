const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Consultas: cualquier usuario autenticado
router.get('/',                  verificarToken, asistenciaController.obtenerAsistenciaPorCursoYFecha);
router.get('/global',            verificarToken, asistenciaController.obtenerAsistenciaGlobal);
router.get('/resumen-cursos',    verificarToken, asistenciaController.obtenerResumenPorTodosLosCursos);
router.get('/resumen',           verificarToken, asistenciaController.obtenerResumenPorCurso);
router.get('/analitica/riesgo',  verificarToken, asistenciaController.obtenerAlumnosEnRiesgoAsistencia);
router.get('/analitica/top',     verificarToken, asistenciaController.obtenerMejoresAsistencias);
router.get('/alumno/:id_alumno', verificarToken, asistenciaController.obtenerAsistenciaPorAlumno);

// Escritura: solo director y profesor
router.post('/guardar',          verificarToken, verificarRol('director', 'profesor'), asistenciaController.guardarAsistencia);
router.put('/:id/justificar',    verificarToken, verificarRol('director', 'profesor'), asistenciaController.justificarAsistencia);

module.exports = router;
