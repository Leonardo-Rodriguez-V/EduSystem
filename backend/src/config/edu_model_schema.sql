-- ============================================================
-- EduSync - Migración: Modelo Educativo Integral
-- Solo crea lo que falta; NO toca asignaturas ni horario (ya existen)
-- ============================================================

-- 1. Tabla de relación profesor-asignatura-curso
DROP TABLE IF EXISTS curso_asignatura_profesor CASCADE;

CREATE TABLE curso_asignatura_profesor (
  id             SERIAL PRIMARY KEY,
  id_curso       INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  id_asignatura  INTEGER NOT NULL REFERENCES asignaturas(id) ON DELETE CASCADE,
  id_profesor    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE (id_curso, id_asignatura, id_profesor)
);

-- 2. Agregar columna id_asignatura a notas (si no existe)
ALTER TABLE notas ADD COLUMN IF NOT EXISTS id_asignatura INTEGER REFERENCES asignaturas(id) ON DELETE SET NULL;

-- 3. Tabla de evaluaciones / calendario
CREATE TABLE IF NOT EXISTS evaluaciones (
  id             SERIAL PRIMARY KEY,
  id_curso       INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  id_asignatura  INTEGER NOT NULL REFERENCES asignaturas(id) ON DELETE CASCADE,
  id_profesor    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo         TEXT NOT NULL,
  descripcion    TEXT,
  fecha          DATE NOT NULL
);
