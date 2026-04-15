require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

// ─── BLOQUES HORARIOS JEC ─────────────────────────────────────────────────────
const BLOQUES = [
  { inicio: '08:00', fin: '09:30' },  // B0 — Alta concentración
  { inicio: '09:45', fin: '11:15' },  // B1 — Alta concentración
  { inicio: '11:30', fin: '13:00' },  // B2 — Media concentración
  { inicio: '13:45', fin: '15:15' },  // B3 — Tarde (activas/artísticas)
  { inicio: '15:30', fin: '17:00' },  // B4 — Solo Media (JEC extra)
];

// ─── BOLSAS SEMANALES ─────────────────────────────────────────────────────────
// Formato: [nombre_asignatura, cantidad_de_bloques_en_la_semana]

const BOLSA_PARVULARIA = [            // 15 bloques: 3 por día (lun-vie)
  ['Lenguaje Verbal',                          3],
  ['Pensamiento Matemático',                   3],
  ['Corporalidad y Movimiento',                2],
  ['Exploración del Entorno Natural',          2],
  ['Identidad y Autonomía',                    2],
  ['Lenguajes Artísticos',                     1],
  ['Convivencia y Ciudadanía',                 1],
  ['Comprensión del Entorno Sociocultural',    1],
];

const BOLSA_BASICA_MENOR = [          // 19 bloques: 4 (lun-jue) + 3 (vie)
  ['Lenguaje y Comunicación',                  4],
  ['Matemática',                               4],
  ['Ciencias Naturales',                       2],
  ['Historia, Geografía y Ciencias Sociales',  2],
  ['Educación Física y Salud',                 2],
  ['Artes Visuales',                           1],
  ['Música',                                   1],
  ['Tecnología',                               1],
  ['Religión',                                 1],
  ['Orientación',                              1],
];

const BOLSA_BASICA_MAYOR = [          // 19 bloques: 4 (lun-jue) + 3 (vie)
  ['Lengua y Literatura',                      3],
  ['Matemática',                               3],
  ['Historia, Geografía y Ciencias Sociales',  2],
  ['Ciencias Naturales',                       2],
  ['Inglés',                                   2],
  ['Educación Física y Salud',                 2],
  ['Artes Visuales',                           1],
  ['Música',                                   1],
  ['Tecnología',                               1],
  ['Religión',                                 1],
  ['Orientación',                              1],
];

const BOLSA_MEDIA_INICIAL = [         // 21 bloques: 5 (lun/mié) + 4 (mar/jue) + 3 (vie)
  ['Lengua y Literatura',                      3],
  ['Matemática',                               3],
  ['Historia, Geografía y Ciencias Sociales',  2],
  ['Biología',                                 2],
  ['Química',                                  2],
  ['Física',                                   2],
  ['Inglés',                                   2],
  ['Educación Física y Salud',                 2],
  ['Artes Visuales',                           1],
  ['Filosofía',                                1],
  ['Orientación',                              1],
];

const BOLSA_MEDIA_FINAL = [           // 21 bloques: 5 (lun/mié) + 4 (mar/jue) + 3 (vie)
  ['Lengua y Literatura',                      3],
  ['Matemática',                               3],
  ['Historia, Geografía y Ciencias Sociales',  2],
  ['Biología',                                 2],
  ['Química',                                  2],
  ['Física',                                   2],
  ['Inglés',                                   2],
  ['Educación Física y Salud',                 1],
  ['Artes Visuales',                           1],
  ['Filosofía',                                1],
  ['Educación Ciudadana',                      1],
  ['Orientación',                              1],
];

