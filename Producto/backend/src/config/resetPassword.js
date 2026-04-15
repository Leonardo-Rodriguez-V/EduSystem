/**
 * Resetea contraseñas específicas a un hash bcrypt conocido.
 * Uso: node src/config/resetPassword.js
 */
require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');

const USUARIOS = [
  { correo: 'leonardo.alejandrorv@gmail.com', nuevaContraseña: 'Leonardo1' },
  { correo: 'ana@edusync.com',                nuevaContraseña: 'ana123456' },
  { correo: 'san@gmail.com',                  nuevaContraseña: 'sandro123' },
];

(async () => {
  for (const u of USUARIOS) {
    const hash = await bcrypt.hash(u.nuevaContraseña, 10);
    const { rowCount } = await pool.query(
      'UPDATE usuarios SET contraseña = $1 WHERE correo = $2',
      [hash, u.correo]
    );
    if (rowCount > 0) {
      console.log(`✅ ${u.correo} → contraseña actualizada`);
    } else {
      console.log(`⚠️  ${u.correo} → no encontrado en la BD`);
    }
  }
  console.log('\nListo.');
  process.exit(0);
})().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
