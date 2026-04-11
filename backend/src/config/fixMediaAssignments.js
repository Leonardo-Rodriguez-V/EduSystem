require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener IDs necesarios
    const { rows: cursos }      = await client.query('SELECT id, nombre FROM cursos');
    const { rows: asignaturas } = await client.query('SELECT id, nombre FROM asignaturas');
    const { rows: profs }       = await client.query(
      `SELECT id, correo FROM usuarios WHERE rol = 'profesor'`
    );

    const cId = (n) => cursos.find(c => c.nombre === n)?.id;
    const aId = (n) => asignaturas.find(a => a.nombre.toLowerCase() === n.toLowerCase())?.id;
    const pId = (c) => profs.find(p => p.correo === c)?.id;

    const mediaCursos = ['1° Medio', '2° Medio', '3° Medio', '4° Medio'];
    const anaId       = pId('ana@edusync.com');
    const veroId      = pId('veronica.naranjo@edusync.cl');
    const llId        = aId('Lengua y Literatura');
    const avId        = aId('Artes Visuales');

    if (!anaId)  { console.error('❌ No se encontró ana@edusync.com');               process.exit(1); }
    if (!veroId) { console.error('❌ No se encontró veronica.naranjo@edusync.cl');    process.exit(1); }
    if (!llId)   { console.error('❌ No se encontró asignatura "Lengua y Literatura"'); process.exit(1); }
    if (!avId)   { console.error('❌ No se encontró asignatura "Artes Visuales"');     process.exit(1); }

    // 1. Quitar a Verónica de Lengua y Literatura en todos los Medios
    for (const curso of mediaCursos) {
      const cid = cId(curso);
      if (!cid) continue;
      const r = await client.query(
        `DELETE FROM curso_asignatura_profesor
         WHERE id_curso=$1 AND id_asignatura=$2 AND id_profesor=$3`,
        [cid, llId, veroId]
      );
      if (r.rowCount > 0) console.log(`  🗑  Verónica / Lengua y Literatura / ${curso} — eliminado`);
    }

    // 2. Agregar a Ana en Lengua y Literatura para 2°, 3°, 4° Medio (1° ya existe)
    for (const curso of mediaCursos) {
      const cid = cId(curso);
      if (!cid) continue;
      const r = await client.query(
        `INSERT INTO curso_asignatura_profesor (id_curso, id_asignatura, id_profesor)
         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [cid, llId, anaId]
      );
      if (r.rowCount > 0) console.log(`  ✅ Ana / Lengua y Literatura / ${curso} — insertado`);
      else                console.log(`  ⏭  Ana / Lengua y Literatura / ${curso} — ya existía`);
    }

    // 3. Agregar a Verónica en Artes Visuales para todos los Medios
    for (const curso of mediaCursos) {
      const cid = cId(curso);
      if (!cid) continue;
      const r = await client.query(
        `INSERT INTO curso_asignatura_profesor (id_curso, id_asignatura, id_profesor)
         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [cid, avId, veroId]
      );
      if (r.rowCount > 0) console.log(`  ✅ Verónica / Artes Visuales / ${curso} — insertado`);
      else                console.log(`  ⏭  Verónica / Artes Visuales / ${curso} — ya existía`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Correcciones aplicadas correctamente.');
    console.log('   Ana Gómez      → Lengua y Literatura en 1°, 2°, 3°, 4° Medio');
    console.log('   Verónica Naranjo → Artes Visuales en 1°, 2°, 3°, 4° Medio');

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

main();