// ─── PRIORIDADES PEDAGÓGICAS JEC ─────────────────────────────────────────────
// preferBlocks: índices preferidos (0=08:00, 1=09:45, 2=11:30, 3=13:45, 4=15:30)
// preferDays:   días preferidos   (1=Lunes … 5=Viernes)
// score bajo = mayor prioridad para ese slot
const PRIORIDAD = {
  // TRONCALES → primeros bloques de la mañana
  'Matemática':                              { preferBlocks: [0, 1] },
  'Lengua y Literatura':                     { preferBlocks: [0, 1] },
  'Lenguaje y Comunicación':                 { preferBlocks: [0, 1] },
  'Lenguaje Verbal':                         { preferBlocks: [0, 1] },
  'Pensamiento Matemático':                  { preferBlocks: [0, 1] },
  // CIENCIAS → media mañana
  'Ciencias Naturales':                      { preferBlocks: [1, 2] },
  'Biología':                                { preferBlocks: [1, 2] },
  'Química':                                 { preferBlocks: [2, 3] },
  'Física':                                  { preferBlocks: [2, 3] },
  // HUMANIDADES / IDIOMAS → media mañana o tarde
  'Historia, Geografía y Ciencias Sociales': { preferBlocks: [2, 3] },
  'Inglés':                                  { preferBlocks: [2, 3] },
  // ACTIVAS / ARTÍSTICAS → tarde
  'Educación Física y Salud':                { preferBlocks: [3, 4] },
  'Artes Visuales':                          { preferBlocks: [3, 4] },
  'Música':                                  { preferBlocks: [3, 4] },
  'Tecnología':                              { preferBlocks: [3, 4] },
  'Lenguajes Artísticos':                    { preferBlocks: [2, 3] },
  'Corporalidad y Movimiento':               { preferBlocks: [2, 3] },
  'Exploración del Entorno Natural':         { preferBlocks: [2]    },
  'Comprensión del Entorno Sociocultural':   { preferBlocks: [2]    },
  'Identidad y Autonomía':                   { preferBlocks: [1, 2] },
  'Convivencia y Ciudadanía':                { preferBlocks: [1, 2] },
  // CIERRE DE SEMANA → viernes tarde
  'Religión':                                { preferBlocks: [3, 4], preferDays: [4, 5] },
  'Orientación':                             { preferBlocks: [3, 4], preferDays: [5]    },
  'Filosofía':                               { preferBlocks: [2, 3, 4]                   },
  'Educación Ciudadana':                     { preferBlocks: [2, 3, 4]                   },
};

// ─── SLOTS DISPONIBLES POR NIVEL ─────────────────────────────────────────────
function getSlotsDisponibles(nivel) {
  const slots = [];
  for (let dia = 1; dia <= 5; dia++) {
    let maxB;
    if (nivel === 'parvularia')         maxB = 3;                    // B0-B2 todos los días
    else if (nivel.startsWith('media')) maxB = dia === 5 ? 3 : 5;   // Vie 3 bloques, resto 5
    else                                maxB = dia === 5 ? 3 : 4;   // Vie 3 bloques, resto 4
    for (let b = 0; b < maxB; b++) slots.push({ dia, b });
  }
  return slots;
}

// ─── AUXILIARES ───────────────────────────────────────────────────────────────
const norm = (s) =>
  s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function scoreSlot(asigNombre, dia, bloque) {
  const pref  = PRIORIDAD[asigNombre] || {};
  let   score = 50 + Math.random() * 8; // base + ruido para variedad
  if (pref.preferBlocks?.includes(bloque)) score -= 40;
  if (pref.preferDays?.includes(dia))      score -= 15;
  return score;
}

function getNivel(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes('kínder') || n.includes('kinder') || n.includes('nt1') || n.includes('nt2')) return 'parvularia';
  if (n.match(/[1-4]°\s*básico/))  return 'basica_menor';
  if (n.match(/[5-8]°\s*básico/))  return 'basica_mayor';
  if (n.match(/[12]°\s*medio/))    return 'media_inicial';
  if (n.match(/[34]°\s*medio/))    return 'media_final';
  return null;
}

function getBolsa(nivel) {
  return {
    parvularia:    BOLSA_PARVULARIA,
    basica_menor:  BOLSA_BASICA_MENOR,
    basica_mayor:  BOLSA_BASICA_MAYOR,
    media_inicial: BOLSA_MEDIA_INICIAL,
    media_final:   BOLSA_MEDIA_FINAL,
  }[nivel] ?? null;
}

