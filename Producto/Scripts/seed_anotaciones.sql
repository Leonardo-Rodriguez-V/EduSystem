-- ================================================================
-- SEED ANOTACIONES — EduSync (ejecutar por separado)
-- Agrega 15 positivas + 15 negativas usando profesores reales.
-- ================================================================

-- === ANOTACIONES POSITIVAS (tipo = 'observacion') ===
INSERT INTO anotaciones (id_alumno, id_profesor, texto, tipo, fecha)
SELECT
  sub.id_alumno,
  sub.id_profesor,
  sub.texto,
  'observacion',
  ('2026-03-15'::DATE + (FLOOR(RANDOM() * 100))::INT)
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

-- === ANOTACIONES NEGATIVAS (tipo = 'negativa') ===
INSERT INTO anotaciones (id_alumno, id_profesor, texto, tipo, fecha)
SELECT
  sub.id_alumno,
  sub.id_profesor,
  sub.texto,
  'negativa',
  ('2026-03-15'::DATE + (FLOOR(RANDOM() * 100))::INT)
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
  OFFSET 15 LIMIT 15
) sub;

-- Verificación
SELECT tipo, COUNT(*) FROM anotaciones GROUP BY tipo ORDER BY tipo;
