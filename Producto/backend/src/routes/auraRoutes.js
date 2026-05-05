const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/auraController');
const { verificarToken } = require('../middleware/auth');

router.post('/chat', verificarToken, chat);

module.exports = router;
