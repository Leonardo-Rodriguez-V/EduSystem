CREATE TABLE IF NOT EXISTS anotaciones (
  id          SERIAL PRIMARY KEY,
  id_alumno   INT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  id_profesor UUID REFERENCES usuarios(id),
  texto       TEXT NOT NULL,
  tipo        VARCHAR(20) DEFAULT 'observacion',
  fecha       DATE DEFAULT CURRENT_DATE,
  creado_en   TIMESTAMP DEFAULT NOW()
);
