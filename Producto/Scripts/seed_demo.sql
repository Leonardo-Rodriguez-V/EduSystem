-- ================================================================
-- SEED DEMO — EduSync
-- Cierre de Semestre 1: Asignaciones, Notas, Asistencia, Anotaciones.
-- Ejecutar EN ORDEN en el SQL Editor de Supabase.
-- SEGURO si ya hay datos: solo inserta lo que falta (NOT EXISTS).
-- ================================================================


-- ================================================================
-- BLOQUE 0 — Vincular profesores a cursos y asignaturas
-- Distribuye los profesores existentes de forma rotativa.
-- Usa ON CONFLICT DO NOTHING (tabla tiene UNIQUE constraint).
-- ================================================================
DO $$
DECLARE
  rec_curso RECORD;
  rec_asig  RECORD;
  profs     UUID[];
  n_prof    INT;
  cnt       INT := 0;
BEGIN
  SELECT ARRAY(SELECT id FROM usuarios WHERE rol = 'profesor' ORDER BY creado_en)
    INTO profs;
  n_prof := COALESCE(array_length(profs, 1), 0);

  IF n_prof = 0 THEN
    RAISE NOTICE '[B0] No hay usuarios con rol=profesor. Crea al menos uno antes de correr este script.';
    RETURN;
  END IF;

  FOR rec_curso IN SELECT id, nombre FROM cursos ORDER BY id LOOP
    FOR rec_asig IN
      SELECT a.id
      FROM asignaturas a
      WHERE
        CASE
          WHEN rec_curso.nombre ILIKE '%Kínder%'
            OR rec_curso.nombre ILIKE '%Pre-K%'
            OR rec_curso.nombre ILIKE '%Parvularia%'
          THEN a.nombre IN (
            'Desarrollo Personal y Social',
            'Comunicación Integral',
            'Interacción y Comprensión del Entorno'
          )
          WHEN rec_curso.nombre ILIKE '%Medio%'
          THEN a.nombre IN (
            'Lengua y Literatura', 'Matemática',
            'Historia, Geografía y Ciencias Sociales',
            'Educación Física y Salud', 'Inglés',
            'Biología', 'Física', 'Química',
            'Filosofía', 'Educación Ciudadana'
          )
          ELSE a.nombre IN (
            'Lenguaje y Comunicación', 'Matemática', 'Ciencias Naturales',
            'Historia, Geografía y Ciencias Sociales',
            'Educación Física y Salud', 'Artes Visuales',
            'Música', 'Tecnología', 'Orientación', 'Inglés'
          )
        END
      ORDER BY a.id
    LOOP
      INSERT INTO curso_asignatura_profesor (id_curso, id_asignatura, id_profesor)
      VALUES (rec_curso.id, rec_asig.id, profs[(cnt % n_prof) + 1])
      ON CONFLICT DO NOTHING;
      cnt := cnt + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE '[B0] Completado: % asignaciones profesor-curso-asignatura.', cnt;
END;
$$;


-- ================================================================
-- BLOQUE 1 — NOTAS (5 evaluaciones → cierre Semestre 1)
-- Solo inserta la combinación alumno+asignatura+fecha que NO existe.
-- De esta forma complementa los datos ya cargados sin duplicar nada.
-- Distribución: ~70 % altas (4.5–7.0), ~20 % medias (3.5–4.4),
--               ~10 % bajas (1.0–3.4) → activan analítica de riesgo.
-- ================================================================
INSERT INTO notas (id_alumno, descripcion, calificacion, fecha, id_asignatura)
SELECT
  a.id,
  ev.nombre_ev,
  ROUND(GREATEST(1.0, LEAST(7.0,
    CASE
      WHEN RANDOM() < 0.10 THEN RANDOM() * 2.4 + 1.0   -- 1.0 – 3.4
      WHEN RANDOM() < 0.30 THEN RANDOM() * 0.9 + 3.5   -- 3.5 – 4.4
      ELSE                      RANDOM() * 2.5 + 4.5   -- 4.5 – 7.0
    END
  ))::NUMERIC, 1),
  ev.fecha_ev,
  cap.id_asignatura
