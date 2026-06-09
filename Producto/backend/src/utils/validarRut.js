/**
 * Valida el dígito verificador del RUT chileno.
 * Acepta formatos: "12345678-9", "12.345.678-9", "123456789".
 */
function validarRut(rut) {
  if (!rut || typeof rut !== 'string') return false;
  const limpio = rut.replace(/[\.\-\s]/g, '').toUpperCase();
  if (limpio.length < 2) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv     = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;

  let suma   = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma   += parseInt(cuerpo[i]) * factor;
    factor  = factor === 7 ? 2 : factor + 1;
  }
  const resto      = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dv === dvEsperado;
}

module.exports = { validarRut };
