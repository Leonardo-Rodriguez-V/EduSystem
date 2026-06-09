/**
 * Script de prueba: notas bajas + baja asistencia para Lucas
 * Dispara correos reales al apoderado vía Resend
 * Ejecutar: node test_alerta_lucas.js
 */
require('dotenv').config();
const pool = require('./src/config/db');
const { alertaNotaBaja, alertaAsistencia } = require('./src/services/emailService');

async function main() {
  console.log('\n🔍 Buscando alumno Lucas...');

  // ── 1. Encontrar a Lucas ──────────────────────────────────────────────────
  const { rows: [lucas] } = await pool.query(`
    SELECT al.id, al.nombre_completo, al.rut, al.id_curso,
           c.nombre AS curso_nombre
    FROM alumnos al
    JOIN cursos c ON c.id = al.id_curso
    WHERE al.rut = '14.888.959-3'
  `);

  if (!lucas) {
    console.error('❌ Lucas no encontrado por RUT 14.888.959-3');
    process.exit(1);
  }
  console.log(`✅ Alumno: ${lucas.nombre_completo} | ID: ${lucas.id} | Curso: ${lucas.curso_nombre} (id_curso=${lucas.id_curso})`);

  // ── 2. Encontrar apoderado ────────────────────────────────────────────────
  const { rows: apoderados } = await pool.query(`
    SELECT u.correo, u.nombre_completo
    FROM apoderado_alumno aa
    JOIN usuarios u ON u.id = aa.id_apoderado
    WHERE aa.id_alumno = $1
  `, [lucas.id]);

  if (apoderados.length === 0) {
    console.error('❌ Lucas no tiene apoderado vinculado en apoderado_alumno');
    process.exit(1);
  }
  const apoderado = apoderados[0];
  console.log(`👨 Apoderado: ${apoderado.nombre_completo} — ${apoderado.correo}`);

  // ── 3. Buscar asignaturas principales del colegio ────────────────────────
  const { rows: asignaturas } = await pool.query(`
    SELECT DISTINCT ON (asig.nombre) asig.id, asig.nombre
    FROM asignaturas asig
    JOIN cursos c ON c.colegio_id = asig.colegio_id
    WHERE c.id = $1
      AND asig.nombre IN ('Matemática','Lenguaje y Comunicación','Ciencias Naturales')
    ORDER BY asig.nombre, asig.id
  `, [lucas.id_curso]);

  if (asignaturas.length < 3) {
    console.error('❌ No se encontraron las 3 asignaturas principales para el colegio');
    process.exit(1);
  }

  const tres = asignaturas.slice(0, 3);
  console.log(`📚 Asignaturas seleccionadas: ${tres.map(a => a.nombre).join(', ')}`);

  // ── 4. Insertar notas malas (2.5 / 3.1 / 2.8) ────────────────────────────
  const notasMalas = [
    { asig: tres[0], nota: 2.5 },
    { asig: tres[1], nota: 3.1 },
    { asig: tres[2], nota: 2.8 },
  ];

  console.log('\n📝 Insertando notas bajas...');
  for (const { asig, nota } of notasMalas) {
    await pool.query(`
      INSERT INTO notas (id_alumno, descripcion, calificacion, fecha, id_asignatura)
      VALUES ($1, $2, $3, CURRENT_DATE, $4)
    `, [lucas.id, `Prueba semestral — ${asig.nombre}`, nota, asig.id]);

    console.log(`   → ${asig.nombre}: ${nota} — enviando correo...`);
    await alertaNotaBaja(
      apoderado.correo,
      apoderado.nombre_completo,
      lucas.nombre_completo,
      asig.nombre,
      nota
    );
    console.log(`   ✅ Correo enviado para nota ${nota} en ${asig.nombre}`);
  }

  // ── 5. Insertar asistencia baja (7 registros: 5 ausentes, 2 presentes = 28%) ──
  console.log('\n📅 Insertando registros de asistencia...');
  const registros = [
    { fecha: '2026-05-05', estado: 'ausente' },
    { fecha: '2026-05-06', estado: 'ausente' },
    { fecha: '2026-05-07', estado: 'presente' },
    { fecha: '2026-05-08', estado: 'ausente' },
    { fecha: '2026-05-09', estado: 'ausente' },
    { fecha: '2026-05-12', estado: 'ausente' },
    { fecha: '2026-05-13', estado: 'presente' },
  ];

  for (const r of registros) {
    // Upsert: eliminar si ya existe para esa fecha y alumno
    await pool.query(
      `DELETE FROM asistencia WHERE id_alumno = $1 AND fecha = $2`,
      [lucas.id, r.fecha]
    );
    await pool.query(
      `INSERT INTO asistencia (id_alumno, fecha, estado) VALUES ($1, $2, $3)`,
      [lucas.id, r.fecha, r.estado]
    );
    console.log(`   → ${r.fecha}: ${r.estado}`);
  }

  // Calcular porcentaje real desde BD
  const { rows: [resumen] } = await pool.query(`
    SELECT
      ROUND(100.0 * SUM(CASE WHEN estado = 'presente' THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0), 1) AS porcentaje,
      COUNT(*) AS total
    FROM asistencia
    WHERE id_alumno = $1
  `, [lucas.id]);

  const porcentaje = parseFloat(resumen.porcentaje);
  console.log(`\n📊 Asistencia total: ${resumen.total} registros → ${porcentaje}%`);

  if (porcentaje < 85) {
    console.log('   → Bajo umbral 85%, enviando correo de asistencia...');
    await alertaAsistencia(
      apoderado.correo,
      apoderado.nombre_completo,
      lucas.nombre_completo,
      porcentaje
    );
    console.log('   ✅ Correo de asistencia enviado');
  } else {
    console.log(`   ℹ️  Porcentaje (${porcentaje}%) sobre 85%, no se envía alerta de asistencia`);
  }

  console.log('\n🎉 Prueba completada. Revisa el correo del apoderado.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error inesperado:', err.message);
  process.exit(1);
});
