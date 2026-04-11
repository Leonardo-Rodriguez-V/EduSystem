require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function applyEduModel() {
  console.log('🚀 Aplicando Migración: Modelo Educativo Integral...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const schemaSql = fs.readFileSync(path.join(__dirname, 'edu_model_schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('✅ Esquema creado (curso_asignatura_profesor, notas.id_asignatura, evaluaciones).');

    await client.query('COMMIT');
    console.log('✅ Migración completada con éxito.');
    console.log('   ▶ Ahora ejecuta: node backend/src/config/seedTeacherAssignments.js');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante la migración:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

applyEduModel();
