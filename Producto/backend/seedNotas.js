require('dotenv').config();
const pool = require('./src/config/db');

// ─── EVALUACIONES POR ASIGNATURA (2 pruebas en el período) ───────────────────
const EVALUACIONES = [
  { desc: 'Prueba Unidad N°1',       mes: '2026-03' },
  { desc: 'Trabajo Práctico',         mes: '2026-04' },
  { desc: 'Prueba Unidad N°2',       mes: '2026-04' },
];

// Fecha aleatoria dentro de un mes (solo días hábiles aprox)
function fechaEnMes(mesStr) {
  const [y, m] = mesStr.split('-').map(Number);
  const dias = [7, 10, 14, 17, 21, 24, 28];
  const dia = dias[Math.floor(Math.random() * dias.length)];
  return `${y}-${String(m).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
}

// Genera una nota dentro de un rango, redondeada a 1 decimal, entre 1.0 y 7.0
function genNota(min, max) {
  const raw = min + Math.random() * (max - min);
  return Math.min(7.0, Math.max(1.0, Math.round(raw * 10) / 10));
}

// ─── PERFILES DE RENDIMIENTO ──────────────────────────────────────────────────
// categoria → [min, max] para cada prueba individual
const PERFILES = {
  muyBajo:    [1.0, 2.8],   // Reprobados claros
  bajo:       [2.5, 3.9],   // En riesgo de reprobar
  normal:     [4.0, 5.7],   // Aprobados normales
  bueno:      [5.0, 6.5],   // Sobre el promedio
  excelente:  [6.2, 7.0],   // Destacados
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function seedNotas() {
  const client = await pool.connect();
  try {
    console.log('📚 Iniciando generación de notas...\n');

    // 1. Limpiar notas existentes
    const { rows: [{ total }] } = await client.query('SELECT COUNT(*) as total FROM notas');
    if (parseInt(total) > 0) {
      console.log(`⚠️  Limpiando ${total} notas existentes...`);
      await client.query('DELETE FROM notas');
    }

    // 2. Obtener alumnos con su curso
    const { rows: alumnos } = await client.query(`
      SELECT a.id, a.id_curso, c.nombre as curso
      FROM alumnos a
      JOIN cursos c ON a.id_curso = c.id
      ORDER BY a.id
    `);
    console.log(`👦 Total alumnos: ${alumnos.length}`);

    // 3. Obtener asignaturas por curso (solo las que tienen profesor asignado)
    const { rows: capRows } = await client.query(`
      SELECT DISTINCT id_curso, id_asignatura
      FROM curso_asignatura_profesor
      ORDER BY id_curso, id_asignatura
    `);
    const asigsPorCurso = {};
    for (const r of capRows) {
      if (!asigsPorCurso[r.id_curso]) asigsPorCurso[r.id_curso] = [];
      asigsPorCurso[r.id_curso].push(r.id_asignatura);
    }

    // 4. Asignar perfil a cada alumno
    const ids = alumnos.map(a => a.id);
    const shuffled = shuffle([...ids]);
    const total_alumnos = ids.length;

    // Distribución:
    //  15 muy bajos  → reprobados claros
    //  25 bajos      → en riesgo de reprobar
    //  350 normales  → aprobados regulares
    //  120 buenos    → sobre el promedio
    //  50 excelentes → destacados
    const N_MUY_BAJO  = 15;
    const N_BAJO      = 25;
    const N_NORMAL    = 350;
    const N_BUENO     = 120;
    // resto → excelente

    const perfilMap = {};
    shuffled.slice(0, N_MUY_BAJO).forEach(id => perfilMap[id] = 'muyBajo');
    shuffled.slice(N_MUY_BAJO, N_MUY_BAJO + N_BAJO).forEach(id => perfilMap[id] = 'bajo');
    shuffled.slice(N_MUY_BAJO + N_BAJO, N_MUY_BAJO + N_BAJO + N_NORMAL).forEach(id => perfilMap[id] = 'normal');
    shuffled.slice(N_MUY_BAJO + N_BAJO + N_NORMAL, N_MUY_BAJO + N_BAJO + N_NORMAL + N_BUENO).forEach(id => perfilMap[id] = 'bueno');
    shuffled.slice(N_MUY_BAJO + N_BAJO + N_NORMAL + N_BUENO).forEach(id => perfilMap[id] = 'excelente');

    console.log(`\n📊 Distribución de perfiles:`);
    console.log(`   🔴 Muy bajos  (1.0–2.8): ${N_MUY_BAJO} alumnos`);
    console.log(`   🟠 Bajos      (2.5–3.9): ${N_BAJO} alumnos`);
    console.log(`   🟡 Normales   (4.0–5.7): ${N_NORMAL} alumnos`);
    console.log(`   🟢 Buenos     (5.0–6.5): ${N_BUENO} alumnos`);
    console.log(`   ⭐ Excelentes (6.2–7.0): ${total_alumnos - N_MUY_BAJO - N_BAJO - N_NORMAL - N_BUENO} alumnos\n`);

    // 5. Generar registros de notas
    const registros = [];
    const stats = { muyBajo: [], bajo: [], normal: 0, bueno: 0, excelente: 0 };

    for (const alumno of alumnos) {
      const perfil = perfilMap[alumno.id] || 'normal';
      const [min, max] = PERFILES[perfil];
      const asigs = asigsPorCurso[alumno.id_curso] || [];

      // Varianza por alumno: corrimiento base del perfil (hace que cada alumno sea distinto)
      const corrimientoBase = (Math.random() - 0.5) * 0.6;

      let sumaNotas = 0;
      let countNotas = 0;

      for (const id_asig of asigs) {
        // Variar ligeramente por asignatura (algunos son mejores en ciertas materias)
        const corrimientoAsig = (Math.random() - 0.5) * 0.8;
        const minAdj = Math.max(1.0, min + corrimientoBase + corrimientoAsig);
        const maxAdj = Math.min(7.0, max + corrimientoBase + corrimientoAsig);

        // Seleccionar 2 o 3 evaluaciones aleatoriamente
        const evals = shuffle(EVALUACIONES).slice(0, 2 + Math.floor(Math.random() * 2));

        for (const ev of evals) {
          const nota = genNota(minAdj, maxAdj);
          sumaNotas += nota;
          countNotas++;
          registros.push({
            id_alumno:    alumno.id,
            id_asignatura: id_asig,
            descripcion:  ev.desc,
            calificacion: nota,
            fecha:        fechaEnMes(ev.mes),
          });
        }
      }

      // Recopilar stats de perfiles bajos
      if (perfil === 'muyBajo' || perfil === 'bajo') {
        const prom = countNotas > 0 ? Math.round((sumaNotas / countNotas) * 10) / 10 : 0;
        stats[perfil].push({ id: alumno.id, curso: alumno.curso, promedio: prom });
      } else {
        stats[perfil]++;
      }
    }

    // 6. Insertar en lotes de 500
    console.log(`📝 Insertando ${registros.length} registros de notas...`);
    await client.query('BEGIN');

    const BATCH = 500;
    for (let i = 0; i < registros.length; i += BATCH) {
      const lote = registros.slice(i, i + BATCH);
      const ph   = lote.map((_, j) => `($${j*5+1},$${j*5+2},$${j*5+3},$${j*5+4},$${j*5+5})`).join(',');
      const vals = lote.flatMap(r => [r.id_alumno, r.id_asignatura, r.descripcion, r.calificacion, r.fecha]);
      await client.query(
        `INSERT INTO notas (id_alumno, id_asignatura, descripcion, calificacion, fecha) VALUES ${ph}`,
        vals
      );
      if ((i + BATCH) % 10000 === 0) console.log(`   ... ${i + BATCH}/${registros.length}`);
    }

    await client.query('COMMIT');

    // 7. Reporte
    console.log('\n✅ Notas generadas exitosamente');
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  REPORTE DE NOTAS (escala chilena 1.0–7.0, mínimo 4.0)');
    console.log('═══════════════════════════════════════════════════════════');

    console.log(`\n🔴 MUY BAJOS — ${stats.muyBajo.length} alumnos (en riesgo de reprobar el año):`);
    stats.muyBajo.forEach(s => console.log(`   ID ${s.id} | ${s.curso} → Prom. ${s.promedio}`));

    console.log(`\n🟠 BAJOS — ${stats.bajo.length} alumnos (zona de riesgo, necesitan apoyo):`);
    stats.bajo.forEach(s => console.log(`   ID ${s.id} | ${s.curso} → Prom. ${s.promedio}`));

    console.log(`\n🟡 Normales: ${typeof stats.normal === 'number' ? stats.normal : stats.normal.length} alumnos aprobados (4.0–5.7)`);
    console.log(`🟢 Buenos: ${typeof stats.bueno === 'number' ? stats.bueno : stats.bueno.length} alumnos sobre el promedio (5.0–6.5)`);
    console.log(`⭐ Excelentes: ${typeof stats.excelente === 'number' ? stats.excelente : stats.excelente.length} alumnos destacados (6.2–7.0)`);
    console.log(`\n   Total notas insertadas: ${registros.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seedNotas();
