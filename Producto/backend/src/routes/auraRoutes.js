const express = require('express');
const router = express.Router();
const { chat, streamChat, resumenDiario, getHistorial, clearHistorial } = require('../controllers/auraController');
const { verificarToken, verificarPlan } = require('../middleware/auth');

router.get('/historial',       verificarToken, verificarPlan, getHistorial);
router.delete('/historial',    verificarToken, verificarPlan, clearHistorial);
router.get('/resumen-diario',  verificarToken, verificarPlan, resumenDiario);
router.post('/stream',         verificarToken, verificarPlan, streamChat);
router.post('/chat',           verificarToken, verificarPlan, chat);

module.exports = router;
