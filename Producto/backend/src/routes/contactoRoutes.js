const express = require('express');
const router = express.Router();
const { emailContactoLanding } = require('../services/emailService');

router.post('/', async (req, res) => {
  const { nombre, correo, mensaje } = req.body;
  if (!nombre || !correo || !mensaje) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  try {
    await emailContactoLanding(nombre, correo, mensaje);
    res.json({ mensaje: 'Mensaje enviado correctamente' });
  } catch (err) {
    console.error('[CONTACTO] Error al enviar email:', err.message);
    res.status(500).json({ error: 'No se pudo enviar el mensaje' });
  }
});

module.exports = router;
