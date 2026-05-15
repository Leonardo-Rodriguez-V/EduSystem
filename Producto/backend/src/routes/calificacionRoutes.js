const express = require('express');
const router = express.Router();
const notaController = require('../controllers/calificacionController');
const { verificarToken, verificarRol, verificarPlan } = require('../middleware/auth');

// Consultas: cualquier usuario autenticado
router.get('/',                          verificarToken, notaController.obtenerNotasPorAlumno);
router.get('/promedio-cursos',           verificarToken, notaController.obtenerPromedioPorCurso);
router.get('/analitica/riesgo',          verificarToken, verificarPlan, notaController.obtenerAlumnosEnRiesgoAcademico);
router.get('/analitica/top',             verificarToken, verificarPlan, notaController.obtenerMejoresPromedios);
router.get('/config/asignaturas',        verificarToken, notaController.obtenerAsignaturasPorProfesorYCurso);
router.get('/asignaturas-curso/:id_curso', verificarToken, notaController.obtenerAsignaturasPorCurso);
router.get('/curso/:id_curso',           verificarToken, notaController.obtenerNotasPorCurso);
router.get('/historial/:id_nota',        verificarToken, notaController.obtenerHistorialNota);

// Escritura: solo director y profesor
router.post('/',     verificarToken, verificarRol('director', 'profesor'), notaController.crearNota);
router.put('/:id',   verificarToken, verificarRol('director', 'profesor'), notaController.actualizarNota);
router.delete('/:id', verificarToken, verificarRol('director', 'profesor'), notaController.eliminarNota);

module.exports = router;
