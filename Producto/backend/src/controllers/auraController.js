const db = require('../config/db');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `Eres AURA, la asistente de inteligencia artificial del sistema educativo EduSync de Chile.
Eres amable, precisa y hablas siempre en español formal.

## Tu propósito según el rol del usuario
- **Profesor**: Entregar información solo de sus propios alumnos (los de los cursos que imparte). Ayudar con ejercicios, planificaciones y materiales didácticos.
- **Director**: Visión global del colegio: todos los cursos, promedios generales, alertas de riesgo académico y de asistencia.
- **Apoderado**: Solo información de sus hijos asignados. No puede ver datos de otros alumnos.
- **Alumno**: Solo información de su propio desempeño académico y asistencia.

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
- Respuestas concisas pero completas. Usa listas y markdown (**, -, ##). Nunca inventes datos.`;

// ─── Auto-crear tabla aura_historial si no existe ───────────────────────────

async function ensureHistorialTable() {
  try {
    // Si existe con id_usuario INTEGER (tipo incorrecto), la elimina para recrear con UUID
    await db.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'aura_historial'
            AND column_name = 'id_usuario'
            AND data_type = 'integer'
        ) THEN
          DROP TABLE aura_historial;
        END IF;
      END $$;
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS aura_historial (
        id         SERIAL PRIMARY KEY,
        id_usuario UUID NOT NULL,
        colegio_id INTEGER,
        role       VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
        content    TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_aura_hist_usuario
      ON aura_historial (id_usuario, created_at DESC)
    `);
  } catch (err) {
    console.error('[AURA] Error creando tabla historial:', err.message);
  }
}
ensureHistorialTable();

// ─── Contexto base según rol ─────────────────────────────────────────────────

async function contextProfesor(idProfesor) {
  const parts = [];

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

async function contextDirector(colegioId) {
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
    WHERE c.colegio_id = $1
    GROUP BY c.id, c.nombre
    ORDER BY c.nombre
  `, [colegioId]);
  if (resumen.length > 0) parts.push({ tipo: 'resumen_global_por_curso', datos: resumen });

  const { rows: riesgo } = await db.query(`
    SELECT a.nombre_completo, c.nombre AS curso,
      ROUND(AVG(n.calificacion), 1) AS promedio
    FROM notas n
    JOIN alumnos a ON n.id_alumno = a.id
    JOIN cursos c ON a.id_curso = c.id
    WHERE a.colegio_id = $1
    GROUP BY a.id, a.nombre_completo, c.nombre
    HAVING ROUND(AVG(n.calificacion), 1) < 4.0
    ORDER BY promedio ASC LIMIT 20
  `, [colegioId]);
  if (riesgo.length > 0) parts.push({ tipo: 'alumnos_riesgo_academico', datos: riesgo });

  const { rows: stats } = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM alumnos WHERE colegio_id = $1) AS total_alumnos,
      (SELECT COUNT(*) FROM usuarios WHERE rol = 'profesor' AND colegio_id = $1) AS total_profesores,
      (SELECT COUNT(*) FROM usuarios WHERE rol = 'apoderado' AND colegio_id = $1) AS total_apoderados,
      (SELECT COUNT(*) FROM cursos WHERE colegio_id = $1) AS total_cursos
  `, [colegioId]);
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

async function contextAlumno(usuario) {
  const parts = [];

  // Busca el registro de alumno por nombre + colegio (misma lógica que obtenerAlumnoPorUsuario)
  const { rows: alumnos } = await db.query(`
    SELECT a.id, a.nombre_completo, c.nombre AS curso
    FROM alumnos a
    JOIN cursos c ON a.id_curso = c.id
    WHERE LOWER(a.nombre_completo) = LOWER($1)
      AND a.colegio_id = $2
    LIMIT 1
  `, [usuario.nombre_completo, usuario.colegio_id]);

  if (alumnos.length === 0) return parts;
  const alumno = alumnos[0];

  parts.push({ tipo: 'mi_perfil', datos: { nombre: alumno.nombre_completo, curso: alumno.curso } });

  const { rows: notas } = await db.query(`
    SELECT asig.nombre AS asignatura,
      ROUND(AVG(n.calificacion), 1) AS promedio,
      MIN(n.calificacion) AS nota_minima,
      MAX(n.calificacion) AS nota_maxima,
      COUNT(*) AS evaluaciones
    FROM notas n
    JOIN asignaturas asig ON asig.id = n.id_asignatura
    WHERE n.id_alumno = $1
    GROUP BY asig.id, asig.nombre
    ORDER BY promedio DESC
  `, [alumno.id]);
  if (notas.length > 0) parts.push({ tipo: 'mis_notas_por_asignatura', datos: notas });

  const { rows: asistencia } = await db.query(`
    SELECT
      COUNT(*) AS total_clases,
      SUM(CASE WHEN estado = 'presente' THEN 1 ELSE 0 END) AS presentes,
      SUM(CASE WHEN estado = 'ausente' THEN 1 ELSE 0 END) AS ausentes,
      SUM(CASE WHEN estado = 'justificado' THEN 1 ELSE 0 END) AS justificados,
      ROUND(100.0 * SUM(CASE WHEN estado = 'presente' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) AS porcentaje_asistencia
    FROM asistencia
    WHERE id_alumno = $1
  `, [alumno.id]);
  if (asistencia.length > 0) parts.push({ tipo: 'mi_asistencia', datos: asistencia[0] });

  return parts;
}

// ─── Constructor de contexto principal ──────────────────────────────────────

async function buildContext(usuario) {
  try {
    let parts = [];

    if (usuario.rol === 'profesor') {
      parts = await contextProfesor(usuario.id);
    } else if (usuario.rol === 'director') {
      parts = await contextDirector(usuario.colegio_id);
    } else if (usuario.rol === 'apoderado') {
      parts = await contextApoderado(usuario.id);
    } else if (usuario.rol === 'alumno') {
      parts = await contextAlumno(usuario);
    }

    if (parts.length === 0) return '';
    return `[CONTEXTO_DB]\n${JSON.stringify(parts, null, 2)}\n[/CONTEXTO_DB]\n\n`;

  } catch (err) {
    console.error('[AURA] Error construyendo contexto BD:', err.message);
    return '';
  }
}

// ─── GET /api/aura/historial ─────────────────────────────────────────────────

exports.getHistorial = async (req, res) => {
  const { id } = req.usuario;
  try {
    const { rows } = await db.query(
      `SELECT role, content, created_at
       FROM aura_historial
       WHERE id_usuario = $1
       ORDER BY created_at ASC
       LIMIT 60`,
      [id]
    );
    res.json({ historial: rows });
  } catch (err) {
    console.error('[AURA] Error obteniendo historial:', err.message);
    res.status(500).json({ error: 'Error al cargar historial.' });
  }
};

// ─── DELETE /api/aura/historial ──────────────────────────────────────────────

exports.clearHistorial = async (req, res) => {
  const { id } = req.usuario;
  try {
    await db.query('DELETE FROM aura_historial WHERE id_usuario = $1', [id]);
    res.json({ mensaje: 'Historial limpiado.' });
  } catch (err) {
    console.error('[AURA] Error limpiando historial:', err.message);
    res.status(500).json({ error: 'Error al limpiar historial.' });
  }
};

// ─── POST /api/aura/stream (SSE streaming) ───────────────────────────────────

exports.streamChat = async (req, res) => {
  const { mensaje } = req.body;
  const usuario = req.usuario;

  if (!mensaje?.trim()) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // evita buffering en nginx/Railway
  res.flushHeaders();

  let aborted = false;
  req.on('close', () => { aborted = true; });

  try {
    const { rows: historialBD } = await db.query(
      `SELECT role, content FROM aura_historial
       WHERE id_usuario = $1 ORDER BY created_at ASC LIMIT 20`,
      [usuario.id]
    );

    const contexto = await buildContext(usuario);
    const mensajeConContexto = contexto
      ? `${contexto}El usuario es un ${usuario.rol} llamado ${usuario.nombre_completo}.\n\n${mensaje}`
      : mensaje;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historialBD.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: mensajeConContexto },
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: 1500, temperature: 0.5, stream: true }),
    });

    if (!response.ok) {
      res.write(`data: ${JSON.stringify({ error: 'Error en el servicio de IA.' })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (!aborted) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const token = JSON.parse(data).choices?.[0]?.delta?.content || '';
          if (token) {
            fullText += token;
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          }
        } catch {}
      }
    }

    if (!aborted && fullText) {
      await db.query(
        `INSERT INTO aura_historial (id_usuario, colegio_id, role, content)
         VALUES ($1, $2, 'user', $3), ($1, $2, 'assistant', $4)`,
        [usuario.id, usuario.colegio_id || null, mensaje, fullText]
      );
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('[AURA] Stream error:', err.message);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'Error al contactar con AURA.' })}\n\n`);
      res.end();
    }
  }
};

// ─── GET /api/aura/resumen-diario ────────────────────────────────────────────

exports.resumenDiario = async (req, res) => {
  const usuario = req.usuario;

  try {
    const contexto = await buildContext(usuario);
    if (!contexto) return res.json({ resumen: null });

    const prompt = `${contexto}El usuario es ${usuario.nombre_completo}, ${usuario.rol}.

