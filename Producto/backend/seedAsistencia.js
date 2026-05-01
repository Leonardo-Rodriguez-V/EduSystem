require('dotenv').config();
const pool = require('./src/config/db');

// ─── DÍAS ESCOLARES 2026 (Marzo 2 → Abril 28) ────────────────────────────────
const HOLIDAYS = new Set(['2026-04-03', '2026-04-06']); // Viernes Santo, Lunes Pascua

function getSchoolDays() {
  const days = [];
  const d = new Date('2026-03-02');
  const end = new Date('2026-04-28');
  while (d <= end) {
    const day = d.getDay();
    const str = d.toISOString().split('T')[0];
    if (day !== 0 && day !== 6 && !HOLIDAYS.has(str)) days.push(str);
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Decide estado para un alumno dado su tasa de asistencia objetivo
// tardanzas = ~8% de los días asistidos
function getEstado(targetRate) {
  const tardanzaRate = targetRate * 0.08;
  const presenteRate = targetRate * 0.92;
  const r = Math.random();
  if (r < tardanzaRate)              return 'tardanza';
  if (r < tardanzaRate + presenteRate) return 'presente';
  return 'ausente';
}

async function seedAsistencia() {
  const client = await pool.connect();
  try {
    const schoolDays = getSchoolDays();
    const TOTAL_DIAS = schoolDays.length; // 39 días
    console.log(`📅 Días escolares: ${TOTAL_DIAS} (${schoolDays[0]} → ${schoolDays[TOTAL_DIAS - 1]})`);

    // ── Obtener todos los alumnos ──────────────────────────────────────────────
    const { rows: alumnos } = await client.query('SELECT id FROM alumnos ORDER BY id');
    const ids = alumnos.map(a => a.id);
    console.log(`👦 Total alumnos: ${ids.length}`);

    // ── Verificar si ya hay datos ──────────────────────────────────────────────
    const { rows: [{ total }] } = await client.query('SELECT COUNT(*) as total FROM asistencia');
    if (parseInt(total) > 0) {
      console.log(`⚠️  Ya existen ${total} registros. Limpiando...`);
      await client.query('DELETE FROM asistencia');
    }

    // ── Categorizar alumnos ────────────────────────────────────────────────────
    const shuffled = shuffle(ids);

    // 5 alumnos críticos: 40-55% asistencia (muy en riesgo)
    const criticos = new Set(shuffled.slice(0, 5));
    // 5 alumnos en riesgo: 55-72% asistencia (en riesgo claro)
    const enRiesgo = new Set(shuffled.slice(5, 10));
    // 25 alumnos límite: 75-84% (vigilados, no en peligro inmediato)
    const limite = new Set(shuffled.slice(10, 35));
    // Resto: 85-100% buena asistencia

    // ── Generar registros ──────────────────────────────────────────────────────
    const registros = [];
    const stats = { criticos: [], enRiesgo: [], limite: [], buenos: 0 };

    for (const id of ids) {
      let targetRate;

      if (criticos.has(id)) {
        targetRate = 0.40 + Math.random() * 0.15; // 40-55%
      } else if (enRiesgo.has(id)) {
        targetRate = 0.55 + Math.random() * 0.17; // 55-72%
      } else if (limite.has(id)) {
        targetRate = 0.75 + Math.random() * 0.09; // 75-84%
      } else {
        targetRate = 0.85 + Math.random() * 0.15; // 85-100%
      }

      let asistidos = 0;
      for (const fecha of schoolDays) {
        const estado = getEstado(targetRate);
        if (estado !== 'ausente') asistidos++;
        registros.push({ id_alumno: id, fecha, estado });
      }

      const pct = Math.round((asistidos / TOTAL_DIAS) * 100);
      if (criticos.has(id))    stats.criticos.push({ id, pct });
      else if (enRiesgo.has(id)) stats.enRiesgo.push({ id, pct });
      else if (limite.has(id))  stats.limite.push({ id, pct });
      else                      stats.buenos++;
    }

    // ── Insertar en lotes de 500 filas ─────────────────────────────────────────
    console.log(`\n📝 Insertando ${registros.length} registros...`);
    await client.query('BEGIN');

    const BATCH = 500;
    for (let i = 0; i < registros.length; i += BATCH) {
      const lote = registros.slice(i, i + BATCH);
      const ph   = lote.map((_, j) => `($${j * 3 + 1},$${j * 3 + 2},$${j * 3 + 3})`).join(',');
      const vals = lote.flatMap(r => [r.id_alumno, r.fecha, r.estado]);
      await client.query(`INSERT INTO asistencia (id_alumno, fecha, estado) VALUES ${ph}`, vals);
      if ((i + BATCH) % 5000 === 0) console.log(`   ... ${i + BATCH}/${registros.length}`);
    }

    await client.query('COMMIT');

    // ── Reporte final ──────────────────────────────────────────────────────────
    console.log('\n✅ Asistencia generada exitosamente');
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  REPORTE SEGÚN MINEDUC (mínimo 85% para aprobar)');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n🔴 CRÍTICOS (<55%) — ${stats.criticos.length} alumnos:`);
    stats.criticos.forEach(s => console.log(`   Alumno ID ${s.id}: ${s.pct}% (${Math.round(s.pct/100*TOTAL_DIAS)}/${TOTAL_DIAS} días)`));

    console.log(`\n🟠 EN RIESGO (55-72%) — ${stats.enRiesgo.length} alumnos:`);
    stats.enRiesgo.forEach(s => console.log(`   Alumno ID ${s.id}: ${s.pct}% (${Math.round(s.pct/100*TOTAL_DIAS)}/${TOTAL_DIAS} días)`));

    console.log(`\n🟡 LÍMITE (75-84%) — ${stats.limite.length} alumnos:`);
    stats.limite.forEach(s => console.log(`   Alumno ID ${s.id}: ${s.pct}%`));

    console.log(`\n🟢 BUENA ASISTENCIA (85%+) — ${stats.buenos} alumnos`);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`  Total registros: ${registros.length}`);
    console.log(`  Días cubiertos:  ${TOTAL_DIAS}`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seedAsistencia();
