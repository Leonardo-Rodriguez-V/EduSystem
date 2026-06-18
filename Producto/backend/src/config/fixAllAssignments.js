require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

// ─── Asignaturas por nivel ───────────────────────────────────────────────────
const SUBJS_PARV = [
  'Identidad y Autonomía', 'Convivencia y Ciudadanía', 'Corporalidad y Movimiento',
  'Lenguaje Verbal', 'Lenguajes Artísticos', 'Exploración del Entorno Natural',
  'Comprensión del Entorno Sociocultural', 'Pensamiento Matemático',
];
const SUBJS_BASICA_MENOR = [
  'Lenguaje y Comunicación', 'Matemática', 'Ciencias Naturales',
  'Historia, Geografía y Ciencias Sociales', 'Educación Física y Salud',
  'Artes Visuales', 'Música', 'Tecnología', 'Orientación', 'Religión',
];

async function main() {
  const client = await pool.connect();
  try {
    // Obtener el colegio_id desde un profesor conocido
    const { rows: refProf } = await client.query(
      `SELECT colegio_id FROM usuarios WHERE correo = 'claudia.morales@edusync.cl' LIMIT 1`
    );
    if (!refProf.length || !refProf[0].colegio_id) {
      console.error('❌ No se encontró claudia.morales@edusync.cl o no tiene colegio_id.');
      process.exit(1);
    }
    const colegioId = refProf[0].colegio_id;
    console.log(`🏫 Trabajando con colegio_id = ${colegioId}\n`);

    const { rows: cursos }      = await client.query(
      'SELECT id, nombre, id_profesor_jefe FROM cursos WHERE colegio_id = $1 ORDER BY nombre',
      [colegioId]
    );
    const { rows: asignaturas } = await client.query(
      'SELECT id, nombre FROM asignaturas WHERE colegio_id = $1',
      [colegioId]
    );
    const { rows: profs }       = await client.query(
      "SELECT id, correo FROM usuarios WHERE rol = 'profesor' AND colegio_id = $1",
      [colegioId]
    );

    const cId  = (n) => cursos.find(c => c.nombre === n)?.id;
    const aId  = (n) => asignaturas.find(a => a.nombre.toLowerCase() === n.toLowerCase())?.id;
    const pId  = (c) => profs.find(p => p.correo.toLowerCase() === c.toLowerCase())?.id;
    const jefe = (n) => cursos.find(c => c.nombre === n)?.id_profesor_jefe;

    let ok = 0, skip = 0;

    await client.query('BEGIN');

    // ── Eliminar solo asignaciones del colegio actual (via cursos) ───────────
    await client.query(
      `DELETE FROM curso_asignatura_profesor
       WHERE id_curso IN (SELECT id FROM cursos WHERE colegio_id = $1)`,
      [colegioId]
    );
    console.log('🗑  Asignaciones del colegio eliminadas.\n');

    const assign = async (profId, cursoNombre, asigNombre) => {
      const cid = cId(cursoNombre);
      const aid = aId(asigNombre);
      if (!profId || !cid || !aid) {
        console.warn(`  ⚠  Sin datos: profId=${profId} / "${cursoNombre}" / "${asigNombre}"`);
        skip++;
        return;
      }
      await client.query(
        `INSERT INTO curso_asignatura_profesor (id_curso, id_asignatura, id_profesor)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [cid, aid, profId]
      );
      ok++;
    };

    // ─── PARVULARIA ──────────────────────────────────────────────────────────
    console.log('📚 Parvularia A + B...');
    const claudiaId  = pId('claudia.morales@edusync.cl');
    const patriciaId = pId('patricia.vega@edusync.cl');
    const jefeNT1B   = jefe('Pre-Kínder (NT1) B');
    const jefeNT2B   = jefe('Kínder (NT2) B');
    for (const s of SUBJS_PARV) {
      await assign(claudiaId,  'Pre-Kínder (NT1) A', s);
      await assign(patriciaId, 'Kínder (NT2) A',     s);
      await assign(jefeNT1B,   'Pre-Kínder (NT1) B', s);
      await assign(jefeNT2B,   'Kínder (NT2) B',     s);
    }

    // ─── 1°–4° BÁSICO (jefatura: un profe hace todo el curso) ───────────────
    console.log('📚 1°–4° Básico A + B...');
    const basicaMenorA = {
      '1° Básico A': pId('maria.gonzalez@edusync.cl'),
      '2° Básico A': pId('carmen.lopez@edusync.cl'),
      '3° Básico A': pId('rosa.martinez@edusync.cl'),
      '4° Básico A': pId('isabel.hernandez@edusync.cl'),
    };
    const basicaMenorB = {
      '1° Básico B': jefe('1° Básico B'),
      '2° Básico B': jefe('2° Básico B'),
      '3° Básico B': jefe('3° Básico B'),
      '4° Básico B': jefe('4° Básico B'),
    };
    for (const [curso, profId] of Object.entries(basicaMenorA)) {
      for (const s of SUBJS_BASICA_MENOR) await assign(profId, curso, s);
    }
    for (const [curso, profId] of Object.entries(basicaMenorB)) {
      for (const s of SUBJS_BASICA_MENOR) await assign(profId, curso, s);
    }

    // ─── 5°–8° BÁSICO (especialistas: mismos en A y B) ──────────────────────
    console.log('📚 5°–8° Básico A + B...');
    const basicaMayorCursos = [
      '5° Básico A', '6° Básico A', '7° Básico A', '8° Básico A',
      '5° Básico B', '6° Básico B', '7° Básico B', '8° Básico B',
    ];
    const jefesBasicaMayor = [
      { correo: 'carlos.perez@edusync.cl',   asig: 'Matemática',                              jefeEn: ['5° Básico A', '5° Básico B'] },
      { correo: 'jorge.ramirez@edusync.cl',  asig: 'Lengua y Literatura',                     jefeEn: ['6° Básico A', '6° Básico B'] },
      { correo: 'luis.soto@edusync.cl',      asig: 'Historia, Geografía y Ciencias Sociales', jefeEn: ['7° Básico A', '7° Básico B'] },
      { correo: 'rodrigo.flores@edusync.cl', asig: 'Ciencias Naturales',                      jefeEn: ['8° Básico A', '8° Básico B'] },
    ];
    for (const j of jefesBasicaMayor) {
      const pid = pId(j.correo);
      for (const c of basicaMayorCursos) await assign(pid, c, j.asig);
      for (const c of j.jefeEn)          await assign(pid, c, 'Orientación');
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
      const pid = pId(e.correo);
      for (const c of basicaMayorCursos) await assign(pid, c, e.asig);
    }

    // ─── 1°–4° MEDIO (especialistas: mismos en A y B) ───────────────────────
    console.log('📚 1°–4° Medio A + B...');
    const mediaCursos = [
      '1° Medio A', '2° Medio A', '3° Medio A', '4° Medio A',
      '1° Medio B', '2° Medio B', '3° Medio B', '4° Medio B',
    ];
    const anaId   = pId('ana@edusync.com');
    const veroId  = pId('veronica.naranjo@edusync.cl');
    const pabloId = pId('pablo.silva@edusync.cl');
    const diegoId = pId('diego.rojas@edusync.cl');

    for (const c of mediaCursos) {
      await assign(anaId,   c, 'Lengua y Literatura');
      await assign(veroId,  c, 'Artes Visuales');
      await assign(pabloId, c, 'Matemática');
      await assign(diegoId, c, 'Historia, Geografía y Ciencias Sociales');
    }
    // Orientación: cada jefe en su par A+B
    await assign(anaId,   '1° Medio A', 'Orientación'); await assign(anaId,   '1° Medio B', 'Orientación');
    await assign(veroId,  '2° Medio A', 'Orientación'); await assign(veroId,  '2° Medio B', 'Orientación');
    await assign(pabloId, '3° Medio A', 'Orientación'); await assign(pabloId, '3° Medio B', 'Orientación');
    await assign(diegoId, '4° Medio A', 'Orientación'); await assign(diegoId, '4° Medio B', 'Orientación');

    const espMedia = [
      { correo: 'ricardo.munoz@edusync.cl',      asig: 'Biología' },
      { correo: 'alejandra.torres@edusync.cl',   asig: 'Química' },
      { correo: 'roberto.vargas@edusync.cl',      asig: 'Física' },
      { correo: 'daniela.castro@edusync.cl',      asig: 'Inglés' },
      { correo: 'marcelo.reyes@edusync.cl',       asig: 'Educación Física y Salud' },
      { correo: 'francisca.sepulveda@edusync.cl', asig: 'Filosofía' },
    ];
    for (const e of espMedia) {
      const pid = pId(e.correo);
      for (const c of mediaCursos) await assign(pid, c, e.asig);
    }
    // Educación Ciudadana en 3° y 4° Medio A+B
    const francId = pId('francisca.sepulveda@edusync.cl');
    await assign(francId, '3° Medio A', 'Educación Ciudadana');
    await assign(francId, '3° Medio B', 'Educación Ciudadana');
    await assign(francId, '4° Medio A', 'Educación Ciudadana');
    await assign(francId, '4° Medio B', 'Educación Ciudadana');

    await client.query('COMMIT');

    console.log(`\n✅ Listo: ${ok} asignaciones insertadas, ${skip} omitidas por datos faltantes.`);
    console.log('\nEstructura resultante:');
    console.log('  Parvularia    A/B → 1 profe jefe enseña todo el curso');
    console.log('  1°–4° Básico  A   → maria.gonzalez, carmen.lopez, rosa.martinez, isabel.hernandez');
    console.log('  1°–4° Básico  B   → profesores jefe generados por seed_multitrack');
    console.log('  5°–8° Básico A+B  → mismos especialistas en ambas secciones');
    console.log('  1°–4° Medio  A+B  → mismos especialistas en ambas secciones');

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    pool.end();
  }
}

main();
