require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const bcrypt = require('bcryptjs');

// ─── NOMBRES CHILENOS ─────────────────────────────────────────────────────────
const NOMBRES_M = ['Carlos','Jorge','Luis','Ricardo','Roberto','Marcelo','Andrés','Pablo','Felipe','Rodrigo','Diego','Héctor','Eduardo','Fernando','Gonzalo','Alberto','Sergio','Mario','René','Patricio','Víctor','Manuel','Enrique','Oscar','Raúl'];
const NOMBRES_F = ['Carmen','Patricia','María','Gloria','Sandra','Verónica','Claudia','Mónica','Lorena','Alejandra','Cecilia','Beatriz','Marcela','Ximena','Daniela','Francisca','Catalina','Pilar','Soledad','Angélica','Isabel','Rosa','Ana','Elena','Sofía'];
const APELLIDOS = ['González','Muñoz','Rojas','Díaz','Pérez','Soto','Contreras','Silva','Martínez','Sepúlveda','Morales','Rodríguez','López','Fuentes','Hernández','Torres','Araya','Flores','Espinoza','Valenzuela','Castillo','Reyes','Gutiérrez','Castro','Vargas','Álvarez','Vásquez','Fernández','Leiva','Navarro','Jara','Garrido','Tapia','Riquelme','Aravena','Bravo','Pizarro','Vera','Medina','Navarrete'];

const norm = s => s.toLowerCase().trim()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, '.');

let nomIdx = 0;
const correosUsados = new Set();

function getNombreApoderado(idx) {
  if (idx % 2 === 0) {
    const n = NOMBRES_M[nomIdx % NOMBRES_M.length];
    const a1 = APELLIDOS[nomIdx % APELLIDOS.length];
    const a2 = APELLIDOS[(nomIdx + 7) % APELLIDOS.length];
    nomIdx++;
    return `${n} ${a1} ${a2}`;
  } else {
    const n = NOMBRES_F[nomIdx % NOMBRES_F.length];
    const a1 = APELLIDOS[(nomIdx + 3) % APELLIDOS.length];
    const a2 = APELLIDOS[(nomIdx + 11) % APELLIDOS.length];
    nomIdx++;
    return `${n} ${a1} ${a2}`;
  }
}

function getCorreo(nombre) {
  const partes = nombre.split(' ');
  // Usar nombre + ambos apellidos → carlos.gonzalez.munoz@edusync.cl
  let base = `${norm(partes[0])}.${norm(partes[1])}.${norm(partes[2])}@edusync.cl`;
  if (!correosUsados.has(base)) { correosUsados.add(base); return base; }
  // Si aún hay duplicado, agregar número
  let i = 2;
  let alt = `${norm(partes[0])}.${norm(partes[1])}.${norm(partes[2])}${i}@edusync.cl`;
  while (correosUsados.has(alt)) { i++; alt = `${norm(partes[0])}.${norm(partes[1])}.${norm(partes[2])}${i}@edusync.cl`; }
  correosUsados.add(alt);
  return alt;
}

// ─── SHUFFLE ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Limpiar apoderados anteriores
    console.log('🗑️  Limpiando apoderados anteriores...');
    await client.query("DELETE FROM apoderado_alumno");
    await client.query("DELETE FROM usuarios WHERE rol = 'apoderado'");

    // 2. Obtener todos los alumnos
    const { rows: alumnos } = await client.query('SELECT id FROM alumnos ORDER BY id');
    const ids = shuffle(alumnos.map(a => a.id));
    console.log(`👨‍👩‍👧‍👦 Total alumnos: ${ids.length}`);

    // 3. Definir grupos (distribución especial)
    // 2 apoderados → 5 hijos c/u    = 10 alumnos
    // 3 apoderados → 4 hijos c/u    = 12 alumnos
    // 10 apoderados → 3 hijos c/u   = 30 alumnos
    // 8 apoderados → 2 hijos c/u    = 16 alumnos
    // resto → 1 apoderado por alumno
    const grupos = [
      ...Array(2).fill(5),
      ...Array(3).fill(4),
      ...Array(10).fill(3),
      ...Array(8).fill(2),
    ];

    const grupos_alumnos = [];
    let cursor = 0;
    for (const cant of grupos) {
      grupos_alumnos.push(ids.slice(cursor, cursor + cant));
      cursor += cant;
    }
    // El resto: 1 apoderado por alumno
    while (cursor < ids.length) {
      grupos_alumnos.push([ids[cursor]]);
      cursor++;
    }

    console.log(`👤 Total apoderados a crear: ${grupos_alumnos.length}`);

    // 4. Hash de contraseña
    const hash = await bcrypt.hash('Apoderado123', 10);

    // 5. Insertar apoderados y sus vínculos
    let creados = 0;
    for (let i = 0; i < grupos_alumnos.length; i++) {
      const grupo = grupos_alumnos[i];
      const nombre = getNombreApoderado(i);
      const correo = getCorreo(nombre);

      // Insertar usuario apoderado
      const { rows: [user] } = await client.query(
        `INSERT INTO usuarios (nombre_completo, correo, rol, contraseña)
         VALUES ($1, $2, 'apoderado', $3)
         RETURNING id`,
        [nombre, correo, hash]
      );

      // Vincular con sus hijos
      for (const id_alumno of grupo) {
        await client.query(
          `INSERT INTO apoderado_alumno (id_apoderado, id_alumno) VALUES ($1, $2)`,
          [user.id, id_alumno]
        );
      }

      creados++;
      if (creados % 50 === 0) console.log(`   ... ${creados}/${grupos_alumnos.length} apoderados creados`);
    }

    await client.query('COMMIT');

    console.log(`\n✅ RESUMEN:`);
    console.log(`   Apoderados creados : ${creados}`);
    console.log(`   Alumnos vinculados : ${ids.length}`);
    console.log(`\n   Distribución:`);
    console.log(`   - 2 apoderados con 5 hijos`);
    console.log(`   - 3 apoderados con 4 hijos`);
    console.log(`   - 10 apoderados con 3 hijos`);
    console.log(`   - 8 apoderados con 2 hijos`);
    console.log(`   - ${creados - 23} apoderados con 1 hijo`);
    console.log(`\n🔑 Contraseña para todos: Apoderado123`);
    console.log(`📧 Formato correos: nombre.apellido@edusync.cl`);

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

main();