FROM alumnos a
JOIN curso_asignatura_profesor cap ON cap.id_curso = a.id_curso
CROSS JOIN (VALUES
  ('Prueba Unidad 1',            '2026-03-27'::DATE),
  ('Control 1er Semestre',       '2026-04-17'::DATE),
  ('Evaluación Parcial',         '2026-05-15'::DATE),
  ('Prueba Unidad 2',            '2026-06-12'::DATE),
  ('Examen Final 1er Semestre',  '2026-07-03'::DATE)
) AS ev(nombre_ev, fecha_ev)
-- Solo agrega la nota si el alumno NO tiene ninguna nota
-- en esa asignatura para esa fecha exacta
WHERE NOT EXISTS (
  SELECT 1 FROM notas n
  WHERE n.id_alumno     = a.id
    AND n.id_asignatura = cap.id_asignatura
    AND n.fecha         = ev.fecha_ev
);


-- ================================================================
-- BLOQUE 2 — ASISTENCIA (Semestre 1 completo: marzo – julio 2026)
-- Solo inserta los días que el alumno NO tiene registro todavía.
-- Distribución: ~88 % presente, ~5 % tardanza, ~7 % ausente.
-- ~30 % de las ausencias quedan con justificación.
-- ================================================================
INSERT INTO asistencia (id_alumno, fecha, estado)
SELECT
  a.id,
  d.dia,
  CASE
    WHEN RANDOM() < 0.07 THEN 'ausente'
    WHEN RANDOM() < 0.12 THEN 'tardanza'
    ELSE 'presente'
  END
FROM alumnos a
CROSS JOIN (
  SELECT gs::DATE AS dia
  FROM generate_series(
    '2026-03-02'::DATE,   -- Inicio clases marzo
    '2026-07-10'::DATE,   -- Última semana antes de vacaciones invierno
    '1 day'::INTERVAL
  ) AS gs
  WHERE EXTRACT(DOW FROM gs) BETWEEN 1 AND 5  -- Lunes a Viernes
    AND gs::DATE NOT IN (                       -- Feriados Semestre 1
      '2026-04-02',  -- Jueves Santo
      '2026-04-03',  -- Viernes Santo
      '2026-05-01',  -- Día del Trabajo
      '2026-05-21',  -- Glorias Navales
      '2026-06-29'   -- San Pedro y San Pablo
    )
) d
-- Solo agrega si el alumno no tiene registro para ese día
WHERE NOT EXISTS (
  SELECT 1 FROM asistencia asi
  WHERE asi.id_alumno = a.id
    AND asi.fecha     = d.dia
);

-- Justificar ~30 % de las ausencias SIN justificación (nuevas y antiguas)
UPDATE asistencia
SET justificacion = motivos.texto
FROM (
  SELECT
    id,
    (ARRAY[
      'Certificado médico por enfermedad respiratoria',
      'Control médico programado',
      'Fallecimiento de familiar directo',
      'Trámite administrativo urgente con apoderado',
      'Problema de transporte por corte de ruta'
    ])[FLOOR(RANDOM() * 5 + 1)::INT] AS texto
  FROM asistencia
  WHERE estado = 'ausente'
    AND justificacion IS NULL
    AND RANDOM() < 0.30
) AS motivos
WHERE asistencia.id = motivos.id;


