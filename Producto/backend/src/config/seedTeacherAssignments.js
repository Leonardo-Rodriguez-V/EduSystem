require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insertar asignaturas de Parvularia si no existen
    const parvulariaNombres = [
      'Identidad y Autonomía', 'Convivencia y Ciudadanía', 'Corporalidad y Movimiento',
      'Lenguaje Verbal', 'Lenguajes Artísticos', 'Exploración del Entorno Natural',
      'Comprensión del Entorno Sociocultural', 'Pensamiento Matemático',
    ];
    for (const nombre of parvulariaNombres) {
      await client.query(
        `INSERT INTO asignaturas (nombre) VALUES ($1) ON CONFLICT DO NOTHING`,
        [nombre]
      );
    }

    const { rows: cursos }      = await client.query('SELECT id, nombre FROM cursos');
    const { rows: asignaturas } = await client.query('SELECT id, nombre FROM asignaturas');
    const { rows: profesores }  = await client.query("SELECT id, correo FROM usuarios WHERE rol = 'profesor'");

    const cursoId = (nombre) => {
      const n = nombre.toLowerCase().trim().replace('°', '').replace('ro', '').replace('do', '').replace('er', '').replace('to', '');
      return cursos.find(c => {
        const cn = c.nombre.toLowerCase().trim().replace('°', '').replace('ro', '').replace('do', '').replace('er', '').replace('to', '');
        return cn === n;
      })?.id;
    };

    const asigId = (nombre) =>
      asignaturas.find(a => a.nombre.toLowerCase().trim() === nombre.toLowerCase().trim())?.id;

    const profId = (correo) =>
      profesores.find(p => p.correo.toLowerCase() === correo.toLowerCase())?.id;

    let ok = 0;
    let skip = 0;

    const assign = async (correo, cursoNombre, asigNombre) => {
      const pid = profId(correo);
      const cid = cursoId(cursoNombre);
      const aid = asigId(asigNombre);
      if (!pid || !cid || !aid) {
        console.warn(`  ⚠️  Sin datos: ${correo} → "${cursoNombre}" → "${asigNombre}"`);
        skip++;
        return;
      }
      await client.query(
        `INSERT INTO curso_asignatura_profesor (id_curso, id_asignatura, id_profesor)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [cid, aid, pid]
      );
      ok++;
    };

    // ─── PARVULARIA ────────────────────────────────────────────────────────────
    console.log('📚 Parvularia...');
    const parvSubjs = [
      'Identidad y Autonomía', 'Convivencia y Ciudadanía', 'Corporalidad y Movimiento',
      'Lenguaje Verbal', 'Lenguajes Artísticos', 'Exploración del Entorno Natural',
      'Comprensión del Entorno Sociocultural', 'Pensamiento Matemático',
    ];
    for (const s of parvSubjs) {
      await assign('claudia.morales@edusync.cl', 'Pre-Kínder (NT1)', s);
      await assign('patricia.vega@edusync.cl',   'Kínder (NT2)',     s);
    }

    // ─── 1°–4° BÁSICO ──────────────────────────────────────────────────────────
    console.log('📚 1°–4° Básico...');
    const basicaMenorMap = {
      '1° Básico': 'maria.gonzalez@edusync.cl',
      '2° Básico': 'carmen.lopez@edusync.cl',
      '3° Básico': 'rosa.martinez@edusync.cl',
      '4° Básico': 'isabel.hernandez@edusync.cl',
    };
    const basicaMenorSubjs = [
      'Lenguaje y Comunicación', 'Matemática', 'Ciencias Naturales',
      'Historia, Geografía y Ciencias Sociales', 'Educación Física y Salud',
      'Artes Visuales', 'Música', 'Tecnología', 'Orientación', 'Religión',
    ];
    for (const [curso, correo] of Object.entries(basicaMenorMap)) {
      for (const s of basicaMenorSubjs) {
        await assign(correo, curso, s);
      }
    }

    // ─── 5°–8° BÁSICO ──────────────────────────────────────────────────────────
    console.log('📚 5°–8° Básico...');
    const basicaMayorCursos = ['5° Básico', '6° Básico', '7° Básico', '8° Básico'];

    const jefesBasicaMayor = [
      { correo: 'carlos.perez@edusync.cl',   asig: 'Matemática',                              jefeEn: '5° Básico' },
      { correo: 'jorge.ramirez@edusync.cl',  asig: 'Lengua y Literatura',                     jefeEn: '6° Básico' },
      { correo: 'luis.soto@edusync.cl',      asig: 'Historia, Geografía y Ciencias Sociales', jefeEn: '7° Básico' },
      { correo: 'rodrigo.flores@edusync.cl', asig: 'Ciencias Naturales',                      jefeEn: '8° Básico' },
    ];
    for (const j of jefesBasicaMayor) {
      for (const c of basicaMayorCursos) {
        await assign(j.correo, c, j.asig);
      }
      await assign(j.correo, j.jefeEn, 'Orientación');
    }

    const espBasicaMayor = [
      { correo: 'tomas.espinoza@edusync.cl',    asig: 'Inglés' },
      { correo: 'andres.castillo@edusync.cl',   asig: 'Educación Física y Salud' },
      { correo: 'gabriela.naranjo@edusync.cl',  asig: 'Artes Visuales' },
      { correo: 'natalia.contreras@edusync.cl', asig: 'Música' },
      { correo: 'felipe.miranda@edusync.cl',    asig: 'Tecnología' },
      { correo: 'sandra.fernandez@edusync.cl',  asig: 'Religión' },
    ];
    for (const e of espBasicaMayor) {
      for (const c of basicaMayorCursos) {
        await assign(e.correo, c, e.asig);
      }
    }

    // ─── 1°–4° MEDIO ───────────────────────────────────────────────────────────
    console.log('📚 1°–4° Medio...');
    const mediaCursos = ['1° Medio', '2° Medio', '3° Medio', '4° Medio'];

    // Jefes de curso: cada uno enseña su asignatura principal en los 4 cursos de Media
    // Ana Gómez — jefe 1° Medio, Lengua y Literatura en todos los Medios
    for (const c of mediaCursos) await assign('ana@edusync.com', c, 'Lengua y Literatura');
    await assign('ana@edusync.com', '1° Medio', 'Orientación');

    // Verónica Naranjo — jefe 2° Medio, Artes Visuales en todos los Medios
    for (const c of mediaCursos) await assign('veronica.naranjo@edusync.cl', c, 'Artes Visuales');
    await assign('veronica.naranjo@edusync.cl', '2° Medio', 'Orientación');

    // Pablo Silva — jefe 3° Medio, Matemática en todos los Medios
    for (const c of mediaCursos) await assign('pablo.silva@edusync.cl', c, 'Matemática');
    await assign('pablo.silva@edusync.cl', '3° Medio', 'Orientación');

    // Diego Rojas — jefe 4° Medio, Historia en todos los Medios
    for (const c of mediaCursos) await assign('diego.rojas@edusync.cl', c, 'Historia, Geografía y Ciencias Sociales');
    await assign('diego.rojas@edusync.cl', '4° Medio', 'Orientación');

    // Especialistas de Media (enseñan su asignatura en los 4 cursos)
    const espMedia = [
      { correo: 'ricardo.munoz@edusync.cl',      asig: 'Biología' },
      { correo: 'alejandra.torres@edusync.cl',   asig: 'Química' },
      { correo: 'roberto.vargas@edusync.cl',      asig: 'Física' },
      { correo: 'daniela.castro@edusync.cl',      asig: 'Inglés' },
      { correo: 'marcelo.reyes@edusync.cl',       asig: 'Educación Física y Salud' },
      { correo: 'francisca.sepulveda@edusync.cl', asig: 'Filosofía' },
    ];
    for (const e of espMedia) {
      for (const c of mediaCursos) await assign(e.correo, c, e.asig);
    }
    await assign('francisca.sepulveda@edusync.cl', '3° Medio', 'Educación Ciudadana');
    await assign('francisca.sepulveda@edusync.cl', '4° Medio', 'Educación Ciudadana');

    await client.query('COMMIT');
    console.log(`\n✅ Asignaciones completadas: ${ok} insertados, ${skip} omitidos.`);

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

main();
