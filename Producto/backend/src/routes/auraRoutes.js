const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/auraController');
const { verificarToken, verificarPlan } = require('../middleware/auth');

router.post('/chat', verificarToken, verificarPlan, chat);

module.exports = router;
