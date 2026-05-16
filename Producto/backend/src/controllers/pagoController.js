const pool = require('../config/db');
const { emailNuevaSolicitud } = require('../services/emailService');

// Precios autoritativos en backend (mismos que PreciosSection.jsx)
const PRECIOS = {
  normal: {
    muy_pequeno: { mensual: 19990,  trimestral: 49990,   semestral: 89990,    anual: 149990   },
    pequeno:     { mensual: 39990,  trimestral: 99990,   semestral: 179990,   anual: 299990   },
    mediano:     { mensual: 69990,  trimestral: 179990,  semestral: 329990,   anual: 549990   },
    grande:      { mensual: 119990, trimestral: 299990,  semestral: 549990,   anual: 899990   },
  },
  premium: {
    muy_pequeno: { mensual: 39990,  trimestral: 99990,   semestral: 179990,   anual: 299990   },
    pequeno:     { mensual: 79990,  trimestral: 199990,  semestral: 359990,   anual: 599990   },
    mediano:     { mensual: 139990, trimestral: 359990,  semestral: 659990,   anual: 1099990  },
    grande:      { mensual: 239990, trimestral: 599990,  semestral: 1099990,  anual: 1799990  },
  },
};

const LABELS = {
  plan:     { normal: 'Plan Normal', premium: 'Plan Premium' },
  segmento: { muy_pequeno: 'Muy pequeño (1–150)', pequeno: 'Pequeño (151–400)', mediano: 'Mediano (401–800)', grande: 'Grande (801–1.500)' },
  periodo:  { mensual: 'mensual', trimestral: 'trimestral (3 meses)', semestral: 'semestral (6 meses)', anual: 'anual' },
};

// Crear tabla si no existe
pool.query(`
  CREATE TABLE IF NOT EXISTS solicitudes_plan (
    id                 SERIAL PRIMARY KEY,
    nombre_colegio     VARCHAR(200) NOT NULL,
    nombre_director    VARCHAR(200) NOT NULL,
    correo             VARCHAR(200) NOT NULL,
    telefono           VARCHAR(50),
    nro_alumnos_aprox  INT,
    plan               VARCHAR(50)  NOT NULL,
    segmento           VARCHAR(50)  NOT NULL,
    periodo            VARCHAR(50)  NOT NULL,
    precio_clp         INT          NOT NULL,
    metodo_pago        VARCHAR(50),
    estado             VARCHAR(50)  DEFAULT 'pendiente',
    mp_preference_id   VARCHAR(200),
    mp_payment_id      VARCHAR(200),
    paypal_order_id    VARCHAR(200),
    notas              TEXT,
    creado_en          TIMESTAMPTZ  DEFAULT NOW(),
    actualizado_en     TIMESTAMPTZ  DEFAULT NOW()
  )
`).catch(err => console.error('[DB] Error creando solicitudes_plan:', err.message));

