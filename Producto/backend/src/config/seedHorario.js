require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

// Bloques horarios (índice = posición, 0-3)
const BLOQUES = [
  { inicio: '08:00', fin: '09:30' },
  { inicio: '09:45', fin: '11:15' },
  { inicio: '11:30', fin: '13:00' },
  { inicio: '14:00', fin: '15:30' },
];

// Plantillas: [dia (1=Lunes..5=Viernes), bloque (0-3), nombre_asignatura]
const HORARIO_PARVULARIA = [
  [1,0,'Identidad y Autonomía'],       [1,1,'Lenguaje Verbal'],
  [1,2,'Corporalidad y Movimiento'],   [1,3,'Pensamiento Matemático'],
  [2,0,'Convivencia y Ciudadanía'],    [2,1,'Lenguajes Artísticos'],
  [2,2,'Exploración del Entorno Natural'],[2,3,'Comprensión del Entorno Sociocultural'],
  [3,0,'Identidad y Autonomía'],       [3,1,'Lenguaje Verbal'],
  [3,2,'Corporalidad y Movimiento'],   [3,3,'Pensamiento Matemático'],
  [4,0,'Convivencia y Ciudadanía'],    [4,1,'Lenguajes Artísticos'],
  [4,2,'Exploración del Entorno Natural'],[4,3,'Comprensión del Entorno Sociocultural'],
  [5,0,'Identidad y Autonomía'],       [5,1,'Lenguaje Verbal'],
  [5,2,'Corporalidad y Movimiento'],   [5,3,'Pensamiento Matemático'],
];

const HORARIO_BASICA_MENOR = [
  [1,0,'Lenguaje y Comunicación'],     [1,1,'Matemática'],
  [1,2,'Ciencias Naturales'],          [1,3,'Orientación'],
  [2,0,'Lenguaje y Comunicación'],     [2,1,'Matemática'],
  [2,2,'Historia, Geografía y Ciencias Sociales'],[2,3,'Educación Física y Salud'],
  [3,0,'Lenguaje y Comunicación'],     [3,1,'Matemática'],
  [3,2,'Ciencias Naturales'],          [3,3,'Artes Visuales'],
  [4,0,'Lenguaje y Comunicación'],     [4,1,'Matemática'],
  [4,2,'Historia, Geografía y Ciencias Sociales'],[4,3,'Música'],
  [5,0,'Lenguaje y Comunicación'],     [5,1,'Educación Física y Salud'],
  [5,2,'Tecnología'],                  [5,3,'Religión'],
];

const HORARIO_BASICA_MAYOR = [
  [1,0,'Lengua y Literatura'],         [1,1,'Matemática'],
  [1,2,'Inglés'],                      [1,3,'Orientación'],
  [2,0,'Lengua y Literatura'],         [2,1,'Matemática'],
  [2,2,'Historia, Geografía y Ciencias Sociales'],[2,3,'Educación Física y Salud'],
  [3,0,'Lengua y Literatura'],         [3,1,'Matemática'],
  [3,2,'Ciencias Naturales'],          [3,3,'Artes Visuales'],
  [4,0,'Inglés'],                      [4,1,'Historia, Geografía y Ciencias Sociales'],
  [4,2,'Ciencias Naturales'],          [4,3,'Música'],
  [5,0,'Educación Física y Salud'],    [5,1,'Tecnología'],
  [5,2,'Religión'],                    [5,3,'Matemática'],
];

const HORARIO_MEDIA_INICIAL = [
  [1,0,'Lengua y Literatura'],         [1,1,'Matemática'],
  [1,2,'Inglés'],                      [1,3,'Orientación'],
  [2,0,'Lengua y Literatura'],         [2,1,'Matemática'],
  [2,2,'Historia, Geografía y Ciencias Sociales'],[2,3,'Biología'],
  [3,0,'Matemática'],                  [3,1,'Historia, Geografía y Ciencias Sociales'],
  [3,2,'Química'],                     [3,3,'Artes Visuales'],
  [4,0,'Matemática'],                  [4,1,'Inglés'],
  [4,2,'Física'],                      [4,3,'Educación Física y Salud'],
  [5,0,'Lengua y Literatura'],         [5,1,'Matemática'],
  [5,2,'Tecnología'],                  [5,3,'Religión'],
];

