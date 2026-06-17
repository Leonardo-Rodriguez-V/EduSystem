/**
 * EduSystem - Script de Verificación del Sistema de Alertas Académicas
 *
 * Valida end-to-end que el servicio de notificaciones por correo funcione
 * correctamente ante notas bajas y baja asistencia.
 *
 * SEGURIDAD: Todas las operaciones sobre la BD se ejecutan dentro de una
 * transacción que se revierte al finalizar. Los correos sí se envían realmente
 * (vía Resend) para confirmar que el servicio de email responde.
 *
 * Uso: node verificarSistemaAlertas.js
 */

require('dotenv').config();
const pool = require('./src/config/db');
const { alertaNotaBaja, alertaAsistencia } = require('./src/services/emailService');

const RUT_ALUMNO_PRUEBA = '14.888.959-3';
const UMBRAL_ASISTENCIA = 85;

const REGISTROS_ASISTENCIA = [
  { fecha: '2026-05-05', estado: 'ausente' },
  { fecha: '2026-05-06', estado: 'ausente' },
  { fecha: '2026-05-07', estado: 'presente' },
  { fecha: '2026-05-08', estado: 'ausente' },
  { fecha: '2026-05-09', estado: 'ausente' },
  { fecha: '2026-05-12', estado: 'ausente' },
  { fecha: '2026-05-13', estado: 'presente' },
];

const NOTAS_PRUEBA = [2.5, 3.1, 2.8];

async function verificarSistemaAlertas() {
  console.log('\x1b[36m%s\x1b[0m', '\n=== VERIFICACIÓN DEL SISTEMA DE ALERTAS ACADÉMICAS ===\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('[+] Transacción iniciada (los datos se revertirán al finalizar)\n');

    // ── 1. Localizar alumno de prueba ─────────────────────────────────────────
    console.log('[+] Localizando alumno de prueba...');
    const { rows: [alumno] } = await client.query(`
      SELECT al.id, al.nombre_completo, al.rut, al.id_curso,
             c.nombre AS curso_nombre
      FROM alumnos al
      JOIN cursos c ON c.id = al.id_curso
      WHERE al.rut = $1
    `, [RUT_ALUMNO_PRUEBA]);

    if (!alumno) {
      throw new Error(`Alumno con RUT ${RUT_ALUMNO_PRUEBA} no encontrado en la base de datos.`);
    }
    console.log(`    \x1b[32m[OK]\x1b[0m ${alumno.nombre_completo} | Curso: ${alumno.curso_nombre} (id_curso=${alumno.id_curso})\n`);

    // ── 2. Localizar apoderado vinculado ──────────────────────────────────────
    console.log('[+] Localizando apoderado vinculado...');
    const { rows: apoderados } = await client.query(`
      SELECT u.correo, u.nombre_completo
      FROM apoderado_alumno aa
      JOIN usuarios u ON u.id = aa.id_apoderado
      WHERE aa.id_alumno = $1
    `, [alumno.id]);

    if (apoderados.length === 0) {
      throw new Error(`El alumno ID ${alumno.id} no tiene apoderado vinculado.`);
    }
    const apoderado = apoderados[0];
    console.log(`    \x1b[32m[OK]\x1b[0m ${apoderado.nombre_completo} — ${apoderado.correo}\n`);

    // ── 3. Obtener asignaturas principales ────────────────────────────────────
    console.log('[+] Obteniendo asignaturas principales del curso...');
    const { rows: asignaturas } = await client.query(`
      SELECT DISTINCT ON (asig.nombre) asig.id, asig.nombre
      FROM asignaturas asig
      JOIN cursos c ON c.colegio_id = asig.colegio_id
      WHERE c.id = $1
        AND asig.nombre IN ('Matemática','Lenguaje y Comunicación','Ciencias Naturales')
      ORDER BY asig.nombre, asig.id
    `, [alumno.id_curso]);

    if (asignaturas.length < 3) {
      throw new Error('No se encontraron las 3 asignaturas principales para este curso.');
    }
    console.log(`    \x1b[32m[OK]\x1b[0m Asignaturas: ${asignaturas.map(a => a.nombre).join(', ')}\n`);

    // ── 4. Insertar notas bajas y verificar alertas de nota ───────────────────
    console.log('[+] Verificando alertas de nota baja...');
    for (let i = 0; i < 3; i++) {
      const asig = asignaturas[i];
      const nota = NOTAS_PRUEBA[i];

      await client.query(`
        INSERT INTO notas (id_alumno, descripcion, calificacion, fecha, id_asignatura)
        VALUES ($1, $2, $3, CURRENT_DATE, $4)
      `, [alumno.id, `Prueba de verificación — ${asig.nombre}`, nota, asig.id]);

      await alertaNotaBaja(
        apoderado.correo,
        apoderado.nombre_completo,
        alumno.nombre_completo,
        asig.nombre,
        nota
      );
      console.log(`    \x1b[32m[OK]\x1b[0m Correo enviado | ${asig.nombre}: ${nota}`);
    }
    console.log('');

    // ── 5. Insertar registros de asistencia y verificar alerta de inasistencia ─
    console.log('[+] Verificando alertas de inasistencia...');
    for (const r of REGISTROS_ASISTENCIA) {
      await client.query(
        `DELETE FROM asistencia WHERE id_alumno = $1 AND fecha = $2`,
        [alumno.id, r.fecha]
      );
      await client.query(
        `INSERT INTO asistencia (id_alumno, fecha, estado) VALUES ($1, $2, $3)`,
        [alumno.id, r.fecha, r.estado]
      );
    }

    const { rows: [resumen] } = await client.query(`
      SELECT
        ROUND(100.0 * SUM(CASE WHEN estado = 'presente' THEN 1 ELSE 0 END)
          / NULLIF(COUNT(*), 0), 1) AS porcentaje,
        COUNT(*) AS total
      FROM asistencia
      WHERE id_alumno = $1
    `, [alumno.id]);

    const porcentaje = parseFloat(resumen.porcentaje);
    console.log(`    Asistencia en transacción: ${resumen.total} registros → ${porcentaje}%`);

    if (porcentaje < UMBRAL_ASISTENCIA) {
      await alertaAsistencia(
        apoderado.correo,
        apoderado.nombre_completo,
        alumno.nombre_completo,
        porcentaje
      );
      console.log(`    \x1b[32m[OK]\x1b[0m Correo de inasistencia enviado (${porcentaje}% < ${UMBRAL_ASISTENCIA}%)\n`);
    } else {
      console.log(`    \x1b[33m[INFO]\x1b[0m Porcentaje (${porcentaje}%) sobre umbral, no se envía alerta.\n`);
    }

  } finally {
    // ── 6. Revertir SIEMPRE — los datos de prueba no persisten ────────────────
    await client.query('ROLLBACK');
    client.release();
    console.log('[+] Transacción revertida. La base de datos no fue modificada.\n');
  }
}

verificarSistemaAlertas()
  .then(() => {
    console.log('\x1b[42m\x1b[30m%s\x1b[0m', ' ÉXITO: Sistema de alertas verificado correctamente. ');
    console.log('\x1b[32m%s\x1b[0m', 'Revisa el correo del apoderado para confirmar la recepción.\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\x1b[41m\x1b[37m%s\x1b[0m', ` ERROR: ${err.message} `);
    process.exit(1);
  });
