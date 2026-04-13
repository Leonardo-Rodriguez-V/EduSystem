const express = require('express');
const router = express.Router();
const { obtenerAvisos, crearAviso, eliminarAviso } = require('../controllers/muroAvisosController');

router.get('/', obtenerAvisos);
router.post('/', crearAviso);
router.delete('/:id', eliminarAviso);

module.exports = router;
