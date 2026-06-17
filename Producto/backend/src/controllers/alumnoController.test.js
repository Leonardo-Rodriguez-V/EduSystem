import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'module';

/**
 * EduSystem - Pruebas Unitarias del Controlador de Alumnos
 *
 * Usa createRequire para cargar pool y controller desde el caché CJS nativo
 * de Node, garantizando que ambos compartan la MISMA instancia del pool.
 * vi.spyOn intercepta pool.query antes de que el controller lo llame.
 */

// require nativo de Node — misma caché que usa el controlador internamente
const require = createRequire(import.meta.url);
const pool = require('../config/db');
const { crearAlumno } = require('./alumnoController.js');

describe('Pruebas de creación de alumnos con validación de RUT', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe crear un alumno cuando el RUT es válido', async () => {
    vi.spyOn(pool, 'query').mockResolvedValueOnce({
      rows: [
        {
          id: 42,
          nombre_completo: 'Juan Pérez',
          rut: '12.345.678-5',
          fecha_nacimiento: '2010-04-12',
          id_curso: 2,
          colegio_id: 7
        }
      ]
    });

    const req = {
      body: {
        nombre_completo: 'Juan Pérez',
        rut: '12.345.678-5',
        fecha_nacimiento: '2010-04-12',
        id_curso: 2
      },
      usuario: { rol: 'director', colegio_id: 7 }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await crearAlumno(req, res);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO alumnos (nombre_completo, rut, fecha_nacimiento, id_curso, colegio_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['Juan Pérez', '12.345.678-5', '2010-04-12', 2, 7]
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42, nombre_completo: 'Juan Pérez', rut: '12.345.678-5' })
    );
  });

  it('debe rechazar la creación cuando el RUT es inválido y no llamar a la base de datos', async () => {
    const querySpy = vi.spyOn(pool, 'query');

    const req = {
      body: {
        nombre_completo: 'Ana Vargas',
        rut: '12.345.678-9',
        fecha_nacimiento: '2011-08-30',
        id_curso: 3
      },
      usuario: { rol: 'director', colegio_id: 8 }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await crearAlumno(req, res);

    expect(querySpy).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('RUT ingresado no es válido') })
    );
  });
});
