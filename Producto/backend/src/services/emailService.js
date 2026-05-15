const RESEND_API_URL = 'https://api.resend.com/emails';

async function enviarEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY no configurada, email omitido:', subject);
    return;
  }
  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'EduSync <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[EMAIL] Error Resend:', res.status, err);
    } else {
      const data = await res.json().catch(() => ({}));
      console.log('[EMAIL] Enviado OK —', subject, '— id:', data.id || '(sin id)');
    }
  } catch (err) {
    console.error('[EMAIL] Error de red:', err.message);
  }
}

function alertaNotaBaja(correoApoderado, nombreApoderado, nombreAlumno, asignatura, calificacion) {
  return enviarEmail({
    to: correoApoderado,
    subject: `Alerta académica: nota bajo 4.0 en ${asignatura}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8f9fa;border-radius:12px;">
        <h2 style="color:#6366f1;margin:0 0 8px">EduSync</h2>
        <p style="color:#444;margin:0 0 20px">Estimado/a <strong>${nombreApoderado}</strong>,</p>
        <p style="color:#444">Le informamos que <strong>${nombreAlumno}</strong> obtuvo una nota de
          <strong style="color:#ef4444;font-size:1.2em"> ${parseFloat(calificacion).toFixed(1)}</strong>
          en <strong>${asignatura}</strong>, que se encuentra bajo la nota mínima de aprobación (4.0).</p>
        <p style="color:#444">Le recomendamos contactar al profesor/a de la asignatura para coordinar apoyo.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#888;font-size:12px">Este es un mensaje automático de EduSync. No responda este correo.</p>
      </div>`,
  });
}

function alertaAsistencia(correoApoderado, nombreApoderado, nombreAlumno, porcentaje) {
  return enviarEmail({
    to: correoApoderado,
    subject: `Alerta de asistencia: ${nombreAlumno} bajo el 85%`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8f9fa;border-radius:12px;">
        <h2 style="color:#6366f1;margin:0 0 8px">EduSync</h2>
        <p style="color:#444;margin:0 0 20px">Estimado/a <strong>${nombreApoderado}</strong>,</p>
        <p style="color:#444">Le informamos que la asistencia de <strong>${nombreAlumno}</strong> ha bajado al
          <strong style="color:#f59e0b;font-size:1.2em"> ${porcentaje}%</strong>.</p>
        <p style="color:#444">La normativa MINEDUC exige un mínimo de <strong>85% de asistencia</strong> para poder aprobar el año escolar. Le recomendamos tomar las medidas necesarias.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#888;font-size:12px">Este es un mensaje automático de EduSync. No responda este correo.</p>
      </div>`,
  });
}

function alertaAnotacionNegativa(correoApoderado, nombreApoderado, nombreAlumno, texto, nombreProfesor) {
  return enviarEmail({
    to: correoApoderado,
    subject: `Anotación negativa registrada: ${nombreAlumno}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8f9fa;border-radius:12px;">
        <h2 style="color:#6366f1;margin:0 0 8px">EduSync</h2>
        <p style="color:#444;margin:0 0 20px">Estimado/a <strong>${nombreApoderado}</strong>,</p>
        <p style="color:#444">Se ha registrado una anotación negativa para <strong>${nombreAlumno}</strong>
          por parte de <strong>${nombreProfesor}</strong>:</p>
        <blockquote style="background:#fff;border-left:4px solid #ef4444;padding:12px 16px;border-radius:0 8px 8px 0;color:#333;margin:16px 0">
          "${texto}"
        </blockquote>
        <p style="color:#444">Le recomendamos ponerse en contacto con el establecimiento para mayor información.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#888;font-size:12px">Este es un mensaje automático de EduSync. No responda este correo.</p>
      </div>`,
  });
}

function emailRecuperacionContrasena(correo, nombre, token) {
  const url = `${process.env.FRONTEND_URL || 'https://edu-system-r3bw.vercel.app'}/reset-password?token=${token}`;
  return enviarEmail({
    to: correo,
    subject: 'Recuperación de contraseña — EduSync',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8f9fa;border-radius:12px;">
        <h2 style="color:#6366f1;margin:0 0 8px">EduSync</h2>
        <p style="color:#444;margin:0 0 20px">Hola <strong>${nombre}</strong>,</p>
        <p style="color:#444">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para continuar:</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${url}" style="background:#6366f1;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px">
            Restablecer contraseña
          </a>
        </div>
        <p style="color:#888;font-size:13px">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#888;font-size:12px">Este es un mensaje automático de EduSync. No responda este correo.</p>
      </div>`,
  });
}

