require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const cursos = await client.query('SELECT id, nombre FROM cursos');
    const asignaturas = await client.query('SELECT id, nombre FROM asignaturas');
    const profesores = await client.query("SELECT id, nombre_completo, especialidad FROM usuarios WHERE rol = 'profesor' LIMIT 5");

    console.log('🌱 Poblando datos de demostración para Horarios y Evaluaciones...');

    for (const c of cursos.rows) {
        // Horario base para cada curso (Lunes a Viernes, bloque 1 y 2)
        const asig1 = asignaturas.rows[Math.floor(Math.random() * asignaturas.rows.length)];
        const asig2 = asignaturas.rows[Math.floor(Math.random() * asignaturas.rows.length)];
        
        for (let dia = 1; dia <= 5; dia++) {
            await client.query(
                'INSERT INTO horarios (id_curso, id_asignatura, dia_semana, bloque_inicio, bloque_fin) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
                [c.id, asig1.id, dia, '08:00', '09:30']
            );
            await client.query(
                'INSERT INTO horarios (id_curso, id_asignatura, dia_semana, bloque_inicio, bloque_fin) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
                [c.id, asig2.id, dia, '09:45', '11:15']
            );
        }

        // Una evaluación próxima
        await client.query(
            'INSERT INTO evaluaciones (id_curso, id_asignatura, id_profesor, titulo, descripcion, fecha) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
            [c.id, asig1.id, profesores.rows[0].id, 'Evaluación Diagnóstica', 'Contenidos de repaso año anterior', '2026-04-15']
        );
    }

    await client.query('COMMIT');
    console.log('✅ Datos de demo creados.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e);
  } finally {
    client.release();
    pool.end();
  }
}
main();
