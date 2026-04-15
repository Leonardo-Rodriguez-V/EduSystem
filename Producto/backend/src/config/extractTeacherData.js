require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

async function main() {
  try {
    const r = await pool.query("SELECT id, nombre_completo, rol, especialidad FROM usuarios WHERE rol = 'profesor' ORDER BY nombre_completo");
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
main();
