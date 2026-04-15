require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const bcrypt = require('bcryptjs');

// ===== POOLS DE NOMBRES =====
const NOMBRES_F = ['Valentina','Sofía','Camila','Catalina','Isidora','Antonia','Javiera','Fernanda','Constanza','Florencia','Macarena','Daniela','Paula','Francisca','Andrea','Carolina','Gabriela','Natalia','Martina','Nicole'];
const NOMBRES_M = ['Sebastián','Matías','Diego','Nicolás','Felipe','Tomás','Benjamín','Joaquín','Ignacio','Francisco','Carlos','Andrés','Pablo','Rodrigo','Cristóbal','Gabriel','Maximiliano','Vicente','Emilio','Alejandro'];
const APELLIDOS = ['González','Muñoz','Rojas','Díaz','Pérez','Soto','Contreras','Silva','Martínez','Sepúlveda','Morales','Torres','Flores','Miranda','Castillo','Fuentes','Fernández','López','Hernández','Ramírez','Vega','Castro','Vargas','Leiva','Espinoza','Naranjo','Garrido','Ortiz','Reyes','Riquelme'];

let rutSeq = 15000001;
function genRut() {
  const n = rutSeq++;
  const dv = (n % 9) + 1;
  const p1 = Math.floor(n / 1000000);
  const p2 = String(Math.floor((n % 1000000) / 1000)).padStart(3, '0');
  const p3 = String(n % 1000).padStart(3, '0');
  return `${p1}.${p2}.${p3}-${dv}`;
}

function genStudents(count, yearBorn, idCurso) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const isFemale = i % 2 === 0;
    const nombre = isFemale ? NOMBRES_F[i % NOMBRES_F.length] : NOMBRES_M[i % NOMBRES_M.length];
    const ap1 = APELLIDOS[i % APELLIDOS.length];
    const ap2 = APELLIDOS[(i + 11) % APELLIDOS.length];
    const month = String((i % 10) + 1).padStart(2, '0');
    const day   = String((i % 27) + 1).padStart(2, '0');
    list.push({
      nombre: `${nombre} ${ap1} ${ap2}`,
      rut:    genRut(),
      fecha:  `${yearBorn}-${month}-${day}`,
      idCurso
    });
  }
  return list;
}

