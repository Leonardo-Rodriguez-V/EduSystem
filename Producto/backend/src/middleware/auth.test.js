/**
 * EduSystem - Pruebas Automatizadas de Integración y Seguridad
 * 
 * Este archivo implementa el set de pruebas automáticas (operativas, validación y verificación)
 * requeridas en la Evaluación Parcial 2 (IL 2.2 y IL 2.3) utilizando Vitest.
 * Las pruebas están 100% aisladas mediante mocks y no afectan la base de datos de producción.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { verificarToken, verificarRol, verificarTenant, verificarPlan } from './auth.js';

// Mockear variables de entorno para el test
process.env.JWT_SECRET = 'clave_secreta_de_prueba_123';

describe('=== PRUEBAS AUTOMATIZADAS DE SEGURIDAD Y MULTI-TENANT ===', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Inicializar mocks limpios para cada caso de prueba
    req = {
      headers: {},
      usuario: null
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
  });

  // ==========================================
  // 1. PRUEBAS OPERATIVAS Y DE VALIDACIÓN (verificarToken)
  // ==========================================
  describe('Pruebas de Autenticación (verificarToken)', () => {
    it('Debe rechazar la petición con 401 si no se proporciona el token JWT', () => {
      verificarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('token requerido') })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('Debe rechazar la petición con 403 si el token JWT es inválido o está firmado incorrectamente', () => {
      req.headers['authorization'] = 'Bearer token_invalido_alterado';
      verificarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Token inválido') })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('Debe permitir la petición (next) y decodificar req.usuario si el token JWT es válido', () => {
      const payloadPrueba = { id: 1, correo: 'profesor@colegio.cl', rol: 'profesor', colegio_id: 10 };
      const tokenValido = jwt.sign(payloadPrueba, process.env.JWT_SECRET);
      
      req.headers['authorization'] = `Bearer ${tokenValido}`;
      verificarToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.usuario).toBeDefined();
      expect(req.usuario.correo).toBe('profesor@colegio.cl');
      expect(req.usuario.rol).toBe('profesor');
    });
  });

  // ==========================================
  // 2. PRUEBAS DE VERIFICACIÓN DE CONTROL DE ACCESO (verificarRol)
  // ==========================================
  describe('Pruebas de Control de Acceso por Roles (verificarRol)', () => {
    it('Debe rechazar con 401 si el usuario no está autenticado previamente', () => {
      const middleware = verificarRol('director');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('Debe rechazar con 403 si el rol del usuario no coincide con los autorizados', () => {
      req.usuario = { id: 2, rol: 'alumno' }; // Un alumno
      const middleware = verificarRol('director', 'profesor'); // Ruta exclusiva para directores o profesores
      
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('No tienes permiso') })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('Debe permitir continuar (next) si el rol del usuario está autorizado', () => {
      req.usuario = { id: 3, rol: 'profesor' };
      const middleware = verificarRol('director', 'profesor');
      
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // 3. PRUEBAS DE VERIFICACIÓN DE MULTI-TENANCY (verificarTenant)
  // ==========================================
  describe('Pruebas de Aislamiento Multi-tenant (verificarTenant)', () => {
    it('Debe inyectar el colegio_id correspondiente al token del usuario para aislar sus consultas', () => {
      req.usuario = { id: 4, rol: 'director', colegio_id: 15 };
      verificarTenant(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.colegio_id).toBe(15);
      expect(req.esSuperadmin).toBe(false);
    });

    it('Debe inyectar colegio_id = null si el usuario es superadmin para otorgarle acceso global', () => {
      req.usuario = { id: 5, rol: 'superadmin' };
      verificarTenant(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.colegio_id).toBeNull();
      expect(req.esSuperadmin).toBe(true);
    });
  });

  // ==========================================
  // 4. PRUEBAS DE VALIDACIÓN DE SUBSCRIPCIÓN (verificarPlan)
  // ==========================================
  describe('Pruebas de Validación de Planes Avanzados (verificarPlan)', () => {
    it('Debe rechazar con 403 si el plan es básico y la funcionalidad es avanzada', () => {
      req.usuario = { id: 6, rol: 'director', plan: 'basico' };
      verificarPlan(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'plan_requerido' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('Debe permitir acceso si el plan es profesional', () => {
      req.usuario = { id: 7, rol: 'director', plan: 'profesional' };
      verificarPlan(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('Debe permitir acceso si el plan es enterprise', () => {
      req.usuario = { id: 8, rol: 'director', plan: 'enterprise' };
      verificarPlan(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('Debe otorgar acceso ilimitado de plan si el usuario es superadmin', () => {
      req.usuario = { id: 9, rol: 'superadmin', plan: 'basico' }; // superadmin con plan basico teórico
      verificarPlan(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
