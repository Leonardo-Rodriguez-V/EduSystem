-- Agregar columna justificacion a la tabla asistencia
ALTER TABLE asistencia ADD COLUMN IF NOT EXISTS justificacion TEXT;