async function seedEscuela() {
  const client = await pool.connect();
  let profesoresInsertados = 0;
  let cursosInsertados     = 0;
  let alumnosInsertados    = 0;

  try {
    await client.query('BEGIN');

    // ===== 1. CREAR TABLAS NUEVAS =====
    await client.query(`
      CREATE TABLE IF NOT EXISTS asignaturas (
        id              SERIAL PRIMARY KEY,
        nombre          VARCHAR(120) NOT NULL,
        horas_semanales INT DEFAULT 0,
        nivel           VARCHAR(50),
        creado_en       TIMESTAMP DEFAULT NOW()
      )
    `);
    // Asegurar que las columnas existen si la tabla ya existía
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asignaturas' AND column_name='nivel') THEN
          ALTER TABLE asignaturas ADD COLUMN nivel VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asignaturas' AND column_name='horas_semanales') THEN
          ALTER TABLE asignaturas ADD COLUMN horas_semanales INT DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asignaturas' AND column_name='creado_en') THEN
          ALTER TABLE asignaturas ADD COLUMN creado_en TIMESTAMP DEFAULT NOW();
        END IF;
      END $$;
    `);

    // Manejar restricciones únicas: eliminar la de 'nombre' solo y poner '(nombre, nivel)'
    await client.query(`
      DO $$
      BEGIN
        -- Intentar eliminar restricción de nombre si existe
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asignaturas_nombre_key') THEN
          ALTER TABLE asignaturas DROP CONSTRAINT asignaturas_nombre_key;
        END IF;
        -- Añadir restricción compuesta si no existe
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asignaturas_nombre_nivel_key') THEN
          ALTER TABLE asignaturas ADD CONSTRAINT asignaturas_nombre_nivel_key UNIQUE (nombre, nivel);
        END IF;
      END $$;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS horario (
        id             SERIAL PRIMARY KEY,
        id_curso       INT  REFERENCES cursos(id)      ON DELETE CASCADE,
        id_asignatura  INT  REFERENCES asignaturas(id) ON DELETE CASCADE,
        id_profesor    UUID REFERENCES usuarios(id)    ON DELETE SET NULL,
        dia_semana     VARCHAR(10) NOT NULL,
        hora_inicio    TIME NOT NULL,
        hora_fin       TIME NOT NULL
      )
    `);
    console.log('✅ Tablas asignaturas y horario creadas/verificadas');

    // ===== 2. INSERTAR PROFESORES =====
    const hash = await bcrypt.hash('Profesor123', 10);

    const docentes = [
      // Parvularia
      { nombre: 'Claudia Morales Soto',         correo: 'claudia.morales@edusync.cl' },
      { nombre: 'Patricia Vega Fuentes',         correo: 'patricia.vega@edusync.cl' },
      // 1°-4° Básico
      { nombre: 'María González Castro',         correo: 'maria.gonzalez@edusync.cl' },
      { nombre: 'Carmen López Silva',            correo: 'carmen.lopez@edusync.cl' },
      { nombre: 'Rosa Martínez Díaz',            correo: 'rosa.martinez@edusync.cl' },
      { nombre: 'Isabel Hernández Muñoz',        correo: 'isabel.hernandez@edusync.cl' },
      // 5°-8° Básico — Jefes
      { nombre: 'Carlos Pérez Torres',           correo: 'carlos.perez@edusync.cl' },
      { nombre: 'Jorge Ramírez Vargas',          correo: 'jorge.ramirez@edusync.cl' },
      { nombre: 'Luis Soto Castro',              correo: 'luis.soto@edusync.cl' },
      { nombre: 'Rodrigo Flores Leiva',          correo: 'rodrigo.flores@edusync.cl' },
      // 5°-8° Básico — Especialistas
      { nombre: 'Tomás Espinoza Reyes',          correo: 'tomas.espinoza@edusync.cl' },
      { nombre: 'Andrés Castillo Fuentes',       correo: 'andres.castillo@edusync.cl' },
      { nombre: 'Gabriela Naranjo Vega',         correo: 'gabriela.naranjo@edusync.cl' },
      { nombre: 'Natalia Contreras Rojas',       correo: 'natalia.contreras@edusync.cl' },
      { nombre: 'Felipe Miranda Sepúlveda',      correo: 'felipe.miranda@edusync.cl' },
      { nombre: 'Sandra Fernández Díaz',         correo: 'sandra.fernandez@edusync.cl' },
      // 1°-4° Medio — Jefes
      { nombre: 'Verónica Naranjo Riquelme',     correo: 'veronica.naranjo@edusync.cl' },
      { nombre: 'Pablo Silva Moreno',            correo: 'pablo.silva@edusync.cl' },
      { nombre: 'Diego Rojas Espinoza',          correo: 'diego.rojas@edusync.cl' },
      // 1°-4° Medio — Especialistas
      { nombre: 'Ricardo Muñoz Castillo',        correo: 'ricardo.munoz@edusync.cl' },
      { nombre: 'Alejandra Torres Garrido',      correo: 'alejandra.torres@edusync.cl' },
      { nombre: 'Roberto Vargas Leiva',          correo: 'roberto.vargas@edusync.cl' },
      { nombre: 'Daniela Castro Ortiz',          correo: 'daniela.castro@edusync.cl' },
      { nombre: 'Marcelo Reyes Espinoza',        correo: 'marcelo.reyes@edusync.cl' },
      { nombre: 'Francisca Sepúlveda Morales',   correo: 'francisca.sepulveda@edusync.cl' },
      { nombre: 'Ana Gómez',                     correo: 'ana@edusync.com' },
    ];

    const teacherIds = {};
    for (const d of docentes) {
      const r = await client.query(
        `INSERT INTO usuarios (nombre_completo, correo, rol, contraseña)
         VALUES ($1, $2, 'profesor', $3)
         ON CONFLICT (correo) DO UPDATE SET nombre_completo = EXCLUDED.nombre_completo
         RETURNING id, correo`,
        [d.nombre, d.correo, hash]
      );
      teacherIds[d.correo] = r.rows[0].id;
      profesoresInsertados++;
    }
    // Recuperar Ana Gomez (ya existe)
    // Recuperar Ana Gomez (ya gestionada arriba)

    console.log(`✅ ${profesoresInsertados} profesores procesados`);

    // ===== 3. INSERTAR CURSOS =====
    const cursosData = [
      { nombre: 'Pre-Kínder (NT1)', prof: 'claudia.morales@edusync.cl' },
      { nombre: 'Kínder (NT2)',     prof: 'patricia.vega@edusync.cl' },
      { nombre: '1° Básico',        prof: 'maria.gonzalez@edusync.cl' },
      { nombre: '2° Básico',        prof: 'carmen.lopez@edusync.cl' },
      { nombre: '3° Básico',        prof: 'rosa.martinez@edusync.cl' },
      { nombre: '4° Básico',        prof: 'isabel.hernandez@edusync.cl' },
      { nombre: '5° Básico',        prof: 'carlos.perez@edusync.cl' },
      { nombre: '6° Básico',        prof: 'jorge.ramirez@edusync.cl' },
      { nombre: '7° Básico',        prof: 'luis.soto@edusync.cl' },
      { nombre: '8° Básico',        prof: 'rodrigo.flores@edusync.cl' },
      { nombre: '2° Medio',         prof: 'veronica.naranjo@edusync.cl' },
      { nombre: '3° Medio',         prof: 'pablo.silva@edusync.cl' },
      { nombre: '4° Medio',         prof: 'diego.rojas@edusync.cl' },
      { nombre: '1° Medio',         prof: 'ana@edusync.com' },
    ];

    const courseIds = {};
    // Recuperar cursos existentes

    for (const c of cursosData) {
      const existing = await client.query(`SELECT id FROM cursos WHERE nombre = $1`, [c.nombre]);
      if (existing.rows[0]) {
        courseIds[c.nombre] = existing.rows[0].id;
        continue;
      }
      const r = await client.query(
        `INSERT INTO cursos (nombre, anio, id_profesor_jefe) VALUES ($1, 2026, $2) RETURNING id`,
        [c.nombre, teacherIds[c.prof]]
      );
      courseIds[c.nombre] = r.rows[0].id;
      cursosInsertados++;
    }
    console.log(`✅ ${cursosInsertados} cursos nuevos insertados`);

    // ===== 4. INSERTAR ALUMNOS =====
    const cursosConAlumnos = [
      { key: 'Pre-Kínder (NT1)', year: 2021, count: 20 },
      { key: 'Kínder (NT2)',     year: 2020, count: 20 },
      { key: '1° Básico',        year: 2019, count: 20 },
      { key: '2° Básico',        year: 2018, count: 20 },
      { key: '3° Básico',        year: 2017, count: 20 },
      { key: '4° Básico',        year: 2016, count: 20 },
      { key: '5° Básico',        year: 2015, count: 20 },
      { key: '6° Básico',        year: 2014, count: 20 },
      { key: '7° Básico',        year: 2013, count: 20 },
      { key: '8° Básico',        year: 2012, count: 20 },
      { key: '1° Medio',         year: 2011, count: 20 },
      { key: '2° Medio',         year: 2010, count: 20 },
      { key: '3° Medio',         year: 2009, count: 20 },
      { key: '4° Medio',         year: 2008, count: 20 },
    ];

    for (const c of cursosConAlumnos) {
      const idCurso = courseIds[c.key];
      if (!idCurso) { console.warn(`⚠️  Curso no encontrado: ${c.key}`); continue; }
      const students = genStudents(c.count, c.year, idCurso);
      for (const s of students) {
        const exists = await client.query(`SELECT id FROM alumnos WHERE rut = $1`, [s.rut]);
        if (exists.rows[0]) continue;
        await client.query(
          `INSERT INTO alumnos (nombre_completo, rut, fecha_nacimiento, id_curso) VALUES ($1,$2,$3,$4)`,
          [s.nombre, s.rut, s.fecha, s.idCurso]
        );
        alumnosInsertados++;
      }
    }
    console.log(`✅ ${alumnosInsertados} alumnos insertados`);

    // ===== 5. INSERTAR ASIGNATURAS POR NIVEL =====
    const asignaturasData = [
      // Parvularia
      { nombre: 'Identidad y Autonomía',                    horas: 0, nivel: 'parvularia' },
      { nombre: 'Convivencia y Ciudadanía',                 horas: 0, nivel: 'parvularia' },
      { nombre: 'Corporalidad y Movimiento',                horas: 0, nivel: 'parvularia' },
      { nombre: 'Lenguaje Verbal',                          horas: 0, nivel: 'parvularia' },
      { nombre: 'Lenguajes Artísticos',                     horas: 0, nivel: 'parvularia' },
      { nombre: 'Exploración del Entorno Natural',          horas: 0, nivel: 'parvularia' },
      { nombre: 'Comprensión del Entorno Sociocultural',    horas: 0, nivel: 'parvularia' },
      { nombre: 'Pensamiento Matemático',                   horas: 0, nivel: 'parvularia' },
      // 1°-4° Básico
      { nombre: 'Lenguaje y Comunicación',                  horas: 8, nivel: 'basica_menor' },
      { nombre: 'Matemática',                               horas: 6, nivel: 'basica_menor' },
      { nombre: 'Ciencias Naturales',                       horas: 3, nivel: 'basica_menor' },
      { nombre: 'Historia, Geografía y Ciencias Sociales',  horas: 3, nivel: 'basica_menor' },
      { nombre: 'Educación Física y Salud',                 horas: 4, nivel: 'basica_menor' },
      { nombre: 'Artes Visuales',                           horas: 2, nivel: 'basica_menor' },
      { nombre: 'Música',                                   horas: 2, nivel: 'basica_menor' },
      { nombre: 'Tecnología',                               horas: 1, nivel: 'basica_menor' },
      { nombre: 'Orientación',                              horas: 1, nivel: 'basica_menor' },
      { nombre: 'Religión',                                 horas: 2, nivel: 'basica_menor' },
      { nombre: 'Taller HLD',                               horas: 2, nivel: 'basica_menor' },
      // 5°-8° Básico
      { nombre: 'Lengua y Literatura',                      horas: 6, nivel: 'basica_mayor' },
      { nombre: 'Matemática',                               horas: 6, nivel: 'basica_mayor' },
      { nombre: 'Ciencias Naturales',                       horas: 4, nivel: 'basica_mayor' },
      { nombre: 'Historia, Geografía y Ciencias Sociales',  horas: 4, nivel: 'basica_mayor' },
      { nombre: 'Inglés',                                   horas: 3, nivel: 'basica_mayor' },
      { nombre: 'Educación Física y Salud',                 horas: 3, nivel: 'basica_mayor' },
      { nombre: 'Artes Visuales',                           horas: 2, nivel: 'basica_mayor' },
      { nombre: 'Música',                                   horas: 2, nivel: 'basica_mayor' },
      { nombre: 'Tecnología',                               horas: 2, nivel: 'basica_mayor' },
      { nombre: 'Orientación',                              horas: 1, nivel: 'basica_mayor' },
      { nombre: 'Religión',                                 horas: 2, nivel: 'basica_mayor' },
      { nombre: 'Taller HLD',                               horas: 2, nivel: 'basica_mayor' },
      // 1°-2° Medio
      { nombre: 'Lengua y Literatura',                      horas: 6, nivel: 'media_inicial' },
      { nombre: 'Matemática',                               horas: 7, nivel: 'media_inicial' },
      { nombre: 'Biología',                                 horas: 2, nivel: 'media_inicial' },
      { nombre: 'Física',                                   horas: 2, nivel: 'media_inicial' },
      { nombre: 'Química',                                  horas: 2, nivel: 'media_inicial' },
      { nombre: 'Historia, Geografía y Ciencias Sociales',  horas: 4, nivel: 'media_inicial' },
      { nombre: 'Inglés',                                   horas: 4, nivel: 'media_inicial' },
      { nombre: 'Educación Física y Salud',                 horas: 2, nivel: 'media_inicial' },
      { nombre: 'Artes Visuales o Música',                  horas: 2, nivel: 'media_inicial' },
      { nombre: 'Tecnología',                               horas: 2, nivel: 'media_inicial' },
      { nombre: 'Orientación',                              horas: 1, nivel: 'media_inicial' },
      { nombre: 'Religión',                                 horas: 2, nivel: 'media_inicial' },
      { nombre: 'Taller HLD',                               horas: 4, nivel: 'media_inicial' },
      // 3°-4° Medio
      { nombre: 'Lengua y Literatura',                      horas: 4, nivel: 'media_final' },
      { nombre: 'Matemática',                               horas: 4, nivel: 'media_final' },
      { nombre: 'Inglés',                                   horas: 3, nivel: 'media_final' },
      { nombre: 'Biología',                                 horas: 2, nivel: 'media_final' },
      { nombre: 'Física',                                   horas: 2, nivel: 'media_final' },
      { nombre: 'Química',                                  horas: 2, nivel: 'media_final' },
      { nombre: 'Filosofía',                                horas: 3, nivel: 'media_final' },
      { nombre: 'Educación Ciudadana',                      horas: 2, nivel: 'media_final' },
      { nombre: 'Orientación',                              horas: 1, nivel: 'media_final' },
      { nombre: 'Religión',                                 horas: 2, nivel: 'media_final' },
      { nombre: 'Taller HLD',                               horas: 4, nivel: 'media_final' },
      { nombre: 'Asignaturas Electivas',                    horas: 7, nivel: 'media_final' },
    ];

    for (const a of asignaturasData) {
      await client.query(
        `INSERT INTO asignaturas (nombre, horas_semanales, nivel) 
         VALUES ($1, $2, $3)
         ON CONFLICT (nombre, nivel) DO UPDATE SET horas_semanales = EXCLUDED.horas_semanales`,
        [a.nombre, a.horas, a.nivel]
      );
    }
    console.log(`✅ Asignaturas por nivel insertadas`);

    await client.query('COMMIT');

    console.log(`\n🎉 SEED COMPLETADO EXITOSAMENTE:`);
    console.log(`   👨‍🏫 ${profesoresInsertados} profesores creados`);
    console.log(`   📚 ${cursosInsertados} cursos nuevos creados (+ 1ro Medio A existente)`);
    console.log(`   👦 ${alumnosInsertados} alumnos insertados`);
    console.log(`   📖 Asignaturas MINEDUC cargadas por nivel`);
    console.log(`\n   🔑 Contraseña para todos los profesores: Profesor123`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seed, rollback ejecutado:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedEscuela().catch(console.error);
