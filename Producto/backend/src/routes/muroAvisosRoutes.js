const express = require('express');
const router = express.Router();
const { obtenerAvisos, crearAviso, actualizarAviso, eliminarAviso } = require('../controllers/muroAvisosController');

router.get('/', obtenerAvisos);
router.post('/', crearAviso);
router.put('/:id', actualizarAviso);
router.delete('/:id', eliminarAviso);

module.exports = router;
