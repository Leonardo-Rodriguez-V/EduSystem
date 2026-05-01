require('dotenv').config();
const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seedAllSpecialistsB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hashProfesor = await bcrypt.hash('Profesor123', 10);

    // Obtener todos los profesores del Track A
    const { rows: profsA } = await client.query(`
      SELECT DISTINCT u.nombre_completo, u.correo 
      FROM usuarios u
      JOIN curso_asignatura_profesor cap ON u.id = cap.id_profesor
      JOIN cursos c ON cap.id_curso = c.id
      WHERE c.nombre LIKE '% A'
    `);

    console.log(`🚀 Analizando ${profsA.length} profesores de Track A...`);
    for (const p of profsA) {
      const baseCorreo = p.correo.split('@')[0];
      const correoB = `${baseCorreo}.b@edusync.cl`;
      
      // No duplicar si ya es un correo .b o si es @edusync.com (caso Ana)
      if (p.correo.includes('.b@')) continue;

      // Verificar si ya es un Jefe B (para no crear un duplicado con .b)
      const { rows: isJefeB } = await client.query('SELECT u.id FROM cursos c JOIN usuarios u ON c.id_profesor_jefe = u.id WHERE c.nombre LIKE \'% B\' AND u.correo = $1', [p.correo]);
      
      if (isJefeB.length > 0) {
        console.log(`ℹ️ ${p.correo} ya es Jefe en Track B, no requiere clon .b`);
        continue;
      }

      await client.query(
        `INSERT INTO usuarios (nombre_completo, correo, rol, contraseña) 
         VALUES ($1, $2, 'profesor', $3) 
         ON CONFLICT (correo) DO UPDATE SET nombre_completo = EXCLUDED.nombre_completo`,
        [p.nombre_completo + ' (B)', correoB, hashProfesor]
      );
      console.log(`✅ Clon creado/actualizado: ${correoB}`);
    }

    await client.query('COMMIT');
    console.log('🎉 Sincronización de Especialistas B completada.');
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seedAllSpecialistsB();
