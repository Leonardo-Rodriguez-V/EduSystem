-- ============================================================
-- EduSystem - Migración: Multi-Tenant (colegios + colegio_id)
-- Fase 1 de 3: Base de datos
-- Fecha: 2026-05
-- ============================================================
-- INSTRUCCIONES:
--   Ejecutar en psql o pgAdmin sobre la BD de producción/dev.
--   Es idempotente: puede correrse más de una vez sin errores.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLA colegios (el tenant)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS colegios (
  id          SERIAL        PRIMARY KEY,
  nombre      VARCHAR(200)  NOT NULL,
  rut         VARCHAR(20)   UNIQUE,
  direccion   TEXT,
  telefono    VARCHAR(20),
  email       VARCHAR(150),
  plan        VARCHAR(50)   NOT NULL DEFAULT 'basico',
  activo      BOOLEAN       NOT NULL DEFAULT true,
  creado_en   TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_plan CHECK (plan IN ('basico', 'profesional', 'enterprise'))
);

-- ────────────────────────────────────────────────────────────
-- 2. Agregar colegio_id a la tabla usuarios
--    NULL permitido → el superadmin no pertenece a ningún colegio
-- ────────────────────────────────────────────────────────────
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS colegio_id INTEGER REFERENCES colegios(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────
-- 3. Agregar colegio_id a tablas relacionadas
--    Para que cada registro quede aislado por colegio
-- ────────────────────────────────────────────────────────────
ALTER TABLE cursos
  ADD COLUMN IF NOT EXISTS colegio_id INTEGER REFERENCES colegios(id) ON DELETE CASCADE;

ALTER TABLE asignaturas
  ADD COLUMN IF NOT EXISTS colegio_id INTEGER REFERENCES colegios(id) ON DELETE CASCADE;

ALTER TABLE alumnos
  ADD COLUMN IF NOT EXISTS colegio_id INTEGER REFERENCES colegios(id) ON DELETE CASCADE;

-- ────────────────────────────────────────────────────────────
-- 4. Agregar rol superadmin al CHECK CONSTRAINT de usuarios
--    (solo si la tabla tiene un constraint de rol)
-- ────────────────────────────────────────────────────────────
-- Nota: Si la tabla usuarios tiene un CHECK en el campo "rol",
-- hay que actualizarlo. Verificar con:
--   \d usuarios
-- Si no tiene constraint, este bloque no es necesario.

-- ────────────────────────────────────────────────────────────
-- 5. Colegio de demo (para desarrollo local)
-- ────────────────────────────────────────────────────────────
INSERT INTO colegios (nombre, rut, direccion, plan)
VALUES ('Colegio Demo EduSystem', '12.345.678-9', 'Av. Principal 123, Santiago', 'profesional')
ON CONFLICT (rut) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 6. Asignar todos los usuarios existentes al colegio demo
--    (solo para entorno de desarrollo — NO en producción sin revisar)
-- ────────────────────────────────────────────────────────────
UPDATE usuarios
SET colegio_id = (SELECT id FROM colegios WHERE rut = '12.345.678-9')
WHERE colegio_id IS NULL
  AND rol IN ('director', 'profesor', 'apoderado');

-- Asignar cursos, asignaturas y alumnos al colegio demo
UPDATE cursos
SET colegio_id = (SELECT id FROM colegios WHERE rut = '12.345.678-9')
WHERE colegio_id IS NULL;

UPDATE asignaturas
SET colegio_id = (SELECT id FROM colegios WHERE rut = '12.345.678-9')
WHERE colegio_id IS NULL;

UPDATE alumnos
SET colegio_id = (SELECT id FROM colegios WHERE rut = '12.345.678-9')
WHERE colegio_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- 7. Verificación final
-- ────────────────────────────────────────────────────────────
SELECT 'colegios'   AS tabla, COUNT(*) AS registros FROM colegios
UNION ALL
SELECT 'usuarios sin colegio_id (deberían ser 0 o solo superadmin)', COUNT(*)
FROM usuarios WHERE colegio_id IS NULL AND rol != 'superadmin';
