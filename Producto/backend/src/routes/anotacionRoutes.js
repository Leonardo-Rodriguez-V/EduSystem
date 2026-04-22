const express = require('express');
const router = express.Router();
const { obtenerPorAlumno, obtenerPorCurso, crearAnotacion, eliminarAnotacion } = require('../controllers/anotacionController');

router.get('/',              obtenerPorAlumno);
router.get('/curso/:id_curso', obtenerPorCurso);
router.post('/',             crearAnotacion);
router.delete('/:id',        eliminarAnotacion);

module.exports = router;
