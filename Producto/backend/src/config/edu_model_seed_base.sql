-- ============================================================
-- EduSync - Semilla: Asignaturas Base
-- ============================================================

INSERT INTO asignaturas (nombre) VALUES
  ('Lenguaje y Comunicación'),
  ('Matemática'),
  ('Ciencias Naturales'),
  ('Historia, Geografía y Ciencias Sociales'),
  ('Educación Física y Salud'),
  ('Artes Visuales'),
  ('Música'),
  ('Tecnología'),
  ('Orientación'),
  ('Religión'),
  ('Lengua y Literatura'),
  ('Inglés'),
  ('Biología'),
  ('Física'),
  ('Química'),
  ('Filosofía'),
  ('Educación Ciudadana'),
  ('Desarrollo Personal y Social'),
  ('Comunicación Integral'),
  ('Interacción y Comprensión del Entorno')
ON CONFLICT (nombre) DO NOTHING;
