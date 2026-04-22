-- ============================================================
-- EduSync - Migración (versión corregida)
-- Solo crea lo que falta, no toca lo que ya existe
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- Agregar columna fecha_nacimiento a alumnos si no existe
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;

-- Crear tabla apoderado_alumno si no existe
CREATE TABLE IF NOT EXISTS apoderado_alumno (
  id            SERIAL PRIMARY KEY,
  id_apoderado  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  id_alumno     INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  UNIQUE (id_apoderado, id_alumno)
);

-- ============================================================
-- Datos de ejemplo (solo si la tabla alumnos está vacía)
-- ============================================================
INSERT INTO alumnos (nombre_completo, rut, fecha_nacimiento, id_curso)
SELECT nombre_completo, rut, fecha_nacimiento, id_curso FROM (VALUES
  ('Lucas González González',  '24.567.123-8', '2015-03-10'::DATE, 1),
  ('Catalina Pérez Muñoz',     '23.456.789-K', '2015-07-22'::DATE, 1),
  ('Martín Rodríguez Soto',    '25.123.456-3', '2015-11-05'::DATE, 1),
  ('Valentina Flores Arce',    '24.789.012-5', '2015-01-18'::DATE, 1),
  ('Benjamín Torres Vega',     '23.901.234-7', '2015-09-30'::DATE, 1)
) AS nuevos(nombre_completo, rut, fecha_nacimiento, id_curso)
WHERE NOT EXISTS (SELECT 1 FROM alumnos LIMIT 1)
ON CONFLICT (rut) DO NOTHING;
