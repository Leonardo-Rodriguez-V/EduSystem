require('dotenv').config();
const pool = require('./src/config/db');
const { execSync } = require('child_process');

async function masterSeed() {
  const client = await pool.connect();
  try {
    console.log('🧹 Limpiando asignaciones previas...');
    await client.query('DELETE FROM curso_asignatura_profesor');
    console.log('✅ Tabla curso_asignatura_profesor limpia.');

    console.log('🚀 Sembrando Track A...');
    // Ejecutamos el seeder original de A
    execSync('node src/config/seedTeacherAssignments.js', { stdio: 'inherit' });

    console.log('\n🚀 Sembrando Track B con Especialistas Paralelos...');
    
    // Traer todos los datos necesarios para evitar queries en bucle
    const { rows: cursos } = await client.query('SELECT id, nombre, id_profesor_jefe FROM cursos');
    const { rows: usuarios } = await client.query('SELECT id, correo FROM usuarios');
    const { rows: assignmentsA } = await client.query(`
      SELECT cap.id_asignatura, cap.id_profesor, c.nombre as curso_nombre
      FROM curso_asignatura_profesor cap
      JOIN cursos c ON cap.id_curso = c.id
      WHERE c.nombre LIKE '% A'
    `);

    const cursosA = cursos.filter(c => c.nombre.endsWith(' A'));
    const cursosB = cursos.filter(c => c.nombre.endsWith(' B'));

    await client.query('BEGIN');
    let count = 0;

    for (const assig of assignmentsA) {
      const baseName = assig.curso_nombre.replace(' A', '');
      const cursoB = cursosB.find(c => c.nombre === `${baseName} B`);
      if (!cursoB) continue;

      let idProfesorB = assig.id_profesor;
      const cursoA = cursosA.find(c => c.nombre === assig.curso_nombre);
      const profA = usuarios.find(u => u.id === assig.id_profesor);

      // Regla 1: Si el profesor es el Jefe del curso A, cambiarlo por el Jefe del curso B
      if (cursoA && assig.id_profesor === cursoA.id_profesor_jefe) {
        idProfesorB = cursoB.id_profesor_jefe;
      } else if (profA) {
        // Regla 2: Intentar encontrar la versión ".b" del especialista
        const baseCorreo = profA.correo.split('@')[0];
        const correoB = `${baseCorreo}.b@edusync.cl`;
        const profB = usuarios.find(u => u.correo === correoB);
        
        if (profB) {
          idProfesorB = profB.id;
        }
      }

      await client.query(
        'INSERT INTO curso_asignatura_profesor (id_curso, id_asignatura, id_profesor) VALUES ($1, $2, $3)',
        [cursoB.id, assig.id_asignatura, idProfesorB]
      );
      count++;
    }

    await client.query('COMMIT');
    console.log(`✅ Track B completado: ${count} asignaciones creadas.`);

  } catch (e) {
    console.error('❌ Error en masterSeed:', e.message);
    if (client) await client.query('ROLLBACK');
  } finally {
    client.release();
    pool.end();
  }
}

masterSeed();
