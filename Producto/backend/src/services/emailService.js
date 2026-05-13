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

module.exports = { alertaNotaBaja, alertaAsistencia, alertaAnotacionNegativa, emailRecuperacionContrasena, emailContactoLanding };
