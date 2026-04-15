require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

async function check() {
  const res = await pool.query("SELECT correo, contraseña FROM usuarios WHERE correo = 'claudia.morales@edusync.cl'");
  console.log('Usuario:', res.rows[0]);
  process.exit(0);
}
check();
