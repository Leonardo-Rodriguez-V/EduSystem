const db = require('../config/db');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `Eres AURA, la asistente de inteligencia artificial del sistema educativo EduSync de Chile.
Eres amable, precisa y hablas siempre en español formal.

## Tu propósito según el rol del usuario
- **Profesor**: Entregar información solo de sus propios alumnos (los de los cursos que imparte). Ayudar con ejercicios, planificaciones y materiales didácticos.
- **Director**: Visión global del colegio: todos los cursos, promedios generales, alertas de riesgo académico y de asistencia.
- **Apoderado**: Solo información de sus hijos asignados. No puede ver datos de otros alumnos.

## Sistema educativo chileno (MINEDUC)
- Escala de notas: 1.0 a 7.0. Nota mínima de aprobación: 4.0.
- Asistencia mínima requerida: 85%. Bajo ese umbral el alumno puede ser reprobado por inasistencia.
- Niveles: Educación Básica (1° a 8° básico), Educación Media (1° a 4° medio).
- El año escolar va de marzo a diciembre.
- Asignaturas básica: Lenguaje, Matemática, Ciencias Naturales, Historia, Inglés, Ed. Física, Artes, Tecnología, Orientación.
- Asignaturas media: Lengua y Literatura, Matemática, Biología, Física, Química, Historia, Inglés, Ed. Física, Filosofía (3°-4°), Artes.

## Generación de ejercicios
Genera el número exacto solicitado con enunciado claro, contextualizado en Chile, nivel adecuado al curso y respuesta correcta al final.

## Datos del colegio
Recibirás datos reales en sección [CONTEXTO_DB] al inicio de cada mensaje. Úsalos para responder con precisión. Cuando el usuario pida información que ya está en el contexto, usa esos datos directamente.

## Reglas de presentación de datos
- Si hay alumnos de múltiples cursos: agrúpalos por curso, ordena cursos alfabéticamente.
- Si hay alumnos de un solo curso: ordénalos alfabéticamente.
- Para "peores notas": ordena de menor a mayor promedio.
- Para "mejores notas": ordena de mayor a menor promedio.
- Para "riesgo por asistencia": muestra los que tienen menos del 85%, de menor a mayor porcentaje.
- Usa formato de lista clara con nombre, curso y dato relevante.

## Estilo
- Respuestas concisas pero completas. Usa listas. Nunca inventes datos.`;

// ─── Contexto base según rol (siempre se incluye) ──────────────────────────

async function contextProfesor(idProfesor) {
  const parts = [];

  // Cursos que imparte
  const { rows: cursos } = await db.query(`
    SELECT DISTINCT c.id, c.nombre AS curso
    FROM curso_asignatura_profesor cap
    JOIN cursos c ON c.id = cap.id_curso
    WHERE cap.id_profesor = $1
    ORDER BY c.nombre
  `, [idProfesor]);

  if (cursos.length === 0) return parts;
  parts.push({ tipo: 'mis_cursos', datos: cursos });

  const idCursos = cursos.map(c => c.id);

  // Promedio de notas de sus alumnos (todos, ordenados por curso y promedio)
  const { rows: notas } = await db.query(`
    SELECT a.nombre_completo, c.nombre AS curso,
      ROUND(AVG(n.calificacion), 1) AS promedio,
      COUNT(n.id) AS total_evaluaciones
    FROM alumnos a
    JOIN cursos c ON a.id_curso = c.id
    LEFT JOIN notas n ON n.id_alumno = a.id
    WHERE a.id_curso = ANY($1)
    GROUP BY a.id, a.nombre_completo, c.nombre
    ORDER BY c.nombre ASC, promedio ASC NULLS LAST
  `, [idCursos]);
  if (notas.length > 0) parts.push({ tipo: 'notas_mis_alumnos', datos: notas });

  // Asistencia de sus alumnos
  const { rows: asistencia } = await db.query(`
    SELECT a.nombre_completo, c.nombre AS curso,
      COUNT(asi.id) AS total_clases,
      SUM(CASE WHEN asi.estado = 'presente' THEN 1 ELSE 0 END) AS presentes,
      ROUND(100.0 * SUM(CASE WHEN asi.estado = 'presente' THEN 1 ELSE 0 END) / NULLIF(COUNT(asi.id), 0), 1) AS porcentaje_asistencia
    FROM alumnos a
    JOIN cursos c ON a.id_curso = c.id
    LEFT JOIN asistencia asi ON asi.id_alumno = a.id
    WHERE a.id_curso = ANY($1)
    GROUP BY a.id, a.nombre_completo, c.nombre
    ORDER BY c.nombre ASC, porcentaje_asistencia ASC NULLS LAST
  `, [idCursos]);
  if (asistencia.length > 0) parts.push({ tipo: 'asistencia_mis_alumnos', datos: asistencia });

  return parts;
}

