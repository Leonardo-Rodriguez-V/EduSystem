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
// POST /api/alumnos/con-apoderado — crea alumno y vincula a apoderado
router.post('/con-apoderado', alumnoController.crearAlumnoConApoderado);
// PUT /api/alumnos/:id
router.put('/:id', alumnoController.actualizarAlumno);
// DELETE /api/alumnos/:id/apoderado/:id_apoderado — desvincular sin eliminar
router.delete('/:id/apoderado/:id_apoderado', alumnoController.desvincularAlumnoApoderado);
// DELETE /api/alumnos/:id
router.delete('/:id', alumnoController.eliminarAlumno);

module.exports = router;
