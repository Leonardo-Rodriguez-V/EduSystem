require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

async function verificarBloque2() {
  const client = await pool.connect();
  try {
    console.log('🔍 VERIFICACIÓN DE FAMILIAS Y HERMANOS (BLOQUE 2)\n');

    // 1. Verificar familias de 4 hermanos
    console.log('--- 1. Familias de 4 hermanos ---');
    const res4 = await client.query(`
      SELECT split_part(nombre_completo, ' ', array_length(string_to_array(nombre_completo, ' '), 1) - 1) || ' ' || 
             split_part(nombre_completo, ' ', array_length(string_to_array(nombre_completo, ' '), 1)) as familia,
             count(*) as cantidad,
             string_agg(nombre_completo || ' (' || c.nombre || ')', ', ') as integrantes
      FROM alumnos a
      JOIN cursos c ON a.id_curso = c.id
      GROUP BY familia
      HAVING count(*) = 4
      ORDER BY familia
    `);
    res4.rows.forEach(r => console.log(`✅ Familia ${r.familia}: ${r.cantidad} hermanos -> ${r.integrantes}`));

    // 2. Verificar familias de 3 hermanos
    console.log('\n--- 2. Familias de 3 hermanos ---');
    const res3 = await client.query(`
      SELECT split_part(nombre_completo, ' ', array_length(string_to_array(nombre_completo, ' '), 1) - 1) || ' ' || 
             split_part(nombre_completo, ' ', array_length(string_to_array(nombre_completo, ' '), 1)) as familia,
             count(*) as cantidad
      FROM alumnos a
      GROUP BY familia
      HAVING count(*) = 3
    `);
    console.log(`✅ Se encontraron ${res3.rowCount} familias de 3 hermanos (Meta: 6).`);

    // 3. Verificar mellizos Ojeda Carvallo
    console.log('\n--- 3. Mellizos Ojeda Carvallo (3°B) ---');
    const resMellizos = await client.query(`
      SELECT nombre_completo, fecha_nacimiento, c.nombre as curso
      FROM alumnos a
      JOIN cursos c ON a.id_curso = c.id
      WHERE nombre_completo LIKE '%Ojeda Carvallo'
    `);
    resMellizos.rows.forEach(r => console.log(`✅ ${r.nombre_completo} | Fecha: ${r.fecha_nacimiento.toISOString().split('T')[0]} | Curso: ${r.curso}`));

    // 4. Verificar familias de 2 hermanos
    console.log('\n--- 4. Familias de 2 hermanos ---');
    const res2 = await client.query(`
      SELECT count(*) as total_familias_2
      FROM (
        SELECT count(*)
        FROM alumnos
        GROUP BY split_part(nombre_completo, ' ', array_length(string_to_array(nombre_completo, ' '), 1) - 1), 
                 split_part(nombre_completo, ' ', array_length(string_to_array(nombre_completo, ' '), 1))
        HAVING count(*) = 2
      ) as sub
    `);
    console.log(`✅ Se encontraron ${res2.rows[0].total_familias_2} familias de 2 hermanos (Meta: 25).`);

    console.log('\n✨ Verificación completada.');

  } catch (err) {
    console.error('❌ Error en la verificación:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

verificarBloque2();
