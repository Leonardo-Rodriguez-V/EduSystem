require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function reset() {
  const hashProfesor   = await bcrypt.hash('Profesor123', 10);
  const hashApoderado  = await bcrypt.hash('Apoderado123', 10);

  const resProf = await pool.query(
    "UPDATE usuarios SET contraseña = $1 WHERE rol = 'profesor' RETURNING correo",
    [hashProfesor]
  );

  const resApod = await pool.query(
    "UPDATE usuarios SET contraseña = $1 WHERE rol = 'apoderado' RETURNING correo",
    [hashApoderado]
  );

  console.log(`✅ ${resProf.rowCount} profesores  → Profesor123`);
  console.log(`✅ ${resApod.rowCount} apoderados  → Apoderado123`);

  process.exit(0);
}

reset().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
