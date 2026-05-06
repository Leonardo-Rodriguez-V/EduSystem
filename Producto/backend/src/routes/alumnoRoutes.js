const express = require('express');
const router = express.Router();
const alumnoController = require('../controllers/alumnoController');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Lectura: cualquier usuario autenticado puede consultar alumnos
router.get('/',                            verificarToken, alumnoController.obtenerAlumnos);
router.get('/apoderado/:id_apoderado',     verificarToken, alumnoController.obtenerAlumnosPorApoderado);
router.get('/:id',                         verificarToken, alumnoController.obtenerAlumnoPorId);

// Escritura: solo director
router.post('/',                           verificarToken, verificarRol('director'), alumnoController.crearAlumno);
router.post('/con-apoderado',              verificarToken, verificarRol('director'), alumnoController.crearAlumnoConApoderado);
router.put('/:id',                         verificarToken, verificarRol('director'), alumnoController.actualizarAlumno);
router.delete('/:id/apoderado/:id_apoderado', verificarToken, verificarRol('director'), alumnoController.desvincularAlumnoApoderado);
router.delete('/:id',                      verificarToken, verificarRol('director'), alumnoController.eliminarAlumno);

module.exports = router;
