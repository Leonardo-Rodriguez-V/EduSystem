-- ============================================================
-- EduSync - Migración: Modelo Educativo Integral
-- ============================================================

-- 1. Crear tabla de asignaturas
CREATE TABLE IF NOT EXISTS asignaturas (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

-- 2. Crear tabla de relación (el "Vínculo" Maestro)
-- Define quién enseña qué materia en qué curso
CREATE TABLE IF NOT EXISTS curso_asignatura_profesor (
  id             SERIAL PRIMARY KEY,
  id_curso       INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  id_asignatura  INTEGER NOT NULL REFERENCES asignaturas(id) ON DELETE CASCADE,
  id_profesor    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE (id_curso, id_asignatura, id_profesor)
);

-- 3. Modificar tabla de notas para incluir la asignatura
ALTER TABLE notas ADD COLUMN IF NOT EXISTS id_asignatura INTEGER REFERENCES asignaturas(id) ON DELETE SET NULL;

-- 4. Crear tabla de horarios
CREATE TABLE IF NOT EXISTS horarios (
  id             SERIAL PRIMARY KEY,
  id_curso       INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  id_asignatura  INTEGER NOT NULL REFERENCES asignaturas(id) ON DELETE CASCADE,
  dia_semana     INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 5), -- 1: Lunes, 5: Viernes
  bloque_inicio  TIME NOT NULL,
  bloque_fin     TIME NOT NULL
);

-- 5. Crear tabla de evaluaciones (Calendario)
CREATE TABLE IF NOT EXISTS evaluaciones (
  id             SERIAL PRIMARY KEY,
  id_curso       INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  id_asignatura  INTEGER NOT NULL REFERENCES asignaturas(id) ON DELETE CASCADE,
  id_profesor    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo         TEXT NOT NULL,
  descripcion    TEXT,
  fecha          DATE NOT NULL
);

-- 6. Insertar asignaturas básicas según la estructura escolar
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
  ('Educación Ciudadana')
ON CONFLICT (nombre) DO NOTHING;

-- 7. Poblar Educación Parvularia (Ámbitos/Núcleos como asignaturas para simplificar)
INSERT INTO asignaturas (nombre) VALUES
  ('Desarrollo Personal y Social'),
  ('Comunicación Integral'),
  ('Interacción y Comprensión del Entorno')
ON CONFLICT (nombre) DO NOTHING;
