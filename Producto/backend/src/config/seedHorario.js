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
// Media: 23 slots disponibles (Lun-Jue 5 bloques + Vie 3 bloques con salida 13:30)
// Básica: 19 slots (Lun-Jue 4 bloques + Vie 3 bloques)
// Parvularia: 15 slots (3 bloques por día)

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

// MEJORA: 23 bloques (llena los 23 slots JEC de media)
// Se agrega Religión y Consejo de Curso para aprovechar los 2 slots libres
// Se mantiene Biología en 2 bloques (corrección respecto a propuesta V3)
const BOLSA_MEDIA_INICIAL = [         // 23 bloques: 5 (lun-jue) + 3 (vie) — 1° y 2° Medio
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
  ['Religión',                                 1],  // aprovecha slot libre #1
  ['Consejo de Curso',                         1],  // aprovecha slot libre #2
];

// MEJORA: 3° y 4° Medio con bolsas separadas para personalizar cada nivel
const BOLSA_TERCERO_MEDIO = [         // 23 bloques: 5 (lun-jue) + 3 (vie) — 3° Medio
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
  ['Electivo',                                 1],  // aprovecha slot libre #1
  ['Consejo de Curso',                         1],  // aprovecha slot libre #2
];

const BOLSA_CUARTO_MEDIO = [          // 23 bloques: 5 (lun-jue) + 3 (vie) — 4° Medio
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
  ['Taller JEC',                               1],  // aprovecha slot libre #1
  ['Consejo de Curso',                         1],  // aprovecha slot libre #2
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
  // CIERRE DE JORNADA → tarde/viernes
  'Religión':                                { preferBlocks: [3, 4], preferDays: [4, 5] },
  'Orientación':                             { preferBlocks: [3, 4], preferDays: [5]    },
  'Filosofía':                               { preferBlocks: [2, 3, 4]                  },
  'Educación Ciudadana':                     { preferBlocks: [2, 3, 4]                  },
  // NUEVOS — cierre de semana o tarde
  'Consejo de Curso':                        { preferBlocks: [2, 3], preferDays: [5]    }, // viernes tarde
  'Electivo':                                { preferBlocks: [3, 4]                     }, // tarde libre
  'Taller JEC':                              { preferBlocks: [3, 4]                     }, // tarde libre
};

// ─── SLOTS DISPONIBLES POR NIVEL ─────────────────────────────────────────────
// Media: Viernes con salida a las 13:30 → solo 3 bloques (B0-B2)
function getSlotsDisponibles(nivel) {
  const slots = [];
  for (let dia = 1; dia <= 5; dia++) {
    let maxB;
    if (nivel === 'parvularia')                                                    maxB = 3;
    else if (nivel === 'media_inicial' || nivel === 'tercero_medio' || nivel === 'cuarto_medio')
                                                                                   maxB = dia === 5 ? 3 : 5;
    else                                                                           maxB = dia === 5 ? 3 : 4;
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

// MEJORA: 3° y 4° Medio ahora tienen niveles distintos para bolsas separadas
function getNivel(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes('kínder') || n.includes('kinder') || n.includes('nt1') || n.includes('nt2')) return 'parvularia';
  if (n.match(/[1-4]°\s*básico/))  return 'basica_menor';
  if (n.match(/[5-8]°\s*básico/))  return 'basica_mayor';
  if (n.match(/[12]°\s*medio/))    return 'media_inicial';
  if (n.match(/3°\s*medio/))       return 'tercero_medio';
  if (n.match(/4°\s*medio/))       return 'cuarto_medio';
  return null;
}

function getBolsa(nivel) {
  return {
    parvularia:    BOLSA_PARVULARIA,
    basica_menor:  BOLSA_BASICA_MENOR,
    basica_mayor:  BOLSA_BASICA_MAYOR,
    media_inicial: BOLSA_MEDIA_INICIAL,
    tercero_medio: BOLSA_TERCERO_MEDIO,
    cuarto_medio:  BOLSA_CUARTO_MEDIO,
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

  // Media primero (más restricciones: 23 slots completamente llenos)
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
          if (busyCurso.has(`${curso.id}-${dia}-${b}`))         return false; // curso ocupado
          if (pid && busyProf.has(`${dia}-${b}-${pid}`))        return false; // prof ocupado
          if (diaAsig.has(`${curso.id}-${dia}-${asigNombre}`))  return false; // no repetir asig en mismo día
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

    // Insertar nuevas asignaturas si aún no existen
    for (const nombre of ['Consejo de Curso', 'Electivo', 'Taller JEC', 'Religión']) {
      await client.query(
        `INSERT INTO asignaturas (nombre) SELECT $1 WHERE NOT EXISTS (SELECT 1 FROM asignaturas WHERE nombre = $1)`,
        [nombre]
      );
    }

    const { rows: cursos }       = await client.query('SELECT id, nombre FROM cursos');
    const { rows: asignaturas }  = await client.query('SELECT id, nombre FROM asignaturas');
    const { rows: asignaciones } = await client.query(
      'SELECT id_curso, id_asignatura, id_profesor FROM curso_asignatura_profesor'
    );

    console.log('🗑️  Limpiando horario anterior...');
    await client.query('DELETE FROM horario');

    console.log('🔄 Generando horario JEC — Versión mejorada V4...\n');
    console.log('   1° y 2° Medio : 23 bloques (+ Religión + Consejo de Curso)');
    console.log('   3° Medio      : 23 bloques (+ Electivo + Consejo de Curso)');
    console.log('   4° Medio      : 23 bloques (+ Taller JEC + Consejo de Curso)');
    console.log('   Viernes Media : salida 13:30 (solo B0-B2)\n');

    const cursosA = cursos.filter(c => !c.nombre.endsWith(' B'));
    const cursosB = cursos.filter(c => c.nombre.endsWith(' B'));
    
    let finalScheduleA = null;
    let finalScheduleB = null;
    const MAX = 10000;

    console.log(`\nGenerando horario para Track A (${cursosA.length} cursos)...`);
    let attemptsA = 0;
    while (attemptsA < MAX) {
      attemptsA++;
      finalScheduleA = generateSchedule(cursosA, asignaturas, asignaciones);
      if (finalScheduleA) {
        console.log(`✅ Track A: Solución 100% limpia en el intento #${attemptsA}`);
        break;
      }
      if (attemptsA % 500 === 0) console.log(`   ... intento A ${attemptsA}/${MAX}`);
    }

    console.log(`\nGenerando horario para Track B (${cursosB.length} cursos)...`);
    let attemptsB = 0;
    if (cursosB.length > 0) {
      while (attemptsB < MAX) {
        attemptsB++;
        finalScheduleB = generateSchedule(cursosB, asignaturas, asignaciones);
        if (finalScheduleB) {
          console.log(`✅ Track B: Solución 100% limpia en el intento #${attemptsB}`);
          break;
        }
        if (attemptsB % 500 === 0) console.log(`   ... intento B ${attemptsB}/${MAX}`);
      }
    }

    if (!finalScheduleA || (cursosB.length > 0 && !finalScheduleB)) {
      throw new Error(`Sin solución. Track A intentos: ${attemptsA}, Track B intentos: ${attemptsB}`);
    }

    const finalSchedule = [...finalScheduleA, ...(finalScheduleB || [])];

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
    console.log(`   Intentos usados    : ${attemptsA + attemptsB}`);
    console.log(`\n💡 Para exportar a Word: npm run export:horario`);

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