// ─── GENERADOR PRINCIPAL ──────────────────────────────────────────────────────
function generateSchedule(cursos, asignaturas, asignaciones) {
  const schedule  = [];
  const busyProf  = new Set(); // `${dia}-${b}-${idProf}`  → profesor ocupado
  const busyCurso = new Set(); // `${idCurso}-${dia}-${b}` → curso ocupado

  const asigId  = (nombre) => asignaturas.find(a => norm(a.nombre) === norm(nombre))?.id ?? null;
  const profFor = (id_curso, id_asig) =>
    asignaciones.find(a => a.id_curso === id_curso && a.id_asignatura === id_asig)?.id_profesor ?? null;

  // Media primero (más restricciones por el B5 JEC)
  const orden = [...cursos].sort((a, b) => {
    const peso = (n) => n.includes('Medio') ? 0 : n.includes('Básico') ? 1 : 2;
    return peso(a.nombre) - peso(b.nombre);
  });

  for (const curso of orden) {
    const nivel = getNivel(curso.nombre);
    const bolsa = getBolsa(nivel);
    if (!nivel || !bolsa) { console.warn(`  ⚠️  Sin bolsa: ${curso.nombre}`); continue; }

    // Expandir bolsa con shuffling para variedad entre intentos
    const tareas = shuffle(
      bolsa.flatMap(([asigNombre, cant]) => Array(cant).fill(asigNombre))
    );

    // Más restrictivas primero (menos preferBlocks = más difícil de ubicar)
    tareas.sort((a, b) => {
      const r = (n) => PRIORIDAD[n]?.preferBlocks?.length ?? 5;
      return r(a) - r(b);
    });

    const slotsBase = getSlotsDisponibles(nivel);
    const diaAsig   = new Set(); // evitar misma asig dos veces el mismo día

    for (const asigNombre of tareas) {
      const aid = asigId(asigNombre);
      if (!aid) { console.warn(`    ⚠️  Asignatura no encontrada: "${asigNombre}" (${curso.nombre})`); continue; }

      const pid = profFor(curso.id, aid);

      const candidatos = slotsBase
        .filter(({ dia, b }) => {
          if (busyCurso.has(`${curso.id}-${dia}-${b}`))   return false; // curso ocupado
          if (pid && busyProf.has(`${dia}-${b}-${pid}`))  return false; // prof ocupado
          if (diaAsig.has(`${curso.id}-${dia}-${asigNombre}`)) return false; // no repetir asig en mismo día
          return true;
        })
        .map(slot => ({ ...slot, score: scoreSlot(asigNombre, slot.dia, slot.b) }))
        .sort((a, b) => a.score - b.score);

      if (candidatos.length === 0) return null; // sin hueco → reintentar

      const { dia, b } = candidatos[0];
      busyCurso.add(`${curso.id}-${dia}-${b}`);
      if (pid) busyProf.add(`${dia}-${b}-${pid}`);
      diaAsig.add(`${curso.id}-${dia}-${asigNombre}`);
      schedule.push({ cid: curso.id, aid, pid, dia, bIdx: b });
    }
  }
  return schedule;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: cursos }      = await client.query('SELECT id, nombre FROM cursos');
    const { rows: asignaturas } = await client.query('SELECT id, nombre FROM asignaturas');
    const { rows: asignaciones } = await client.query(
      'SELECT id_curso, id_asignatura, id_profesor FROM curso_asignatura_profesor'
    );

    console.log('🗑️  Limpiando horario anterior...');
    await client.query('DELETE FROM horario');

    console.log('🔄 Generando horario JEC con Bolsa Semanal + Prioridad Pedagógica...\n');
    let finalSchedule = null;
    let attempts      = 0;
    const MAX         = 5000;

    while (attempts < MAX) {
      attempts++;
      finalSchedule = generateSchedule(cursos, asignaturas, asignaciones);
      if (finalSchedule) {
        console.log(`✅ Solución 100% limpia encontrada en el intento #${attempts}`);
        break;
      }
      if (attempts % 500 === 0) console.log(`   ... intento ${attempts}/${MAX}`);
    }

    if (!finalSchedule) throw new Error(`Sin solución tras ${MAX} intentos. Revisa las asignaciones.`);

    // Insertar horario final
    let insertados = 0;
    for (const s of finalSchedule) {
      const bloque = BLOQUES[s.bIdx];
      await client.query(
        `INSERT INTO horario (id_curso, id_asignatura, id_profesor, dia_semana, hora_inicio, hora_fin)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [s.cid, s.aid, s.pid, String(s.dia), bloque.inicio, bloque.fin]
      );
      insertados++;
    }

    await client.query('COMMIT');

    console.log(`\n📊 RESUMEN:`);
    console.log(`   Bloques insertados : ${insertados}`);
    console.log(`   Cursos procesados  : ${cursos.length}`);
    console.log(`   Intentos usados    : ${attempts}`);
    console.log(`\n💡 Ejecuta: node src/config/checkConflicts.js`);

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

main();
