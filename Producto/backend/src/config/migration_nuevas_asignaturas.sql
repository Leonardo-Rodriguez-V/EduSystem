-- ============================================================
-- EduSync — Migración: Nuevas asignaturas Enseñanza Media
-- Agrega: Consejo de Curso, Electivo, Taller JEC
-- (Religión y Tecnología ya existen en la tabla)
-- ============================================================

INSERT INTO asignaturas (nombre) VALUES
  ('Consejo de Curso'),
  ('Electivo'),
  ('Taller JEC')
ON CONFLICT (nombre) DO NOTHING;