Genera un resumen ejecutivo breve del inicio del día. Incluye:
- Alertas críticas si las hay (notas bajo 4.0 o asistencia bajo 85%)
- Situación general actual
- Una recomendación concreta de acción prioritaria para hoy

Formato: lista de máximo 4 puntos con "- " al inicio. Sin saludos ni introducciones. Directo al grano.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 350,
        temperature: 0.3,
      }),
    });

    if (!response.ok) return res.json({ resumen: null });

    const data = await response.json();
    const resumen = data.choices?.[0]?.message?.content || null;
    res.json({ resumen });

  } catch (err) {
    console.error('[AURA] Error resumen diario:', err.message);
    res.json({ resumen: null }); // fallo silencioso
  }
};

// ─── POST /api/aura/chat ─────────────────────────────────────────────────────

exports.chat = async (req, res) => {
  const { mensaje } = req.body;
  const usuario = req.usuario;

  if (!mensaje?.trim()) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
  }

  try {
    // Cargar historial desde BD (últimos 20 turnos)
    const { rows: historialBD } = await db.query(
      `SELECT role, content
       FROM aura_historial
       WHERE id_usuario = $1
       ORDER BY created_at ASC
       LIMIT 20`,
      [usuario.id]
    );

    const contexto = await buildContext(usuario);
    const mensajeConContexto = contexto
      ? `${contexto}El usuario es un ${usuario.rol} llamado ${usuario.nombre_completo}.\n\n${mensaje}`
      : mensaje;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historialBD.map(m => ({ role: m.role, content: m.content })),
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

    // Guardar par usuario/asistente en BD (se guarda el mensaje limpio, sin contexto)
    await db.query(
      `INSERT INTO aura_historial (id_usuario, colegio_id, role, content)
       VALUES ($1, $2, 'user', $3), ($1, $2, 'assistant', $4)`,
      [usuario.id, usuario.colegio_id || null, mensaje, respuesta]
    );

    res.json({ respuesta });

  } catch (err) {
    console.error('[AURA] Error:', err.message);
    res.status(500).json({ error: 'Error al contactar con AURA. Verifica tu conexión.' });
  }
};
