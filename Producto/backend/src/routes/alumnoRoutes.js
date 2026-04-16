const express = require('express');
const router = express.Router();
const alumnoController = require('../controllers/alumnoController');

// GET /api/alumnos?id_curso=1
router.get('/', alumnoController.obtenerAlumnos);
// GET /api/alumnos/apoderado/:id_apoderado — debe ir ANTES de /:id
router.get('/apoderado/:id_apoderado', alumnoController.obtenerAlumnosPorApoderado);
// GET /api/alumnos/:id
router.get('/:id', alumnoController.obtenerAlumnoPorId);
// POST /api/alumnos
router.post('/', alumnoController.crearAlumno);
// PUT /api/alumnos/:id
router.put('/:id', alumnoController.actualizarAlumno);
// DELETE /api/alumnos/:id
router.delete('/:id', alumnoController.eliminarAlumno);

module.exports = router;
