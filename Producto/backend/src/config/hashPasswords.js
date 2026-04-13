/**
 * Script de migración: hashea las contraseñas en texto plano existentes en la BD.
 * Ejecutar UNA sola vez con: node src/config/hashPasswords.js
 */
require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const hashearContrasenas = async () => {
  const { rows: usuarios } = await pool.query('SELECT id, contraseña FROM usuarios');

  let actualizados = 0;

  for (const usuario of usuarios) {
    const ya_hasheada = usuario.contraseña?.startsWith('$2');
    if (ya_hasheada) {
      console.log(`⏭️  Usuario ${usuario.id}: ya tiene hash, se omite`);
      continue;
    }

    const hash = await bcrypt.hash(usuario.contraseña, SALT_ROUNDS);
    await pool.query('UPDATE usuarios SET contraseña = $1 WHERE id = $2', [hash, usuario.id]);
    console.log(`✅ Usuario ${usuario.id}: contraseña hasheada`);
    actualizados++;
  }

  console.log(`\nListo. ${actualizados} contraseña(s) actualizadas.`);
  process.exit(0);
};

hashearContrasenas().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