-- ================================================================
-- BLOQUE 3 — ANOTACIONES
-- 15 positivas (tipo = 'observacion') + 15 negativas (tipo = 'negativa').
-- El profesor autor es el que hace clases al alumno en ese curso.
-- Se omite si ya existen anotaciones.
-- ================================================================
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM anotaciones) > 0 THEN
    RAISE NOTICE '[B3] La tabla anotaciones ya tiene datos. Saltando bloque.';
    RETURN;
  END IF;

  -- === ANOTACIONES POSITIVAS ===
  INSERT INTO anotaciones (id_alumno, id_profesor, texto, tipo, fecha)
  SELECT
    sub.id_alumno,
    sub.id_profesor,
    sub.texto,
    'observacion',
    ('2026-03-15'::DATE + (FLOOR(RANDOM() * 85))::INT)
  FROM (
    SELECT DISTINCT ON (a.id)
      a.id AS id_alumno,
      cap.id_profesor,
      (ARRAY[
        'Excelente participación en clases, siempre aporta al debate con argumentos bien fundamentados.',
        'Obtuvo el mejor puntaje del curso en la evaluación parcial. Felicitaciones.',
        'Demuestra constancia en la entrega de trabajos y tareas, sin excepciones.',
        'Apoyó a un compañero con dificultades académicas de forma espontánea y empática.',
        'Lideró el trabajo grupal de manera colaborativa, distribuyendo bien las tareas.',
        'Presentó un proyecto de investigación de calidad sobresaliente para su nivel.',
        'Mostró una actitud ejemplar durante la salida pedagógica, siendo referente del curso.',
        'Ha mejorado notablemente su promedio respecto al semestre anterior. Gran esfuerzo.',
        'Demostró habilidades de pensamiento crítico al resolver el problema propuesto.',
        'Transmite entusiasmo y motivación al resto de la clase de manera constante.',
        'Entregó el portafolio completo y bien organizado antes del plazo establecido.',
        'Su presentación oral fue muy clara y bien estructurada. Excelente manejo del tema.',
        'Apoya activamente las actividades del curso y participa en instancias voluntarias.',
        'Actitud proactiva frente a las tareas y consulta oportunamente cuando tiene dudas.',
        'Reconocido por sus compañeros como el mejor compañero de equipo del trimestre.'
      ])[FLOOR(RANDOM() * 15 + 1)::INT] AS texto
    FROM alumnos a
    JOIN curso_asignatura_profesor cap ON cap.id_curso = a.id_curso
    ORDER BY a.id, RANDOM()
    LIMIT 15
  ) sub;

  -- === ANOTACIONES NEGATIVAS ===
  INSERT INTO anotaciones (id_alumno, id_profesor, texto, tipo, fecha)
  SELECT
    sub.id_alumno,
    sub.id_profesor,
    sub.texto,
    'negativa',
    ('2026-03-15'::DATE + (FLOOR(RANDOM() * 85))::INT)
  FROM (
    SELECT DISTINCT ON (a.id)
      a.id AS id_alumno,
      cap.id_profesor,
      (ARRAY[
        'Uso del celular durante la clase sin autorización del docente.',
        'No entregó el trabajo de investigación en la fecha indicada, sin aviso previo.',
        'Interrumpió reiteradamente el desarrollo de la clase con comentarios fuera de lugar.',
        'Se registraron 3 ausencias consecutivas sin justificación del apoderado.',
        'Protagonizó un conflicto verbal con un compañero durante el recreo.',
        'Se detectó copia durante la prueba de unidad. Evaluación anulada, apoderado citado.',
        'Llegó atrasado en 4 ocasiones esta semana, afectando el inicio de las actividades.',
        'No cumplió con los materiales requeridos para la clase práctica.',
        'Abandonó el aula sin autorización durante el desarrollo de la clase.',
        'Fue enviado a Inspectoría por conducta disruptiva reiterada en el recreo.',
        'Incumplimiento reiterado del reglamento de presentación personal.',
        'Mala actitud frente a las indicaciones del docente durante la evaluación oral.',
        'No participó en ninguna actividad grupal de la unidad pese a los recordatorios.',
        'Copió la tarea de un compañero y la presentó como propia.',
        'Agresión verbal hacia un compañero. Se activó protocolo de convivencia escolar.'
      ])[FLOOR(RANDOM() * 15 + 1)::INT] AS texto
    FROM alumnos a
    JOIN curso_asignatura_profesor cap ON cap.id_curso = a.id_curso
    ORDER BY a.id, RANDOM()
    OFFSET 15 LIMIT 15  -- alumnos distintos a los de las positivas
  ) sub;

  RAISE NOTICE '[B3] 30 anotaciones insertadas (15 positivas + 15 negativas).';
END;
$$;


-- ================================================================
-- VERIFICACIÓN FINAL — Resumen de datos insertados
-- ================================================================
SELECT
  'curso_asignatura_profesor' AS tabla, COUNT(*) AS registros FROM curso_asignatura_profesor
UNION ALL
SELECT 'notas',       COUNT(*) FROM notas
UNION ALL
SELECT 'asistencia',  COUNT(*) FROM asistencia
UNION ALL
SELECT 'anotaciones', COUNT(*) FROM anotaciones
ORDER BY tabla;