const HORARIO_MEDIA_FINAL = [
  [1,0,'Lengua y Literatura'],         [1,1,'Matemática'],
  [1,2,'Filosofía'],                   [1,3,'Inglés'],
  [2,0,'Lengua y Literatura'],         [2,1,'Matemática'],
  [2,2,'Biología'],                    [2,3,'Educación Ciudadana'],
  [3,0,'Inglés'],                      [3,1,'Filosofía'],
  [3,2,'Química'],                     [3,3,'Educación Ciudadana'],
  [4,0,'Matemática'],                  [4,1,'Física'],
  [4,2,'Orientación'],                 [4,3,'Religión'],
  [5,0,'Lengua y Literatura'],         [5,1,'Matemática'],
  [5,2,'Filosofía'],                   [5,3,'Inglés'],
];

function getNivel(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes('kínder') || n.includes('kinder') || n.includes('nt1') || n.includes('nt2')) return 'parvularia';
  if (n.match(/[1-4]°\s*básico/)) return 'basica_menor';
  if (n.match(/[5-8]°\s*básico/)) return 'basica_mayor';
  if (n.match(/[1-2]°\s*medio/) || n.includes('1ro medio') || n.includes('1° medio') || n.includes('2° medio')) return 'media_inicial';
  if (n.match(/[3-4]°\s*medio/)) return 'media_final';
  return null;
}

function getPlantilla(nivel) {
  return {
    parvularia:    HORARIO_PARVULARIA,
    basica_menor:  HORARIO_BASICA_MENOR,
    basica_mayor:  HORARIO_BASICA_MAYOR,
    media_inicial: HORARIO_MEDIA_INICIAL,
    media_final:   HORARIO_MEDIA_FINAL,
  }[nivel] || null;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: cursos }      = await client.query('SELECT id, nombre FROM cursos');
    const { rows: asignaturas } = await client.query('SELECT id, nombre FROM asignaturas');
    const { rows: asignaciones } = await client.query(
      'SELECT id_curso, id_asignatura, id_profesor FROM curso_asignatura_profesor'
    );

    const asigId  = (nombre) => asignaturas.find(a => a.nombre.toLowerCase() === nombre.toLowerCase())?.id;
    const profFor = (id_curso, id_asignatura) =>
      asignaciones.find(a => a.id_curso === id_curso && a.id_asignatura === id_asignatura)?.id_profesor ?? null;

    // Limpiar horario existente
    await client.query('DELETE FROM horario');
    console.log('🗑️  Horario anterior limpiado.');

    let insertados = 0;
    let omitidos   = 0;

    for (const curso of cursos) {
      const nivel     = getNivel(curso.nombre);
      const plantilla = getPlantilla(nivel);

      if (!plantilla) {
        console.warn(`  ⚠️  Sin plantilla para: ${curso.nombre}`);
        continue;
      }

      for (const [dia, bloqueIdx, asigNombre] of plantilla) {
        const aid  = asigId(asigNombre);
        if (!aid) {
          console.warn(`    ⚠️  Asignatura no encontrada: "${asigNombre}" (${curso.nombre})`);
          omitidos++;
          continue;
        }

        const pid    = profFor(curso.id, aid);
        const bloque = BLOQUES[bloqueIdx];

        await client.query(
          `INSERT INTO horario (id_curso, id_asignatura, id_profesor, dia_semana, hora_inicio, hora_fin)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [curso.id, aid, pid, String(dia), bloque.inicio, bloque.fin]
        );
        insertados++;
      }
    }

    await client.query('COMMIT');
    console.log(`\n✅ Horario poblado: ${insertados} bloques insertados, ${omitidos} omitidos.`);

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

main();
