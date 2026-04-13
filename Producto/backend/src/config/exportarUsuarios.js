require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = await pool.connect();
  try {
    // Resetear claves apoderados a una conocida
    const claveApoderado = 'Apoderado2024!';
    const hashApo = await bcrypt.hash(claveApoderado, 10);
    await client.query(
      "UPDATE usuarios SET contraseña = $1 WHERE rol = 'apoderado'",
      [hashApo]
    );

    // Consultar todos los usuarios ordenados por rol
    const { rows } = await client.query(`
      SELECT nombre_completo, correo, rol
      FROM usuarios
      ORDER BY
        CASE rol
          WHEN 'director' THEN 1
          WHEN 'profesor'  THEN 2
          WHEN 'apoderado' THEN 3
          ELSE 4
        END,
        nombre_completo
    `);

    const claves = {
      director:  '(tu contraseña personal)',
      profesor:  'Profesor2024!',
      apoderado: claveApoderado,
    };

    let contenido = '';
    contenido += '=====================================================\n';
    contenido += '         EDUSYNC — LISTADO DE USUARIOS              \n';
    contenido += '=====================================================\n\n';

    let rolActual = '';
    for (const u of rows) {
      if (u.rol !== rolActual) {
        rolActual = u.rol;
        const titulo = { director: 'DIRECTOR', profesor: 'PROFESORES', apoderado: 'APODERADOS' }[u.rol] || u.rol.toUpperCase();
        contenido += `\n───────────────────────────────────────\n`;
        contenido += ` ${titulo}\n`;
        contenido += `───────────────────────────────────────\n`;
      }
      contenido += `  Nombre  : ${u.nombre_completo}\n`;
      contenido += `  Correo  : ${u.correo}\n`;
      contenido += `  Clave   : ${claves[u.rol]}\n`;
      contenido += `\n`;
    }

    contenido += '=====================================================\n';
    contenido += `  Generado el ${new Date().toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric' })}\n`;
    contenido += '=====================================================\n';

    const salida = path.join(__dirname, '../../../../usuarios_edusync.txt');
    fs.writeFileSync(salida, contenido, 'utf8');

    console.log(`✅ Archivo generado: usuarios_edusync.txt`);
    console.log(`📁 Ubicación: ${path.resolve(salida)}`);
    console.log(`\n🔑 Claves:`);
    console.log(`   Profesores : Profesor2024!`);
    console.log(`   Apoderados : ${claveApoderado}`);

  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

main();
