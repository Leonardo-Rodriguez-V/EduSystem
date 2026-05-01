require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const bcrypt = require('bcryptjs');

// ===== POOLS DE NOMBRES AMPLIADOS =====
const NOMBRES_F = ['Valentina','Sofía','Camila','Catalina','Isidora','Antonia','Javiera','Fernanda','Constanza','Florencia','Macarena','Daniela','Paula','Francisca','Andrea','Carolina','Gabriela','Natalia','Martina','Nicole','Elena','Isabel','Beatriz','Mónica','Gloria','Sandra','Verónica','Claudia','Lorena','Alejandra'];
const NOMBRES_M = ['Sebastián','Matías','Diego','Nicolás','Felipe','Tomás','Benjamín','Joaquín','Ignacio','Francisco','Carlos','Andrés','Pablo','Rodrigo','Cristóbal','Gabriel','Maximiliano','Vicente','Emilio','Alejandro','Héctor','Eduardo','Fernando','Gonzalo','Alberto','Sergio','Mario','René','Patricio','Víctor'];
const APELLIDOS = ['González','Muñoz','Rojas','Díaz','Pérez','Soto','Contreras','Silva','Martínez','Sepúlveda','Morales','Torres','Flores','Miranda','Castillo','Fuentes','Fernández','López','Hernández','Ramírez','Vega','Castro','Vargas','Leiva','Espinoza','Naranjo','Garrido','Ortiz','Reyes','Riquelme','Aravena','Bravo','Pizarro','Vera','Medina','Navarrete','Aguilera','Baeza','Contreras','Herrera'];

const RELACIONES = ['Madre', 'Padre', 'Abuelo/a', 'Tío/a', 'Tutor Legal'];

let rutSeq = 20000001; // Empezamos desde un rango distinto para evitar colisiones
function genRut() {
  const n = rutSeq++;
  const dv = (n % 9) + 1;
  const p1 = Math.floor(n / 1000000);
  const p2 = String(Math.floor((n % 1000000) / 1000)).padStart(3, '0');
  const p3 = String(n % 1000).padStart(3, '0');
  return `${p1}.${p2}.${p3}-${dv}`;
}

const norm = s => s.toLowerCase().trim()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, '.');

