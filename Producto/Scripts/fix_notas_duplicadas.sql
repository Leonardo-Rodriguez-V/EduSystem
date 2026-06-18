-- ================================================================
-- LIMPIEZA DE NOTAS DUPLICADAS — EduSync
-- El seed insertó notas en fechas distintas a las ya existentes
-- (ej: nota original el 11 jun, seed insertó el 12 jun → duplicado).
-- Este script borra SOLO las notas del seed cuando el alumno ya
-- tenía otra nota en la misma asignatura en un rango de ±5 días.
-- ================================================================

-- PASO 1: Previsualizar cuántas notas se van a borrar (sin borrar nada)
SELECT COUNT(*) AS notas_a_eliminar
FROM notas n1
WHERE n1.fecha IN (
  '2026-03-27'::DATE,
  '2026-04-17'::DATE,
  '2026-05-15'::DATE,
  '2026-06-12'::DATE,
  '2026-07-03'::DATE
)
AND n1.descripcion IN (
  'Prueba Unidad 1',
  'Control 1er Semestre',
  'Evaluación Parcial',
  'Prueba Unidad 2',
  'Examen Final 1er Semestre'
)
AND EXISTS (
  SELECT 1 FROM notas n2
  WHERE n2.id_alumno     = n1.id_alumno
    AND n2.id_asignatura = n1.id_asignatura
    AND n2.id           <> n1.id
    AND n2.fecha BETWEEN n1.fecha - INTERVAL '5 days'
                     AND n1.fecha + INTERVAL '5 days'
);

-- ================================================================
-- PASO 2: Ejecutar el borrado (descomenta cuando confirmes el conteo)
-- ================================================================
/*
DELETE FROM notas AS n1
WHERE n1.fecha IN (
  '2026-03-27'::DATE,
  '2026-04-17'::DATE,
  '2026-05-15'::DATE,
  '2026-06-12'::DATE,
  '2026-07-03'::DATE
)
AND n1.descripcion IN (
  'Prueba Unidad 1',
  'Control 1er Semestre',
  'Evaluación Parcial',
  'Prueba Unidad 2',
  'Examen Final 1er Semestre'
)
AND EXISTS (
  SELECT 1 FROM notas n2
  WHERE n2.id_alumno     = n1.id_alumno
    AND n2.id_asignatura = n1.id_asignatura
    AND n2.id           <> n1.id
    AND n2.fecha BETWEEN n1.fecha - INTERVAL '5 days'
                     AND n1.fecha + INTERVAL '5 days'
);
*/

-- PASO 3: Verificación final
SELECT COUNT(*) AS total_notas_restantes FROM notas;
