const express = require('express');
const router = express.Router();
const notaController = require('../controllers/calificacionController');

// GET /api/notas?id_alumno=1
router.get('/', notaController.obtenerNotasPorAlumno);

// GET /api/notas/curso/:id_curso
router.get('/curso/:id_curso', notaController.obtenerNotasPorCurso);

// POST /api/notas
router.post('/', notaController.crearNota);

// PUT /api/notas/:id
router.put('/:id', notaController.actualizarNota);

// GET /api/notas/config/asignaturas?id_profesor=...&id_curso=...
router.get('/config/asignaturas', notaController.obtenerAsignaturasPorProfesorYCurso);

// GET /api/notas/asignaturas-curso/:id_curso
router.get('/asignaturas-curso/:id_curso', notaController.obtenerAsignaturasPorCurso);

// DELETE /api/notas/:id
router.delete('/:id', notaController.eliminarNota);

module.exports = router;