// ── PASO 1: Crear solicitud (siempre antes de elegir método) ──────────────────
const crearSolicitud = async (req, res) => {
  const { nombre_colegio, nombre_director, correo, telefono, nro_alumnos_aprox, plan, segmento, periodo } = req.body;

  if (!nombre_colegio || !nombre_director || !correo || !plan || !segmento || !periodo) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const precio = PRECIOS[plan]?.[segmento]?.[periodo];
  if (!precio) return res.status(400).json({ error: 'Combinación de plan/segmento/período inválida' });

  try {
    const { rows: [sol] } = await pool.query(`
      INSERT INTO solicitudes_plan
        (nombre_colegio, nombre_director, correo, telefono, nro_alumnos_aprox, plan, segmento, periodo, precio_clp)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id
    `, [nombre_colegio, nombre_director, correo, telefono || null, nro_alumnos_aprox || null, plan, segmento, periodo, precio]);

    res.status(201).json({ solicitudId: sol.id, precio });
  } catch (err) {
    console.error('[PAGO] Error creando solicitud:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ── MERCADOPAGO: crear preferencia ────────────────────────────────────────────
const crearPreferenciaMercadoPago = async (req, res) => {
  const { solicitudId } = req.body;
  if (!solicitudId) return res.status(400).json({ error: 'Se requiere solicitudId' });

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) return res.status(503).json({ error: 'MercadoPago no configurado aún' });

  try {
    const { rows: [sol] } = await pool.query('SELECT * FROM solicitudes_plan WHERE id=$1', [solicitudId]);
    if (!sol) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const FRONTEND = process.env.FRONTEND_URL || 'https://edu-system-r3bw.vercel.app';
    const BACKEND  = process.env.BACKEND_URL  || 'http://localhost:3000';

    const preference = {
      items: [{
        title: `EduSync ${LABELS.plan[sol.plan]} — ${LABELS.segmento[sol.segmento]} — ${LABELS.periodo[sol.periodo]}`,
        description: `Suscripción para ${sol.nombre_colegio}`,
        quantity: 1,
        currency_id: 'CLP',
        unit_price: sol.precio_clp,
      }],
      payer: { name: sol.nombre_director, email: sol.correo },
      back_urls: {
        success: `${FRONTEND}/checkout/exito?method=mercadopago&solicitud=${solicitudId}`,
        failure: `${FRONTEND}/checkout?error=pago_rechazado`,
        pending: `${FRONTEND}/checkout/exito?method=mercadopago&pending=true&solicitud=${solicitudId}`,
      },
      auto_return: 'approved',
      external_reference: String(solicitudId),
      notification_url: `${BACKEND}/api/pagos/mercadopago/webhook`,
      statement_descriptor: 'EDUSYNC',
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });
    const data = await mpRes.json();

    if (!mpRes.ok) {
      console.error('[MP] Error creando preferencia:', data);
      return res.status(500).json({ error: 'Error creando preferencia en MercadoPago' });
    }

    await pool.query(
      'UPDATE solicitudes_plan SET mp_preference_id=$1, metodo_pago=$2 WHERE id=$3',
      [data.id, 'mercadopago', solicitudId]
    );

    res.json({ init_point: data.init_point });
  } catch (err) {
    console.error('[MP] Error:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ── MERCADOPAGO: webhook de confirmación ──────────────────────────────────────
const webhookMercadoPago = async (req, res) => {
  // Responder 200 inmediatamente para que MP no reintente
  res.sendStatus(200);

  const { type, data } = req.body;
  if (type !== 'payment' || !data?.id) return;

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  try {
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const payment = await payRes.json();

    if (payment.status === 'approved') {
      const solicitudId = payment.external_reference;
      await pool.query(
        `UPDATE solicitudes_plan SET estado='pagado', mp_payment_id=$1, actualizado_en=NOW() WHERE id=$2`,
        [String(payment.id), solicitudId]
      );
      const { rows: [sol] } = await pool.query('SELECT * FROM solicitudes_plan WHERE id=$1', [solicitudId]);
      if (sol) emailNuevaSolicitud(sol, 'mercadopago').catch(() => {});
      console.log('[MP] Pago confirmado, solicitud', solicitudId);
    }
  } catch (err) {
    console.error('[MP] Error en webhook:', err.message);
  }
};

// ── PAYPAL: crear orden ───────────────────────────────────────────────────────
const crearOrdenPayPal = async (req, res) => {
  const { solicitudId } = req.body;
  if (!solicitudId) return res.status(400).json({ error: 'Se requiere solicitudId' });

  const PAYPAL_CLIENT_ID  = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_SECRET     = process.env.PAYPAL_CLIENT_SECRET;
  if (!PAYPAL_CLIENT_ID)  return res.status(503).json({ error: 'PayPal no configurado aún' });

  const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  try {
    const { rows: [sol] } = await pool.query('SELECT * FROM solicitudes_plan WHERE id=$1', [solicitudId]);
    if (!sol) return res.status(404).json({ error: 'Solicitud no encontrada' });

    // Obtener access token de PayPal
    const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    const { access_token } = await tokenRes.json();

    const FRONTEND = process.env.FRONTEND_URL || 'https://edu-system-r3bw.vercel.app';

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: String(solicitudId),
          description: `EduSync ${LABELS.plan[sol.plan]} — ${sol.nombre_colegio}`,
          amount: { currency_code: 'CLP', value: String(sol.precio_clp) },
        }],
        application_context: {
          return_url: `${FRONTEND}/checkout/exito?method=paypal&solicitud=${solicitudId}`,
          cancel_url:  `${FRONTEND}/checkout?error=cancelado`,
          brand_name:  'EduSync',
          user_action: 'PAY_NOW',
        },
      }),
    });
    const order = await orderRes.json();

    if (!orderRes.ok) {
      console.error('[PP] Error creando orden:', order);
      return res.status(500).json({ error: 'Error creando orden en PayPal' });
    }

    await pool.query(
      'UPDATE solicitudes_plan SET paypal_order_id=$1, metodo_pago=$2 WHERE id=$3',
      [order.id, 'paypal', solicitudId]
    );

    const approvalUrl = order.links.find(l => l.rel === 'approve')?.href;
    res.json({ approval_url: approvalUrl, order_id: order.id });
  } catch (err) {
    console.error('[PP] Error:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ── PAYPAL: capturar pago (llamado desde /checkout/exito) ─────────────────────
const capturarPayPal = async (req, res) => {
  const { orderId, solicitudId } = req.body;
  if (!orderId || !solicitudId) return res.status(400).json({ error: 'Faltan orderId o solicitudId' });

  const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  try {
    const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    const { access_token } = await tokenRes.json();

    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
    });
    const capture = await captureRes.json();

    if (capture.status === 'COMPLETED') {
      await pool.query(
        `UPDATE solicitudes_plan SET estado='pagado', actualizado_en=NOW() WHERE id=$1`,
        [solicitudId]
      );
      const { rows: [sol] } = await pool.query('SELECT * FROM solicitudes_plan WHERE id=$1', [solicitudId]);
      if (sol) emailNuevaSolicitud(sol, 'paypal').catch(() => {});
      res.json({ ok: true });
    } else {
      res.status(400).json({ error: 'El pago no fue completado', status: capture.status });
    }
  } catch (err) {
    console.error('[PP] Error capturando:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ── TRANSFERENCIA MANUAL ──────────────────────────────────────────────────────
const registrarTransferencia = async (req, res) => {
  const { solicitudId, notas } = req.body;
  if (!solicitudId) return res.status(400).json({ error: 'Se requiere solicitudId' });

  try {
    await pool.query(
      `UPDATE solicitudes_plan
       SET metodo_pago='transferencia', estado='pendiente_verificacion', notas=$1, actualizado_en=NOW()
       WHERE id=$2`,
      [notas || null, solicitudId]
    );
    const { rows: [sol] } = await pool.query('SELECT * FROM solicitudes_plan WHERE id=$1', [solicitudId]);
    if (sol) emailNuevaSolicitud(sol, 'transferencia').catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    console.error('[TRANSFERENCIA] Error:', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = {
  crearSolicitud,
  crearPreferenciaMercadoPago,
  webhookMercadoPago,
  crearOrdenPayPal,
  capturarPayPal,
  registrarTransferencia,
};
