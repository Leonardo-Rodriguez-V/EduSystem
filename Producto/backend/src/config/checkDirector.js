require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function checkDirector() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT id, nombre_completo, correo FROM usuarios WHERE rol = 'director'");
    if (rows.length === 0) {
      console.log('No director found. Creating one...');
      const hash = await bcrypt.hash('Director123', 10);
      await client.query(
        "INSERT INTO usuarios (nombre_completo, correo, rol, contraseña) VALUES ($1, $2, $3, $4)",
        ['Director General', 'director@edusync.cl', 'director', hash]
      );
      console.log('✅ Director account created: director@edusync.cl / Director123');
    } else {
      console.log('Director found:', rows[0].correo);
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    client.release();
    pool.end();
  }
}
checkDirector();