function emailContactoLanding(nombre, correoRemitente, mensaje) {
  return enviarEmail({
    to: 'educational.systemchl@gmail.com',
    subject: `Nuevo mensaje de contacto — ${nombre}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8f9fa;border-radius:12px;">
        <h2 style="color:#6366f1;margin:0 0 8px">EduSync — Formulario de Contacto</h2>
        <p style="color:#444;margin:0 0 20px">Has recibido un nuevo mensaje desde la landing page.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;width:120px">Nombre</td><td style="padding:8px 0;color:#222;font-weight:600">${nombre}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px">Correo</td><td style="padding:8px 0;color:#6366f1;font-weight:600">${correoRemitente}</td></tr>
        </table>
        <div style="background:#fff;border-left:4px solid #6366f1;padding:16px 20px;border-radius:0 8px 8px 0;color:#333;margin:16px 0;white-space:pre-wrap">${mensaje}</div>
        <p style="color:#888;font-size:12px;margin-top:24px">Puedes responder directamente a <strong>${correoRemitente}</strong></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
        <p style="color:#bbb;font-size:11px">EduSync — Sistema de Gestión Educativa</p>
      </div>`,
  });
}

function bienvenidaDirector(correo, nombre, nombreColegio, plan) {
  const esPremium = plan === 'profesional' || plan === 'enterprise';
  const badgePlan = esPremium
    ? `<span style="background:#6366f1;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">Plan Premium</span>`
    : `<span style="background:#e5e7eb;color:#374151;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">Plan Normal</span>`;

  return enviarEmail({
    to: correo,
    subject: `Bienvenido/a a EduSync — ${nombreColegio}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:0;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 32px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;letter-spacing:-0.5px">EduSync</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:600">Sistema de Gestión Educativa</p>
        </div>
        <div style="padding:36px 32px">
          <p style="color:#111;font-size:18px;font-weight:800;margin:0 0 8px">¡Bienvenido/a, ${nombre}!</p>
          <p style="color:#555;margin:0 0 24px;line-height:1.6">Tu cuenta de director ha sido creada exitosamente en <strong>${nombreColegio}</strong>. Ya puedes acceder al sistema con tu correo y contraseña.</p>
          <div style="background:#f8f9fa;border-radius:12px;padding:20px 24px;margin-bottom:24px">
            <p style="margin:0 0 6px;color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Tu plan actual</p>
            ${badgePlan}
          </div>
          <div style="text-align:center;margin:28px 0">
            <a href="${process.env.FRONTEND_URL || 'https://edu-system-r3bw.vercel.app'}/login"
               style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:800;font-size:15px;display:inline-block">
              Ingresar a EduSync
            </a>
          </div>
          <p style="color:#888;font-size:13px;line-height:1.6;margin:0">Si tienes dudas, responde este correo o contáctanos. Estamos aquí para ayudarte.</p>
        </div>
        <div style="padding:20px 32px;background:#f8f9fa;border-top:1px solid #e5e7eb;text-align:center">
          <p style="margin:0;color:#bbb;font-size:11px">EduSync — Sistema de Gestión Educativa · Chile</p>
        </div>
      </div>`,
  });
}

module.exports = { alertaNotaBaja, alertaAsistencia, alertaAnotacionNegativa, emailRecuperacionContrasena, emailContactoLanding, bienvenidaDirector };
