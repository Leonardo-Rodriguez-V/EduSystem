/**
 * EduSystem - Pruebas Automatizadas de Validación de RUT Chileno
 * 
 * Este archivo implementa las pruebas unitarias para el algoritmo Mod11 de
 * validación de RUN/RUT chileno en el backend utilizando Vitest.
 * 
 * NOTA: Se utilizan RUTs reales válidos matemáticamente bajo la fórmula del Módulo 11.
 */

import { describe, it, expect } from 'vitest';
import { validarRut } from './validarRut.js';

describe('=== PRUEBAS DE VALIDACIÓN DE RUT CHILENO ===', () => {
  
  // 1. Casos de éxito (RUTs reales y válidos)
  describe('Casos de Éxito (RUTs válidos)', () => {
    it('Debe validar correctamente un RUT con formato con puntos y guion', () => {
      // 12.345.678-5 es válido
      expect(validarRut('12.345.678-5')).toBe(true);
    });

    it('Debe validar correctamente un RUT con formato sin puntos y con guion', () => {
      // 19.283.746-4 es válido
      expect(validarRut('19283746-4')).toBe(true);
    });

    it('Debe validar correctamente un RUT sin puntos ni guion (formato numérico plano)', () => {
      // 15.234.567-4 es válido
      expect(validarRut('152345674')).toBe(true);
    });

    it('Debe validar un RUT con dígito verificador K en mayúscula', () => {
      // 14.832.915-K es válido (suma = 144, 144 % 11 = 1, 11 - 1 = 10 -> K)
      expect(validarRut('14.832.915-K')).toBe(true);
    });

    it('Debe validar un RUT con dígito verificador K en minúscula (conversión automática)', () => {
      expect(validarRut('14.832.915-k')).toBe(true);
    });

    it('Debe validar correctamente un RUT de menos dígitos (ej. inferior a 10 millones)', () => {
      // 9.876.543-3 es válido
      expect(validarRut('9.876.543-3')).toBe(true);
    });
  });

  // 2. Casos de error (RUTs incorrectos o falsificados)
  describe('Casos de Fallo (RUTs inválidos)', () => {
    it('Debe rechazar un RUT que tenga el dígito verificador incorrecto', () => {
      expect(validarRut('12.345.678-9')).toBe(false); // DV correcto de 12345678 es 5, no 9
    });

    it('Debe rechazar un RUT con formato inválido o caracteres extraños en el cuerpo', () => {
      expect(validarRut('12.3A5.678-9')).toBe(false);
      expect(validarRut('12.345.678-L')).toBe(false);
    });

    it('Debe rechazar un RUT vacío o espacios en blanco', () => {
      expect(validarRut('')).toBe(false);
      expect(validarRut('   ')).toBe(false);
    });

    it('Debe rechazar valores nulos, indefinidos o de tipos de datos incorrectos', () => {
      expect(validarRut(null)).toBe(false);
      expect(validarRut(undefined)).toBe(false);
      expect(validarRut(123456789)).toBe(false); // Número en vez de String
      expect(validarRut({})).toBe(false);
    });
  });
});