async function contextDirector() {
  const parts = [];

  const { rows: resumen } = await db.query(`
    SELECT c.nombre AS curso,
      COUNT(DISTINCT a.id) AS total_alumnos,
      ROUND(AVG(n.calificacion), 2) AS promedio_notas,
      ROUND(AVG(CASE WHEN asi.estado = 'presente' THEN 100.0 ELSE 0 END), 1) AS promedio_asistencia,
      COUNT(DISTINCT CASE WHEN sub.prom < 4.0 THEN a.id END) AS alumnos_bajo_4,
      COUNT(DISTINCT CASE WHEN sub_asi.pct < 85 THEN a.id END) AS alumnos_riesgo_asistencia
    FROM cursos c
    LEFT JOIN alumnos a ON a.id_curso = c.id
    LEFT JOIN notas n ON n.id_alumno = a.id
    LEFT JOIN asistencia asi ON asi.id_alumno = a.id
    LEFT JOIN (
      SELECT id_alumno, AVG(calificacion) AS prom FROM notas GROUP BY id_alumno
    ) sub ON sub.id_alumno = a.id
    LEFT JOIN (
      SELECT id_alumno,
        ROUND(100.0 * SUM(CASE WHEN estado = 'presente' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) AS pct
      FROM asistencia GROUP BY id_alumno
    ) sub_asi ON sub_asi.id_alumno = a.id
    GROUP BY c.id, c.nombre
    ORDER BY c.nombre
  `);
  if (resumen.length > 0) parts.push({ tipo: 'resumen_global_por_curso', datos: resumen });

  const { rows: riesgo } = await db.query(`
    SELECT a.nombre_completo, c.nombre AS curso,
      ROUND(AVG(n.calificacion), 1) AS promedio
    FROM notas n
    JOIN alumnos a ON n.id_alumno = a.id
    JOIN cursos c ON a.id_curso = c.id
    GROUP BY a.id, a.nombre_completo, c.nombre
    HAVING ROUND(AVG(n.calificacion), 1) < 4.0
    ORDER BY promedio ASC LIMIT 20
  `);
  if (riesgo.length > 0) parts.push({ tipo: 'alumnos_riesgo_academico', datos: riesgo });

  const { rows: stats } = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM alumnos) AS total_alumnos,
      (SELECT COUNT(*) FROM usuarios WHERE rol = 'profesor') AS total_profesores,
      (SELECT COUNT(*) FROM usuarios WHERE rol = 'apoderado') AS total_apoderados,
      (SELECT COUNT(*) FROM cursos) AS total_cursos
  `);
  if (stats.length > 0) parts.push({ tipo: 'estadisticas_generales', datos: stats[0] });

  return parts;
}

async function contextApoderado(idApoderado) {
  const parts = [];

  const { rows: hijos } = await db.query(`
    SELECT a.id, a.nombre_completo, c.nombre AS curso,
      ROUND(AVG(n.calificacion), 1) AS promedio_general,
      ROUND(100.0 * SUM(CASE WHEN asi.estado = 'presente' THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT asi.id), 0), 1) AS asistencia
    FROM apoderado_alumno aa
    JOIN alumnos a ON a.id = aa.id_alumno
    JOIN cursos c ON a.id_curso = c.id
    LEFT JOIN notas n ON n.id_alumno = a.id
    LEFT JOIN asistencia asi ON asi.id_alumno = a.id
    WHERE aa.id_apoderado = $1
    GROUP BY a.id, a.nombre_completo, c.nombre
    ORDER BY a.nombre_completo
  `, [idApoderado]);

  if (hijos.length > 0) {
    parts.push({ tipo: 'mis_hijos', datos: hijos });

    // Notas detalladas por asignatura para cada hijo
    for (const hijo of hijos) {
      const { rows: detalleNotas } = await db.query(`
        SELECT asig.nombre AS asignatura,
          ROUND(AVG(n.calificacion), 1) AS promedio,
          MIN(n.calificacion) AS nota_minima,
          MAX(n.calificacion) AS nota_maxima,
          COUNT(*) AS evaluaciones
        FROM notas n
        JOIN asignaturas asig ON asig.id = n.id_asignatura
        WHERE n.id_alumno = $1
        GROUP BY asig.id, asig.nombre
        ORDER BY promedio ASC
      `, [hijo.id]);
      if (detalleNotas.length > 0) {
        parts.push({ tipo: `notas_por_asignatura_${hijo.nombre_completo}`, datos: detalleNotas });
      }
    }
  }

  return parts;
}

// ─── Constructor de contexto principal ─────────────────────────────────────

async function buildContext(usuario) {
  try {
    let parts = [];

    if (usuario.rol === 'profesor') {
      parts = await contextProfesor(usuario.id);
    } else if (usuario.rol === 'director') {
      parts = await contextDirector();
    } else if (usuario.rol === 'apoderado') {
      parts = await contextApoderado(usuario.id);
    }

    if (parts.length === 0) return '';
    return `[CONTEXTO_DB]\n${JSON.stringify(parts, null, 2)}\n[/CONTEXTO_DB]\n\n`;

  } catch (err) {
    console.error('[AURA] Error construyendo contexto BD:', err.message);
    return '';
  }
}

// ─── Handler principal ──────────────────────────────────────────────────────

exports.chat = async (req, res) => {
  const { mensaje, historial = [] } = req.body;
  const usuario = req.usuario;

  if (!mensaje?.trim()) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
  }

  try {
    // Siempre incluir contexto real de la BD según el rol
    const contexto = await buildContext(usuario);
    const mensajeConContexto = contexto
      ? `${contexto}El usuario es un ${usuario.rol} llamado ${usuario.nombre_completo}.\n\n${mensaje}`
      : mensaje;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historial.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
      { role: 'user', content: mensajeConContexto },
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: 1500,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[AURA] Groq error:', response.status, err);
      if (response.status === 401) {
        return res.status(500).json({ error: 'API key de Groq inválida. Verifica GROQ_API_KEY en el .env.' });
      }
      return res.status(500).json({ error: 'Error en el servicio de IA. Intenta nuevamente.' });
    }

    const data = await response.json();
    const respuesta = data.choices?.[0]?.message?.content || 'No pude procesar tu consulta.';
    res.json({ respuesta });

  } catch (err) {
    console.error('[AURA] Error:', err.message);
    res.status(500).json({ error: 'Error al contactar con AURA. Verifica tu conexión.' });
  }
};