async function seedMultiTrack() {
  const client = await pool.connect();
  try {
    console.log('🚀 Iniciando expansión a Multi-Track (A y B)...');

    // 1. Renombrar cursos actuales a "Track A"
    await client.query('BEGIN');
    const { rows: cursosActuales } = await client.query('SELECT id, nombre FROM cursos');
    for (const curso of cursosActuales) {
      if (!curso.nombre.includes(' A') && !curso.nombre.includes(' B')) {
        const nuevoNombre = `${curso.nombre} A`;
        await client.query('UPDATE cursos SET nombre = $1 WHERE id = $2', [nuevoNombre, curso.id]);
        console.log(`✅ Renombrado: ${curso.nombre} -> ${nuevoNombre}`);
      }
    }
    await client.query('COMMIT');

    // 2. Preparar datos
    const hashProfesor = await bcrypt.hash('Profesor123', 10);
    const hashApoderado = await bcrypt.hash('Apoderado123', 10);

    const niveles = [
      { base: 'Pre-Kínder (NT1)', year: 2021 },
      { base: 'Kínder (NT2)',     year: 2020 },
      { base: '1° Básico',        year: 2019 },
      { base: '2° Básico',        year: 2018 },
      { base: '3° Básico',        year: 2017 },
      { base: '4° Básico',        year: 2016 },
      { base: '5° Básico',        year: 2015 },
      { base: '6° Básico',        year: 2014 },
      { base: '7° Básico',        year: 2013 },
      { base: '8° Básico',        year: 2012 },
      { base: '1° Medio',         year: 2011 },
      { base: '2° Medio',         year: 2010 },
      { base: '3° Medio',         year: 2009 },
      { base: '4° Medio',         year: 2008 }
    ];

    // Procesar CADA nivel en su propia transacción para evitar timeouts
    for (let i = 0; i < niveles.length; i++) {
        await client.query('BEGIN');
        const nivel = niveles[i];
        const nombreB = `${nivel.base} B`;
        
        try {
            // Verificar si ya existe
            const { rows: exists } = await client.query('SELECT id FROM cursos WHERE nombre = $1', [nombreB]);
            if (exists.length > 0) {
                console.log(`⚠️ Curso ${nombreB} ya existe, saltando inserción.`);
                await client.query('ROLLBACK');
                continue;
            }

            // Crear Profesor Jefe para el curso B
            const nameProf = `${NOMBRES_M[(i + 15) % NOMBRES_M.length]} ${APELLIDOS[(i + 20) % APELLIDOS.length]} ${APELLIDOS[(i + 5) % APELLIDOS.length]}`;
            const emailProf = `${norm(nameProf)}@edusync.cl`;
            const resProf = await client.query(
                `INSERT INTO usuarios (nombre_completo, correo, rol, contraseña) 
                VALUES ($1, $2, 'profesor', $3) 
                ON CONFLICT (correo) DO UPDATE SET nombre_completo = EXCLUDED.nombre_completo
                RETURNING id`,
                [nameProf, emailProf, hashProfesor]
            );
            const idProf = resProf.rows[0].id;

            // Crear Curso B
            const resCurso = await client.query(
                `INSERT INTO cursos (nombre, anio, id_profesor_jefe) VALUES ($1, 2026, $2) RETURNING id`,
                [nombreB, idProf]
            );
            const idCurso = resCurso.rows[0].id;
            console.log(`✅ Creado: ${nombreB} con Prof. Jefe ${nameProf}`);

            // 3. Generar Alumnos para el curso B
            for (let j = 0; j < 20; j++) {
                const isFemale = j % 2 === 0;
                const nm = isFemale ? NOMBRES_F[(j + i) % NOMBRES_F.length] : NOMBRES_M[(j + i) % NOMBRES_M.length];
                const ap1 = APELLIDOS[(j + i*2) % APELLIDOS.length];
                const ap2 = APELLIDOS[(j + i*3 + 7) % APELLIDOS.length];
                const nombreAlumno = `${nm} ${ap1} ${ap2}`;
                const rut = genRut();
                const month = String((j % 12) + 1).padStart(2, '0');
                const day = String((j % 28) + 1).padStart(2, '0');
                const fechaNac = `${nivel.year}-${month}-${day}`;

                // Crear Apoderado para el alumno
                const relIdx = j % RELACIONES.length;
                const rel = RELACIONES[relIdx];
                const isMom = rel === 'Madre';
                const nameApo = `${isMom ? NOMBRES_F[(j + i + 10) % NOMBRES_F.length] : NOMBRES_M[(j + i + 10) % NOMBRES_M.length]} ${ap1} ${APELLIDOS[(j + 25) % APELLIDOS.length]}`;
                const emailApo = `${norm(nameApo)}@edusync.cl`;
                
                const resApo = await client.query(
                    `INSERT INTO usuarios (nombre_completo, correo, rol, contraseña) 
                    VALUES ($1, $2, 'apoderado', $3) 
                    ON CONFLICT (correo) DO UPDATE SET nombre_completo = EXCLUDED.nombre_completo
                    RETURNING id`,
                    [nameApo, emailApo, hashApoderado]
                );
                const idApo = resApo.rows[0].id;

                // Crear Alumno
                const resAlumno = await client.query(
                    `INSERT INTO alumnos (nombre_completo, rut, fecha_nacimiento, id_curso, id_apoderado) 
                    VALUES ($1, $2, $3, $4, $5) 
                    RETURNING id`,
                    [nombreAlumno, rut, fechaNac, idCurso, idApo]
                );
                const idAlumno = resAlumno.rows[0].id;

                // Vincular en apoderado_alumno con parentesco
                await client.query(
                    `INSERT INTO apoderado_alumno (id_apoderado, id_alumno, parentesco) VALUES ($1, $2, $3)`,
                    [idApo, idAlumno, rel]
                );
            }
            await client.query('COMMIT');
            console.log(`   👦 20 alumnos y apoderados creados para ${nombreB}`);
        } catch (levelErr) {
            await client.query('ROLLBACK');
            console.error(`❌ Error en nivel ${nombreB}:`, levelErr.message);
        }
    }

    console.log('\n🎉 EXPANSIÓN MULTI-TRACK COMPLETADA EXITOSAMENTE');

  } catch (err) {
    console.error('❌ Error general durante la expansión:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedMultiTrack();
