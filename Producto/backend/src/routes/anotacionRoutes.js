const express = require('express');
const router = express.Router();
const { obtenerPorAlumno, obtenerPorCurso, crearAnotacion, eliminarAnotacion } = require('../controllers/anotacionController');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Consultas: cualquier usuario autenticado
router.get('/',                verificarToken, obtenerPorAlumno);
router.get('/curso/:id_curso', verificarToken, obtenerPorCurso);

// Escritura: solo director y profesor
router.post('/',    verificarToken, verificarRol('director', 'profesor'), crearAnotacion);
router.delete('/:id', verificarToken, verificarRol('director', 'profesor'), eliminarAnotacion);

module.exports = router;
