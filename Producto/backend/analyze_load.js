require('dotenv').config();
const pool = require('./src/config/db');

async function analyze() {
  const { rows: asigs } = await pool.query(`
    SELECT u.correo, c.nombre as curso, a.nombre as asignatura
    FROM curso_asignatura_profesor cap
    JOIN usuarios u ON cap.id_profesor = u.id
    JOIN cursos c ON cap.id_curso = c.id
    JOIN asignaturas a ON cap.id_asignatura = a.id
  `);

  const bolsas = {
    'Pre-Kínder (NT1)': { 'Lenguaje Verbal': 3, 'Pensamiento Matemático': 3, 'Corporalidad y Movimiento': 2, 'Exploración del Entorno Natural': 2, 'Identidad y Autonomía': 2, 'Lenguajes Artísticos': 1, 'Convivencia y Ciudadanía': 1, 'Comprensión del Entorno Sociocultural': 1 },
    'Kínder (NT2)': { 'Lenguaje Verbal': 3, 'Pensamiento Matemático': 3, 'Corporalidad y Movimiento': 2, 'Exploración del Entorno Natural': 2, 'Identidad y Autonomía': 2, 'Lenguajes Artísticos': 1, 'Convivencia y Ciudadanía': 1, 'Comprensión del Entorno Sociocultural': 1 },
    '1° Básico': { 'Lenguaje y Comunicación': 4, 'Matemática': 4, 'Ciencias Naturales': 2, 'Historia, Geografía y Ciencias Sociales': 2, 'Educación Física y Salud': 2, 'Artes Visuales': 1, 'Música': 1, 'Tecnología': 1, 'Religión': 1, 'Orientación': 1 },
    '2° Básico': { 'Lenguaje y Comunicación': 4, 'Matemática': 4, 'Ciencias Naturales': 2, 'Historia, Geografía y Ciencias Sociales': 2, 'Educación Física y Salud': 2, 'Artes Visuales': 1, 'Música': 1, 'Tecnología': 1, 'Religión': 1, 'Orientación': 1 },
    '3° Básico': { 'Lenguaje y Comunicación': 4, 'Matemática': 4, 'Ciencias Naturales': 2, 'Historia, Geografía y Ciencias Sociales': 2, 'Educación Física y Salud': 2, 'Artes Visuales': 1, 'Música': 1, 'Tecnología': 1, 'Religión': 1, 'Orientación': 1 },
    '4° Básico': { 'Lenguaje y Comunicación': 4, 'Matemática': 4, 'Ciencias Naturales': 2, 'Historia, Geografía y Ciencias Sociales': 2, 'Educación Física y Salud': 2, 'Artes Visuales': 1, 'Música': 1, 'Tecnología': 1, 'Religión': 1, 'Orientación': 1 },
    '5° Básico': { 'Lengua y Literatura': 3, 'Matemática': 3, 'Historia, Geografía y Ciencias Sociales': 2, 'Ciencias Naturales': 2, 'Inglés': 2, 'Educación Física y Salud': 2, 'Artes Visuales': 1, 'Música': 1, 'Tecnología': 1, 'Religión': 1, 'Orientación': 1 },
    '6° Básico': { 'Lengua y Literatura': 3, 'Matemática': 3, 'Historia, Geografía y Ciencias Sociales': 2, 'Ciencias Naturales': 2, 'Inglés': 2, 'Educación Física y Salud': 2, 'Artes Visuales': 1, 'Música': 1, 'Tecnología': 1, 'Religión': 1, 'Orientación': 1 },
    '7° Básico': { 'Lengua y Literatura': 3, 'Matemática': 3, 'Historia, Geografía y Ciencias Sociales': 2, 'Ciencias Naturales': 2, 'Inglés': 2, 'Educación Física y Salud': 2, 'Artes Visuales': 1, 'Música': 1, 'Tecnología': 1, 'Religión': 1, 'Orientación': 1 },
    '8° Básico': { 'Lengua y Literatura': 3, 'Matemática': 3, 'Historia, Geografía y Ciencias Sociales': 2, 'Ciencias Naturales': 2, 'Inglés': 2, 'Educación Física y Salud': 2, 'Artes Visuales': 1, 'Música': 1, 'Tecnología': 1, 'Religión': 1, 'Orientación': 1 },
    '1° Medio': { 'Lengua y Literatura': 3, 'Matemática': 3, 'Historia, Geografía y Ciencias Sociales': 2, 'Biología': 2, 'Química': 2, 'Física': 2, 'Inglés': 2, 'Educación Física y Salud': 2, 'Artes Visuales': 1, 'Filosofía': 1, 'Orientación': 1, 'Religión': 1, 'Consejo de Curso': 1 },
    '2° Medio': { 'Lengua y Literatura': 3, 'Matemática': 3, 'Historia, Geografía y Ciencias Sociales': 2, 'Biología': 2, 'Química': 2, 'Física': 2, 'Inglés': 2, 'Educación Física y Salud': 2, 'Artes Visuales': 1, 'Filosofía': 1, 'Orientación': 1, 'Religión': 1, 'Consejo de Curso': 1 },
    '3° Medio': { 'Lengua y Literatura': 3, 'Matemática': 3, 'Historia, Geografía y Ciencias Sociales': 2, 'Biología': 2, 'Química': 2, 'Física': 2, 'Inglés': 2, 'Educación Física y Salud': 1, 'Artes Visuales': 1, 'Filosofía': 1, 'Educación Ciudadana': 1, 'Orientación': 1, 'Electivo': 1, 'Consejo de Curso': 1 },
    '4° Medio': { 'Lengua y Literatura': 3, 'Matemática': 3, 'Historia, Geografía y Ciencias Sociales': 2, 'Biología': 2, 'Química': 2, 'Física': 2, 'Inglés': 2, 'Educación Física y Salud': 1, 'Artes Visuales': 1, 'Filosofía': 1, 'Educación Ciudadana': 1, 'Orientación': 1, 'Taller JEC': 1, 'Consejo de Curso': 1 },
  };

  const loadCalc = {};
  asigs.forEach(a => {
    const baseCurso = a.curso.replace(' A', '').replace(' B', '');
    const weight = bolsas[baseCurso]?.[a.asignatura] || 1;
    loadCalc[a.correo] = (loadCalc[a.correo] || 0) + weight;
  });

  const results = Object.entries(loadCalc).map(([correo, bloques]) => ({
    correo,
    bloques,
    estado: bloques > 23 ? '❌ EXCESO' : '✅ OK'
  })).sort((a, b) => b.bloques - a.bloques);

  console.log('--- CARGA DOCENTE COMPLETA ---');
  results.forEach(r => console.log(`${r.estado} ${r.correo}: ${r.bloques} bloques`));

  process.exit(0);
}

analyze();
