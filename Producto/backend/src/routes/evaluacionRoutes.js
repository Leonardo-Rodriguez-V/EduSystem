const express = require('express');
const router = express.Router();
const evaluacionController = require('../controllers/evaluacionController');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Consultas: cualquier usuario autenticado
router.get('/pendientes',      verificarToken, evaluacionController.obtenerEvaluacionesPendientes);
router.get('/curso/:id_curso', verificarToken, evaluacionController.obtenerEvaluacionesPorCurso);

// Escritura: solo director y profesor
router.post('/',    verificarToken, verificarRol('director', 'profesor'), evaluacionController.crearEvaluacion);
router.put('/:id',  verificarToken, verificarRol('director', 'profesor'), evaluacionController.actualizarEvaluacion);
router.delete('/:id', verificarToken, verificarRol('director', 'profesor'), evaluacionController.eliminarEvaluacion);

module.exports = router;
