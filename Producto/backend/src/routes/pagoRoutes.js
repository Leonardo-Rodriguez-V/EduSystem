const express = require('express');
const router  = express.Router();
const {
  crearSolicitud,
  crearPreferenciaMercadoPago,
  webhookMercadoPago,
  crearOrdenPayPal,
  capturarPayPal,
  registrarTransferencia,
} = require('../controllers/pagoController');

// Paso 1 — registrar solicitud y obtener precio confirmado
router.post('/solicitud',            crearSolicitud);

// MercadoPago
router.post('/mercadopago/crear',    crearPreferenciaMercadoPago);
router.post('/mercadopago/webhook',  webhookMercadoPago);

// PayPal
router.post('/paypal/crear',         crearOrdenPayPal);
router.post('/paypal/capturar',      capturarPayPal);

// Transferencia manual
router.post('/transferencia',        registrarTransferencia);

module.exports = router;
