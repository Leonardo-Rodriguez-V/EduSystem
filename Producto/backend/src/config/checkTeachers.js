require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

async function check() {
  const res = await pool.query("SELECT correo, nombre_completo FROM usuarios WHERE rol = 'profesor' LIMIT 5");
  console.log(res.rows);
  process.exit(0);
}
check();
